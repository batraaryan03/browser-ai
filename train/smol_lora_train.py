"""
browser-ai: SmolLM2 LoRA Personality Trainer
=============================================

Fine-tunes SmolLM2-360M-Instruct on your text to create a unique
personality. The model learns to respond in the writing style and
vocabulary of your training text.

Requirements:
    pip install unsloth trl accelerate torch transformers

Usage:
    python train/smol_lora_train.py --data ./my-book.txt --export-onnx

Output:
    output/personality/          ← merged model directory (PyTorch)
    output/personality-onnx/     ← ONNX export (for browser inference)

The ONNX model can be uploaded to the browser Chat page for
fully client-side inference — no server needed:
    https://browser-ai.vercel.app/models/chat

Or use the Colab notebook:
    https://colab.research.google.com/github/batraaryan03/browser-ai/
    blob/main/train/smol_lora_train.ipynb
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

# ─── Unsloth imports ──────────────────────────────────────────────────

try:
    import torch
    from unsloth import FastLanguageModel, is_bfloat16_supported
    from unsloth.chat_templates import get_chat_template
    from datasets import Dataset
    from trl import SFTTrainer
    from transformers import TrainingArguments
    HAS_UNSLOTH = True
except ImportError:
    HAS_UNSLOTH = False


def parse_args():
    parser = argparse.ArgumentParser(description="SmolLM2 LoRA Personality Trainer")
    parser.add_argument("--data", required=True, help="Path to training text file (.txt)")
    parser.add_argument("--output", default="./output", help="Output directory (default: ./output)")
    parser.add_argument("--lora-rank", type=int, default=16, help="LoRA rank (default: 16)")
    parser.add_argument("--max-seq-length", type=int, default=2048, help="Max sequence length (default: 2048)")
    parser.add_argument("--batch-size", type=int, default=2, help="Per-device batch size (default: 2)")
    parser.add_argument("--learning-rate", type=float, default=2e-4, help="Learning rate (default: 2e-4)")
    parser.add_argument("--steps", type=int, default=60, help="Training steps (default: 60)")
    parser.add_argument("--export-onnx", action="store_true", help="Also export to ONNX format")
    return parser.parse_args()


def format_training_data(text: str, max_seq_length: int = 2048):
    """
    Split training text into overlapping chunks for causal language modeling.
    
    The model learns to predict the next token in the text, which teaches it
    the writing style, vocabulary, and patterns of the training text.
    
    Each chunk is a raw text segment that the model learns to complete.
    """
    # Tokenize the full text to estimate chunk sizes
    # We split by words for simplicity
    words = text.split()
    
    # Estimate tokens per word (~1.3 tokens/word for English)
    tokens_per_word = 1.3
    words_per_chunk = int(max_seq_length / tokens_per_word) - 30  # safety margin for BPE tokenizers
    
    if words_per_chunk < 10:
        words_per_chunk = 10
    
    overlap_words = words_per_chunk // 4
    step = words_per_chunk - overlap_words
    
    samples = []
    for i in range(0, len(words) - words_per_chunk + 1, step):
        chunk = " ".join(words[i:i + words_per_chunk])
        if len(chunk) < 100:
            continue
        samples.append({"text": chunk})
    
    if not samples:
        # Text is too short, use it as-is
        samples.append({"text": text})
    
    return samples


def train(args):
    """Run LoRA training with Unsloth."""
    if not HAS_UNSLOTH:
        print("=" * 60)
        print("  browser-ai SmolLM2 Personality Trainer")
        print("=" * 60)
        print()
        print("  ⚠  Unsloth not installed. Installing now...")
        print()
        print("     pip install unsloth trl accelerate torch transformers")
        print()
        print("  Or use Google Colab:")
        print("     https://colab.research.google.com/github/batraaryan03/browser-ai/")
        print("     blob/main/train/smol_lora_train.ipynb")
        print()
        return 1
    
    # Verify data file
    if not os.path.exists(args.data):
        print(f"❌ Data file not found: {args.data}")
        return 1
    
    # Read training text
    with open(args.data, "r", encoding="utf-8") as f:
        raw_text = f.read()
    
    print(f"📄 Loaded {len(raw_text)} characters from {args.data}")
    print(f"   Words: {len(raw_text.split())}")
    print()
    
    # Format training data
    print("🔄 Formatting training data...")
    samples = format_training_data(raw_text)
    print(f"   Created {len(samples)} training samples")
    print()
    
    if len(samples) < 5:
        print("❌ Too few training samples. Provide more text.")
        return 1
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # ─── Load model ───────────────────────────────────────────────────
    print("🚀 Loading SmolLM2-360M-Instruct with Unsloth...")
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/SmolLM2-360M-Instruct",
        max_seq_length=args.max_seq_length,
        dtype=None,  # Auto-detect
        load_in_4bit=True,  # 4-bit NF4 quantization saves VRAM
    )
    
    print("   ✓ Model loaded")
    
    # Apply chat template
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="chatml",  # SmolLM2's built-in chat template
    )
    
    # ─── Add LoRA adapters ────────────────────────────────────────────
    print("🔧 Adding LoRA adapters...")
    
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_rank,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=args.lora_rank,
        lora_dropout=0,  # Optimized for Unsloth
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )
    
    print(f"   ✓ LoRA rank={args.lora_rank}, {sum(p.numel() for p in model.parameters()):,} total params")
    
    # ─── Prepare dataset ──────────────────────────────────────────────
    # Samples are raw text chunks — SFTTrainer uses dataset_text_field directly
    dataset = Dataset.from_list(samples)
    
    print(f"   ✓ Dataset ready: {len(dataset)} training chunks")
    print()
    
    # ─── Training ────────────────────────────────────────────────────
    print("🏋️  Starting training...")
    print(f"   Steps: {args.steps}")
    print(f"   Batch size: {args.batch_size}")
    print(f"   Learning rate: {args.learning_rate}")
    print()
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        args=TrainingArguments(
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            max_steps=args.steps,
            learning_rate=args.learning_rate,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir=os.path.join(args.output, "checkpoints"),
            save_strategy="no",  # 👈 Add this line here
            report_to="none",
        ),
    )
    
    start_time = time.time()
    trainer.train()
    elapsed = time.time() - start_time
    
    print()
    print(f"✓ Training complete in {elapsed / 60:.1f} minutes!")
    print()
    
    # ─── Save merged model ────────────────────────────────────────────
    print("💾 Saving merged model...")
    
    merged_path = os.path.join(args.output, "personality")
    model.save_pretrained_merged(
        merged_path,
        tokenizer,
        save_method="merged_16bit",
    )
    
    print(f"   ✓ Merged model saved to: {merged_path}")
    print(f"   Size: {sum(f.stat().st_size for f in Path(merged_path).rglob('*')) / 1e6:.0f} MB")
    print()
    
    # ─── Save metadata ───────────────────────────────────────────────
    metadata = {
        "type": "personality-model",
        "base_model": "unsloth/SmolLM2-360M-Instruct",
        "char_count": len(raw_text),
        "word_count": len(raw_text.split()),
        "training_samples": len(samples),
        "lora_rank": args.lora_rank,
        "steps": args.steps,
        "training_minutes": round(elapsed / 60, 1),
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "style_description": f"Trained on {len(raw_text):,} chars of text. Adopts the writing style, vocabulary, and tone of the training text.",
    }
    
    meta_path = os.path.join(args.output, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📋 Metadata saved to: {meta_path}")
    print()
    
    # ─── Export to ONNX (optional) ───────────────────────────────────
    if args.export_onnx:
        print("🔄 Exporting to ONNX for browser inference...")
        onnx_path = os.path.join(args.output, "personality-onnx")
        export_ok = False

        # Strategy 1: Try optimum-cli directly (works if venv matches)
        try:
            cmd = [
                "optimum-cli", "export", "onnx",
                "--model", merged_path,
                "--task", "text-generation-with-past",
                onnx_path,
            ]
            print(f"   Trying: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                export_ok = True
            else:
                # Clean up partial export
                if os.path.exists(onnx_path):
                    shutil.rmtree(onnx_path, ignore_errors=True)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

        # Strategy 2: Spawn a temporary venv with compatible torch
        if not export_ok:
            export_ok = export_onnx_via_venv(merged_path, onnx_path)

        # ─── Report result ────────────────────────────────────────
        if export_ok:
            print(f"   ✓ ONNX exported to: {onnx_path}")
            size_mb = sum(f.stat().st_size for f in Path(onnx_path).rglob("*")) / 1e6
            print(f"   Size: {size_mb:.0f} MB")

            # Create a ZIP for easy browser upload
            zip_path = os.path.join(args.output, "personality-onnx.zip")
            shutil.make_archive(
                os.path.join(args.output, "personality-onnx"),
                "zip",
                onnx_path,
            )
            zip_size = os.path.getsize(zip_path) / 1e6
            print(f"   📦 Zipped: {zip_path} ({zip_size:.0f} MB)")
        else:
            print(f"   ⚠  All ONNX export strategies failed.")
            print(f"   The merged PyTorch model is still available at {merged_path}.")
            print()
            print(f"   To export manually, run on a machine with torch >= 2.11:")
            print(f"   optimum-cli export onnx --model {merged_path} --task text-generation-with-past {onnx_path}")

    print()
    print("=" * 60)
    print("  ✅ Pipeline complete!")
    print("=" * 60)
    print()
    print(f"  Next steps:")
    print()
    if args.export_onnx:
        print(f"  1. Open https://browser-ai.100xsystems.dev/models/chat")
        print(f"  2. Upload the {os.path.join(args.output, 'personality-onnx.zip')} file")
        print(f"  3. Chat with your personality!")
    else:
        print(f"  1. Re-run with --export-onnx to get a browser-compatible model")
        print(f"  2. Or use the PyTorch model at {merged_path} for local inference")
    print()
    print(f"  All inference runs in your browser — no server needed.")
    print()
    
    return 0


def _create_venv(venv_path: str) -> tuple[str, str] | None:
    """
    Create a Python virtual environment, returning (pip_path, python_path).

    Tries multiple strategies because Colab does not ship python3-venv:
      1. python3 -m venv (standard, works on most local machines)
      2. virtualenv (pip-installable, works on Colab)

    Returns None if all strategies fail.
    """
    def _bin_paths(base: str) -> tuple[str, str]:
        if sys.platform == "win32":
            return (os.path.join(base, "Scripts", "pip"),
                    os.path.join(base, "Scripts", "python"))
        return (os.path.join(base, "bin", "pip"),
                os.path.join(base, "bin", "python"))

    # Strategy 1: python3 -m venv
    try:
        subprocess.run(
            [sys.executable, "-m", "venv", venv_path],
            check=True, capture_output=True, timeout=30,
        )
        return _bin_paths(venv_path)
    except Exception:
        pass

    # Strategy 2: pip install virtualenv, then use it
    try:
        print(f"   python3 -m venv not available, trying virtualenv...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", "virtualenv"],
            check=True, capture_output=True, timeout=60,
        )
        subprocess.run(
            [sys.executable, "-m", "virtualenv", venv_path],
            check=True, capture_output=True, timeout=30,
        )
        return _bin_paths(venv_path)
    except Exception:
        return None


def export_onnx_via_venv(merged_path: str, onnx_path: str) -> bool:
    """
    Export to ONNX using an isolated temporary venv.

    This avoids the dependency conflict between unsloth (needs torch < 2.11)
    and optimum (needs torch >= 2.11 on newer versions). By creating a
    throwaway venv with its own torch 2.11, both sides are happy.

    Returns True on success, False on failure.
    """
    venv_path = "/tmp/onnx-export-venv"
    print(f"   🔄 Creating isolated venv at {venv_path}...")

    # Clean up any stale venv from a previous run
    if os.path.exists(venv_path):
        shutil.rmtree(venv_path, ignore_errors=True)

    try:
        # Step 1: Create venv (try multiple strategies)
        paths = _create_venv(venv_path)
        if paths is None:
            print("   ⚠  Could not create virtual environment (try 'pip install virtualenv' first)")
            return False
        pip_path, python_path = paths

        # Step 2: Upgrade pip inside venv
        subprocess.run(
            [pip_path, "install", "--quiet", "--upgrade", "pip"],
            check=True, capture_output=True, timeout=60,
        )

        # Step 3: Install torch 2.11 + optimum[onnx]
        print(f"   📦 Installing torch 2.11 + optimum[onnx] in venv...")
        subprocess.run(
            [pip_path, "install", "--quiet",
             "torch", "torchvision", "torchaudio",
             "--index-url", "https://download.pytorch.org/whl/cu128"],
            check=True, capture_output=True, timeout=300,
        )
        subprocess.run(
            [pip_path, "install", "--quiet", "optimum[onnx]"],
            check=True, capture_output=True, timeout=120,
        )

        # Step 4: Run optimum-cli export (stream output so user sees progress)
        print(f"   🏗️  Running optimum-cli export...")
        cmd = [
            python_path, "-m", "optimum.cli", "export", "onnx",
            "--model", merged_path,
            "--task", "text-generation-with-past",
            onnx_path,
        ]

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Stream output line by line
        for line in process.stdout or []:
            line = line.rstrip()
            if line:
                print(f"     {line}")

        process.wait()

        if process.returncode != 0:
            print(f"   ❌ optimum-cli failed with exit code {process.returncode}")
            if os.path.exists(onnx_path):
                shutil.rmtree(onnx_path, ignore_errors=True)
            return False

        # Verify the output directory has files
        if not os.path.exists(onnx_path) or not any(
            f.endswith(".onnx") for f in os.listdir(onnx_path)
        ):
            print(f"   ❌ No .onnx files found in output directory")
            return False

        return True

    except subprocess.TimeoutExpired:
        print(f"   ⏱️  Venv export timed out")
        return False
    except Exception as e:
        print(f"   ⚠  Venv export failed: {e}")
        return False
    finally:
        # Always clean up the temporary venv
        if os.path.exists(venv_path):
            shutil.rmtree(venv_path, ignore_errors=True)
            print(f"   🧹 Cleaned up temporary venv")


if __name__ == "__main__":
    args = parse_args()
    sys.exit(train(args))
