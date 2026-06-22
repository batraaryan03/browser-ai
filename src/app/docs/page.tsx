"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const ARCH_IMAGE = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80&fm=webp&fit=crop";
const NEURAL_IMAGE = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=80&fm=webp&fit=crop";

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          <strong>browser ai</strong> is an open-source platform for running AI models entirely in your browser.
          No servers, no API keys, no data leaving your device. Every model runs locally via WebGPU or WebAssembly.
        </p>
        <div className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-[var(--bg-alt)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${ARCH_IMAGE})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="text-xs font-medium text-white/80">Browser-native AI inference — no servers, no latency</span>
          </div>
        </div>
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          Built for two audiences: <strong>users</strong> who want private, free AI tools without setup, and
          <strong>developers/ML engineers</strong> who want to fine-tune, export, and deploy custom models for
          browser-based inference.
        </p>
        <div className="bg-[var(--bg-alt)] rounded-2xl px-6 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Core Principles</p>
          <ul className="text-sm text-[var(--fg-muted)] space-y-2">
            {[
              "100% client-side — All inference runs in the browser tab. Your data never touches a server.",
              "Zero operating cost — No API fees, no GPU rentals, no subscriptions.",
              "Privacy by design — Uploaded data and model files never leave your device.",
              "Offline capable — After initial download, most features work without internet.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[var(--fg)] mt-1">&#8594;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "architecture",
    title: "Architecture",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">The platform uses two inference engines depending on the model type:</p>

        <div className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-[var(--bg-alt)] mb-4">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${NEURAL_IMAGE})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="text-xs font-medium text-white/80">ONNX Runtime Web — two engines, one platform</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] divide-y divide-[var(--border-light)]">
          <div className="px-6 py-4">
            <p className="text-sm font-semibold mb-2 text-[var(--fg)]">Transformers.js (standard models)</p>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Used for: Summarization, Image Classification, Object Detection, Segmentation, OCR.
              Models are downloaded from Hugging Face Hub and executed via ONNX Runtime Web.
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm font-semibold mb-2 text-[var(--fg)]">Custom ONNX Runtime Web (fine-tuned models)</p>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Used for: Personality Chat. Users upload ONNX model files as ZIP archives.
              A custom BPE tokenizer handles text encoding/decoding.
            </p>
          </div>
        </div>
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          Both engines target <strong>WebGPU</strong> with automatic fallback to <strong>WebAssembly (WASM)</strong>.
        </p>
        <div className="bg-[var(--bg-alt)] rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">Stack</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm text-[var(--fg-muted)]">
            {[
              ["Framework", "Next.js 16 (React 19)"],
              ["Styling", "Tailwind CSS v4"],
              ["Animation", "Framer Motion"],
              ["Inference", "ONNX Runtime Web v1.27+"],
              ["Transformers", "@huggingface/transformers v4"],
              ["Fine-tuning", "Unsloth + LoRA (Python)"],
              ["ONNX Export", "optimum-cli (Python)"],
              ["Zip", "fflate (browser)"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-[var(--fg-subtle)]">{label}</span>
                <span className="font-medium text-[var(--fg)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "pipeline",
    title: "Training Pipeline",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          Fine-tune SmolLM2-360M-Instruct on custom text using LoRA with Unsloth. Runs on your GPU or Google Colab.
        </p>
        <div className="space-y-0">
          {[
            { step: "Prepare data", detail: "Export text as a .txt file. 50K+ characters recommended." },
            { step: "Train", detail: "Loads SmolLM2 in 4-bit NF4 via Unsloth, applies LoRA (rank 16), trains with SFTTrainer. Takes 5-15 min." },
            { step: "Merge", detail: "LoRA adapters are merged into the base model and saved as PyTorch (~700 MB)." },
            { step: "Export ONNX", detail: "Runs optimum-cli to export to ONNX with KV-cache support." },
            { step: "Upload", detail: "The ONNX files are zipped automatically. Upload to the Chat page." },
            { step: "Chat", detail: "All inference runs locally via WebGPU/WASM. Streaming, KV-cache, temperature sampling." },
          ].map(({ step, detail }, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-[var(--border-light)] last:border-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--fg)] text-white text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--fg)]">{step}</p>
                <p className="text-sm text-[var(--fg-muted)] mt-0.5 leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "script",
    title: "Training Script",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          <code className="bg-[var(--bg-alt)] px-2 py-0.5 rounded font-mono text-sm">train/smol_lora_train.py</code> is the main training script. Uses Unsloth for 4-bit LoRA fine-tuning with optional ONNX export.
        </p>
        <p className="text-sm font-semibold text-[var(--fg)]">Arguments</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ["--data", "Path to training text file", "required"],
            ["--output", "Output directory", "./output"],
            ["--steps", "Training steps", "60"],
            ["--lora-rank", "LoRA rank", "16"],
            ["--batch-size", "Per-device batch size", "2"],
            ["--learning-rate", "Learning rate", "2e-4"],
            ["--export-onnx", "Export to ONNX for browser", "False"],
          ].map(([arg, desc, defVal]) => (
            <div key={arg} className="flex items-start gap-3 bg-[var(--bg-alt)] rounded-xl px-4 py-3">
              <code className="font-mono text-sm text-[var(--fg)] shrink-0">{arg}</code>
              <div>
                <p className="text-sm text-[var(--fg-muted)]">{desc}</p>
                {defVal !== "required" && <p className="text-xs text-[var(--fg-subtle)] font-mono mt-0.5">default: {defVal}</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-[var(--fg)]">Example</p>
        <div className="bg-[var(--fg)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-5 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-sm leading-relaxed text-white/90 font-mono px-5 pb-5 overflow-x-auto">{`python train/smol_lora_train.py --data ./my-book.txt --steps 60 --export-onnx`}</pre>
        </div>
      </div>
    ),
  },
  {
    id: "export",
    title: "ONNX Export",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">
          The ONNX export bridges Python training and browser inference. Here is how the exported model is structured.
        </p>
        <div className="bg-[var(--bg-alt)] rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">Files produced</p>
          <div className="space-y-3 text-sm text-[var(--fg-muted)]">
            {[
              ["model.onnx", "The core computation graph with weights."],
              ["config.json", "Model architecture hyperparameters."],
              ["tokenizer.json", "BPE tokenizer vocabulary and merge rules."],
              ["tokenizer_config.json", "Tokenizer metadata and chat template."],
            ].map(([file, desc]) => (
              <div key={file} className="flex items-start gap-3">
                <code className="font-mono text-sm text-[var(--fg)] shrink-0">{file}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--bg-alt)] rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">Tensor names</p>
          <div className="space-y-3 text-sm text-[var(--fg-muted)]">
            <p className="font-semibold text-[var(--fg)]">Inputs:</p>
            {[
              ["input_ids", "[batch, seq_len]", "Token IDs"],
              ["attention_mask", "[batch, seq_len]", "Padding mask"],
              ["past_key_values.{i}.key/.value", "[batch, heads, past_len, dim]", "KV cache (optional)"],
            ].map(([name, shape, desc]) => (
              <div key={name} className="flex items-start gap-3">
                <code className="font-mono text-sm text-[var(--fg)]">{name}</code>
                <span className="text-[var(--fg-subtle)] font-mono text-xs">{shape}</span>
                <span className="text-[var(--fg-subtle)]">— {desc}</span>
              </div>
            ))}
            <p className="font-semibold text-[var(--fg)] mt-4">Outputs:</p>
            {[
              ["logits", "[batch, seq_len, vocab_size]", "Prediction scores"],
              ["present.{i}.key/.value", "[batch, heads, total_len, dim]", "Updated KV cache"],
            ].map(([name, shape, desc]) => (
              <div key={name} className="flex items-start gap-3">
                <code className="font-mono text-sm text-[var(--fg)]">{name}</code>
                <span className="text-[var(--fg-subtle)] font-mono text-xs">{shape}</span>
                <span className="text-[var(--fg-subtle)]">— {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "faq",
    title: "FAQ",
    content: (
      <div className="space-y-4">
        {[
          { q: "Does the personality model learn my writing style?", a: "Yes. LoRA fine-tuning trains the model on your text using causal language modeling. 50K+ characters recommended." },
          { q: "Is my data sent anywhere?", a: "No. Everything runs locally — training on your GPU or Colab, inference in your browser." },
          { q: "Will this work on my phone?", a: "Desktop WebGPU works well (30-60 tok/s). Mobile is more limited — INT8 models help." },
          { q: "How do I share my trained personality?", a: "Share the personality-onnx.zip file. Others upload it to their own Chat page." },
        ].map(({ q, a }, i) => (
          <div key={i} className="border border-[var(--border)] rounded-2xl px-6 py-4 hover:border-[var(--fg-subtle)] transition-colors duration-150">
            <p className="text-sm font-semibold text-[var(--fg)] mb-1">Q: {q}</p>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "setup",
    title: "Setup",
    content: (
      <div className="space-y-5">
        <p className="text-base text-[var(--fg-muted)] leading-relaxed">Setting up the project for local development.</p>
        <p className="text-sm font-semibold text-[var(--fg)]">Frontend (Next.js)</p>
        <div className="bg-[var(--fg)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-5 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-sm leading-relaxed text-white/90 font-mono px-5 pb-5 overflow-x-auto">{`npm install\nnpm run dev`}</pre>
        </div>
        <p className="text-sm font-semibold text-[var(--fg)]">Training (Python)</p>
        <div className="bg-[var(--fg)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-5 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-sm leading-relaxed text-white/90 font-mono px-5 pb-5 overflow-x-auto">{`pip install unsloth trl accelerate torch transformers\ntrain/smol_lora_train.py --data ./my-book.txt --steps 60 --export-onnx`}</pre>
        </div>
      </div>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-6 sm:px-10 pt-12 pb-20">
          {/* Header */}
          <div className="mb-12 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--fg)]">
              Developer Docs
            </h1>
            <p className="mt-3 text-base text-[var(--fg-muted)] leading-relaxed max-w-xl">
              Architecture, research, and API reference for browser-native AI inference.
            </p>
          </div>

          {/* TOC */}
          <div className="flex flex-wrap gap-2 mb-12">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] px-4 py-2 rounded-lg bg-[var(--bg-alt)] hover:bg-[var(--border)] transition-all duration-150"
              >
                {s.title}
              </a>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6 max-w-4xl">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white rounded-2xl border border-[var(--border)] scroll-mt-16 overflow-hidden"
              >
                <div className="border-b border-[var(--border-light)] px-6 py-4">
                  <h2 className="text-lg font-bold text-[var(--fg)]">{section.title}</h2>
                </div>
                <div className="px-6 py-5">{section.content}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--fg-subtle)]">
              Last updated: June 2026 &middot;{" "}
              <a href="https://github.com/batraaryan03/browser-ai" target="_blank" rel="noopener noreferrer" className="text-[var(--fg-muted)] hover:text-[var(--fg)] underline transition-colors">
                View source on GitHub
              </a>
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
