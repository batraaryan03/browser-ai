"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          <strong>browser ai</strong> is an open-source platform for running AI models entirely in your browser.
          No servers, no API keys, no data leaving your device. Every model — from image classification to
          fine-tuned personality chatbots — runs locally via WebGPU or WebAssembly.
        </p>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          The platform is built for two audiences: <strong>users</strong> who want private, free AI tools
          without setup, and <strong>developers/ML engineers</strong> who want to fine-tune, export, and
          deploy custom models for browser-based inference.
        </p>
        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
            Core Principles
          </p>
          <ul className="text-xs text-[var(--fg-muted)] space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-[var(--fg)] mt-0.5">&#8594;</span>
              <span><strong>100% client-side</strong> — All inference runs in the browser tab. Your data never touches a server.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--fg)] mt-0.5">&#8594;</span>
              <span><strong>Zero operating cost</strong> — No API fees, no GPU rentals, no subscriptions. The user&apos;s hardware does the work.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--fg)] mt-0.5">&#8594;</span>
              <span><strong>Privacy by design</strong> — Uploaded images, text, and model files never leave the device.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--fg)] mt-0.5">&#8594;</span>
              <span><strong>Offline capable</strong> — After the initial model download, most features work without internet.</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "architecture",
    title: "Architecture",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          The platform uses two inference engines depending on the model type:
        </p>

        <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border-light)]">
          <div className="px-4 py-3.5">
            <p className="text-xs font-semibold mb-1.5 text-[var(--fg)]">Transformers.js (for standard models)</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Used for: Summarization, Image Classification, Object Detection, Segmentation, OCR.
              Models are downloaded from Hugging Face Hub, cached in the browser Cache API, and
              executed via ONNX Runtime Web.
            </p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs font-semibold mb-1.5 text-[var(--fg)]">Custom ONNX Runtime Web (for fine-tuned models)</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Used for: Personality Chat (fine-tuned SmolLM2). Users upload ONNX model files as ZIP
              archives. A custom BPE tokenizer handles text encoding/decoding.
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          Both engines target <strong>WebGPU</strong> for execution with automatic fallback to
          <strong>WebAssembly (WASM)</strong> on browsers without WebGPU support.
        </p>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Stack
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[var(--fg-muted)]">
            {[
              { label: "Framework", value: "Next.js 16 (React 19)" },
              { label: "Styling", value: "Tailwind CSS v4" },
              { label: "Animation", value: "Framer Motion" },
              { label: "Inference Engine", value: "ONNX Runtime Web v1.27+" },
              { label: "Transformers", value: "@huggingface/transformers v4" },
              { label: "Fine-tuning", value: "Unsloth + LoRA (Python)" },
              { label: "ONNX Export", value: "optimum-cli (Python)" },
              { label: "Zip Extraction", value: "fflate (browser)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-2 py-0.5">
                <span className="text-[var(--fg-subtle)] shrink-0">{label}:</span>
                <span className="font-medium text-[var(--fg)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "personality-pipeline",
    title: "Personality Training Pipeline",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          The personality training pipeline fine-tunes SmolLM2-360M-Instruct on custom text using
          LoRA (Low-Rank Adaptation) with Unsloth. The entire pipeline runs on the user&apos;s GPU or
          Google Colab.
        </p>

        <p className="text-xs font-semibold text-[var(--fg)]">Step-by-step flow:</p>
        <div className="space-y-0">
          {[
            {
              step: "Prepare training data",
              detail: "Export any text (book, articles, chat logs) as a .txt file. 50K+ characters recommended for good results.",
            },
            {
              step: "Run smol_lora_train.py",
              detail: "The script loads SmolLM2-360M-Instruct in 4-bit NF4 quantization via Unsloth, applies LoRA adapters (rank 16), and trains on the text using SFTTrainer from TRL. Training typically takes 5-15 minutes on a laptop GPU.",
            },
            {
              step: "Merge adapters",
              detail: "After training, the LoRA adapters are merged into the base model and saved as a full-precision PyTorch model (~700 MB).",
            },
            {
              step: "Export to ONNX",
              detail: "With the --export-onnx flag, the script runs optimum-cli to export the merged model to ONNX format with KV-cache support.",
            },
            {
              step: "Upload to browser",
              detail: "The ONNX model files are zipped automatically. Upload this ZIP to the browser Chat page for local inference.",
            },
            {
              step: "Chat entirely in browser",
              detail: "All inference runs locally via WebGPU/WASM. The BPE tokenizer and KV-cache engine handle generation with streaming output.",
            },
          ].map(({ step, detail }, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-[var(--border-light)] last:border-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--fg)] text-white text-[10px] font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-semibold text-[var(--fg)]">{step}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "training-script",
    title: "Training Script Reference",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded text-[var(--fg)] font-mono text-xs">train/smol_lora_train.py</code> is the main training script.
          It uses Unsloth for efficient 4-bit LoRA fine-tuning and optionally exports to ONNX for browser inference.
        </p>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Arguments
          </p>
          <div className="space-y-2 text-xs">
            {[
              { arg: "data", desc: "Path to training text file (.txt) — required", default: "—" },
              { arg: "output", desc: "Output directory", default: "./output" },
              { arg: "steps", desc: "Number of training steps", default: "60" },
              { arg: "lora-rank", desc: "LoRA rank (higher = more capacity, more memory)", default: "16" },
              { arg: "max-seq-length", desc: "Maximum sequence length in tokens", default: "2048" },
              { arg: "batch-size", desc: "Per-device training batch size", default: "2" },
              { arg: "learning-rate", desc: "Learning rate for LoRA adapters", default: "2e-4" },
              { arg: "export-onnx", desc: "Export merged model to ONNX for browser inference", default: "False" },
            ].map(({ arg, desc, default: def }) => (
              <div key={arg} className="flex items-start gap-2 py-1">
                <code className="bg-white border border-[var(--border-light)] px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--fg)] shrink-0">
                  --{arg}
                </code>
                <span className="text-[var(--fg-muted)]">{desc}</span>
                {def !== "\u2014" && (
                  <span className="text-[var(--fg-subtle)] shrink-0 font-mono text-[10px]">({def})</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-[var(--fg)]">Example commands:</p>
        <div className="bg-[var(--fg)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            <span className="text-[10px] text-white/40 font-mono ml-2">Terminal</span>
          </div>
          <pre className="text-xs leading-relaxed text-white/90 font-mono px-4 pb-4 overflow-x-auto">
{`# Basic training (no ONNX export)
python train/smol_lora_train.py --data ./my-book.txt --steps 60

# Training + ONNX export for browser
python train/smol_lora_train.py --data ./my-book.txt --steps 60 --export-onnx

# Custom hyperparameters
python train/smol_lora_train.py --data ./my-book.txt \\
  --steps 120 --lora-rank 32 --learning-rate 3e-4`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: "onnx-export",
    title: "ONNX Export Details",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          The ONNX export is the critical bridge between Python training and browser inference.
          Here is exactly what happens and how the exported model is structured.
        </p>

        <p className="text-xs font-semibold text-[var(--fg)]">Export command:</p>
        <div className="bg-[var(--fg)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-xs leading-relaxed text-white/90 font-mono px-4 pb-4 overflow-x-auto">
optimum-cli export onnx --model ./output/personality --task text-generation-with-past ./output/personality-onnx/</pre>
        </div>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Files produced
          </p>
          <div className="space-y-2 text-xs text-[var(--fg-muted)]">
            {[
              { file: "model.onnx", desc: "The core computation graph with weights. This is what onnxruntime-web loads." },
              { file: "config.json", desc: "Model architecture hyperparameters. Required by OnnxChat." },
              { file: "tokenizer.json", desc: "BPE tokenizer vocabulary and merge rules. Parsed by the browser-side BPETokenizer." },
              { file: "tokenizer_config.json", desc: "Tokenizer metadata including chat template (ChatML format)." },
            ].map(({ file, desc }) => (
              <div key={file} className="flex items-start gap-2">
                <code className="bg-white border border-[var(--border-light)] px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--fg)] shrink-0">
                  {file}
                </code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Tensor input/output names
          </p>
          <div className="space-y-2 text-xs text-[var(--fg-muted)]">
            <p className="font-semibold text-[var(--fg)]">Inputs:</p>
            {[
              { name: "input_ids", shape: "[batch, seq_len]", dtype: "int64", desc: "Token IDs for the input text" },
              { name: "attention_mask", shape: "[batch, seq_len]", dtype: "int64", desc: "1 for real tokens, 0 for padding" },
              { name: "past_key_values.{i}.key", shape: "[batch, num_heads, past_len, head_dim]", dtype: "float16", desc: "KV cache for layer i" },
              { name: "past_key_values.{i}.value", shape: "[batch, num_heads, past_len, head_dim]", dtype: "float16", desc: "KV cache for layer i" },
            ].map(({ name, shape, dtype, desc }) => (
              <div key={name} className="flex items-start gap-2 py-0.5">
                <code className="text-[10px] font-mono text-[var(--fg)]">{name}</code>
                <span className="text-[var(--fg-subtle)] text-[10px] font-mono">{shape}</span>
                <span className="text-[var(--fg-subtle)] text-[10px] font-mono">{dtype}</span>
                <span className="text-[var(--fg-subtle)]">— {desc}</span>
              </div>
            ))}
            <p className="font-semibold text-[var(--fg)] mt-3">Outputs:</p>
            {[
              { name: "logits", shape: "[batch, seq_len, vocab_size]", dtype: "float16", desc: "Raw prediction scores" },
              { name: "present.{i}.key", shape: "[batch, num_heads, total_len, head_dim]", dtype: "float16", desc: "Updated KV cache for layer i" },
              { name: "present.{i}.value", shape: "[batch, num_heads, total_len, head_dim]", dtype: "float16", desc: "Updated KV cache for layer i" },
            ].map(({ name, shape, dtype, desc }) => (
              <div key={name} className="flex items-start gap-2 py-0.5">
                <code className="text-[10px] font-mono text-[var(--fg)]">{name}</code>
                <span className="text-[var(--fg-subtle)] text-[10px] font-mono">{shape}</span>
                <span className="text-[var(--fg-subtle)] text-[10px] font-mono">{dtype}</span>
                <span className="text-[var(--fg-subtle)]">— {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "browser-inference",
    title: "Browser Inference Engine",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          The browser inference engine is implemented in two core libraries:
          <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded font-mono text-xs">src/lib/onnx-chat.ts</code> and
          <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded font-mono text-xs">src/lib/bpe-tokenizer.ts</code>.
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--fg)] mb-1.5">OnnxChat class</p>
            <div className="text-xs text-[var(--fg-muted)] space-y-1.5 leading-relaxed bg-[var(--bg-alt)] rounded-xl px-4 py-3">
              <p>
                Handles session creation from uploaded ArrayBuffer, KV-cached generation with
                dynamic prefix detection, temperature + top-p sampling, repetition penalty,
                streaming via callback, abort support, and event loop yielding.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--fg)] mb-1.5">BPETokenizer class</p>
            <div className="text-xs text-[var(--fg-muted)] space-y-1.5 leading-relaxed bg-[var(--bg-alt)] rounded-xl px-4 py-3">
              <p>
                Implements GPT-2-style ByteLevel BPE tokenization: pre-tokenization via regex,
                greedy BPE merging, bytes_to_unicode mapping, ChatML template support, and
                special token handling.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Performance characteristics (SmolLM2-360M)
          </p>
          <div className="space-y-1.5 text-xs text-[var(--fg-muted)]">
            {[
              { metric: "Model size (FP16)", value: "~720 MB" },
              { metric: "Model size (INT8)", value: "~360 MB" },
              { metric: "Desktop WebGPU", value: "30-60 tok/s" },
              { metric: "Laptop WASM", value: "2-10 tok/s" },
              { metric: "Mobile WASM", value: "1-3 tok/s" },
              { metric: "Session creation (cold)", value: "2-10s" },
              { metric: "VRAM usage (WebGPU)", value: "~800 MB" },
            ].map(({ metric, value }) => (
              <div key={metric} className="flex justify-between py-0.5 border-b border-[var(--border-light)] last:border-0">
                <span>{metric}</span>
                <span className="font-mono text-[10px] text-[var(--fg)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "models-registry",
    title: "Model Registry",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          All available models are registered in <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded font-mono text-xs">src/lib/models.ts</code>.
        </p>

        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-alt)] border-b border-[var(--border)]">
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Model</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Engine</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Task</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {[
                  { slug: "summarize", model: "T5-small (60M)", engine: "Transformers.js", task: "text2text-generation", size: "308 MB" },
                  { slug: "remove-bg", model: "RMBG-1.4", engine: "ONNX Runtime", task: "background-removal", size: "44 MB" },
                  { slug: "classify", model: "ViT-base (86M)", engine: "Transformers.js", task: "image-classification", size: "80 MB" },
                  { slug: "detect", model: "YOLOS-tiny (5M)", engine: "Transformers.js", task: "object-detection", size: "40 MB" },
                  { slug: "segment", model: "SegFormer-B0 (3.8M)", engine: "Transformers.js", task: "image-segmentation", size: "15 MB" },
                  { slug: "chat", model: "SmolLM2-360M", engine: "Custom ONNX + BPE", task: "text-generation", size: "User upload" },
                ].map(({ slug, model, engine, task, size }) => (
                  <tr key={slug} className="hover:bg-[var(--bg-alt)] transition-colors duration-150">
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[10px] text-[var(--fg)]">{slug}</code>
                      <span className="ml-2 text-[var(--fg-muted)]">{model}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{engine}</td>
                    <td className="px-4 py-2.5"><code className="font-mono text-[10px] text-[var(--fg-muted)]">{task}</code></td>
                    <td className="px-4 py-2.5 text-right font-mono text-[10px] text-[var(--fg-muted)]">{size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "research",
    title: "Research & Alternatives",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          Extensive research validated the browser-based ONNX inference approach.
          Key findings and alternatives considered.
        </p>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-3">
            Approach comparison
          </p>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white border-b border-[var(--border)]">
                  <th className="px-3 py-2 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Approach</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Format</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Upload</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--fg)] text-[10px] uppercase tracking-wider">Perf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {[
                  { approach: "ONNX Runtime Web (chosen)", format: "ONNX", upload: "✅ ArrayBuffer", perf: "High (WebGPU)" },
                  { approach: "Transformers.js", format: "ONNX", upload: "⚠️ Limited API", perf: "High" },
                  { approach: "Wllama (llama.cpp WASM)", format: "GGUF", upload: "✅ File object", perf: "High" },
                  { approach: "Raw WebGPU compute", format: "Custom", upload: "❌ Not supported", perf: "Highest" },
                ].map(({ approach, format, upload, perf }) => (
                  <tr key={approach} className="hover:bg-white transition-colors duration-150">
                    <td className="px-3 py-2 text-[var(--fg)]">{approach}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-[var(--fg-muted)]">{format}</td>
                    <td className="px-3 py-2 text-[var(--fg-muted)]">{upload}</td>
                    <td className="px-3 py-2 text-[var(--fg-muted)]">{perf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "api-reference",
    title: "API Reference",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          Reference documentation for the core browser-side libraries.
        </p>

        <div className="space-y-3">
          <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-[var(--fg)] mb-1.5">
              OnnxChat.create(onnxBuffer, configJson, tokenizerJson)
            </p>
            <div className="text-xs text-[var(--fg-muted)] space-y-1">
              <p>Creates an OnnxChat instance from uploaded model data.</p>
              <ul className="space-y-0.5 ml-3">
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">onnxBuffer</code>: ArrayBuffer — contents of model.onnx</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">configJson</code>: ModelConfig — parsed config.json</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">tokenizerJson</code>: TokenizerConfig — parsed tokenizer.json</li>
                <li>Returns: <code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">Promise&lt;OnnxChat&gt;</code></li>
              </ul>
            </div>
          </div>

          <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-[var(--fg)] mb-1.5">
              OnnxChat.generate(message, options?)
            </p>
            <div className="text-xs text-[var(--fg-muted)] space-y-1">
              <p>Generates a response to a user message.</p>
              <ul className="space-y-0.5 ml-3">
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">message</code>: string — the user input</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">options.maxTokens</code>: number (default 256)</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">options.temperature</code>: number (default 0.7)</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">options.topP</code>: number (default 0.9)</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">options.onToken</code>: (partial: string) =&gt; void — streaming callback</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">options.signal</code>: AbortSignal — cancellation</li>
                <li>Returns: <code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">Promise&lt;string&gt;</code></li>
              </ul>
            </div>
          </div>

          <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-[var(--fg)] mb-1.5">
              new BPETokenizer(tokenizerJson)
            </p>
            <div className="text-xs text-[var(--fg-muted)] space-y-1">
              <p>Creates a BPE tokenizer from a Hugging Face tokenizer.json config.</p>
              <ul className="space-y-0.5 ml-3">
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">encode(text)</code>: number[] — encode text to token IDs</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">decode(ids)</code>: string — decode token IDs to text</li>
                <li><code className="bg-white border border-[var(--border-light)] px-1 rounded font-mono text-[10px]">applyChatTemplate(messages)</code>: string — format conversation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "webgpu-setup",
    title: "WebGPU & Cross-Origin Isolation",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          ONNX Runtime Web with WebGPU requires <strong>Cross-Origin Isolation</strong> to enable
          <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded font-mono text-xs">SharedArrayBuffer</code>.
        </p>

        <div className="bg-[var(--bg-alt)] rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-2">
            Required HTTP headers
          </p>
          <div className="bg-[var(--fg)] rounded-lg px-4 py-3">
            <pre className="text-xs text-white/90 font-mono leading-relaxed">
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp</pre>
          </div>
        </div>

        <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
          On Vercel, configure these in <code className="bg-[var(--bg-alt)] px-1.5 py-0.5 rounded font-mono text-xs">vercel.json</code>.
          When WebGPU is unavailable, the engine falls back to WASM (slower but functional).
        </p>
      </div>
    ),
  },
  {
    id: "faq",
    title: "FAQ",
    content: (
      <div className="space-y-3">
        {[
          {
            q: "Does the personality model actually learn my writing style?",
            a: "Yes. The LoRA fine-tuning trains SmolLM2 on your text using causal language modeling. The more training text you provide (50K+ characters recommended), the better the model adopts your vocabulary, sentence structure, and tone.",
          },
          {
            q: "Is my data sent to any server?",
            a: "No. Everything runs locally. Training happens on your GPU or Google Colab (with your consent). Inference happens entirely in your browser. Your data never leaves your device.",
          },
          {
            q: "Will this work on my phone?",
            a: "Desktop with WebGPU works well (30-60 tok/s). Mobile Chrome may work but with higher memory pressure. iOS Safari falls back to WASM (1-3 tok/s). INT8 quantization recommended for mobile.",
          },
          {
            q: "How do I share my trained personality?",
            a: "Share the personality-onnx.zip file. Others can upload it to their own browser-ai Chat page and run inference entirely in their browser — no server needed.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="border border-[var(--border)] rounded-xl px-4 py-3.5 space-y-1.5 hover:border-[var(--fg-subtle)] transition-colors duration-150">
            <p className="text-xs font-semibold text-[var(--fg)]">Q: {q}</p>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "development",
    title: "Development Guide",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          Setting up the project for local development.
        </p>

        <p className="text-xs font-semibold text-[var(--fg)]">Frontend (Next.js)</p>
        <div className="bg-[var(--fg)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-xs leading-relaxed text-white/90 font-mono px-4 pb-4 overflow-x-auto">
{`# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript check & build
npx tsc --noEmit
npm run build`}
          </pre>
        </div>

        <p className="text-xs font-semibold text-[var(--fg)]">Training pipeline (Python)</p>
        <div className="bg-[var(--fg)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <pre className="text-xs leading-relaxed text-white/90 font-mono px-4 pb-4 overflow-x-auto">
{`# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install training dependencies
pip install unsloth trl accelerate torch transformers datasets

# Train a personality model
python train/smol_lora_train.py --data ./my-book.txt \\
  --steps 60 --export-onnx`}
          </pre>
        </div>
      </div>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1">
        <div className="content-container pt-12 pb-20">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="text-center space-y-3 pb-8"
            >
              <div className="inline-flex items-center gap-1.5 bg-[var(--fg)]/5 px-3 py-1.5 rounded-full">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--fg)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)]">
                  documentation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--fg)]">
                Developer Docs
              </h1>
              <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto leading-relaxed">
                Architecture, research, and API reference for browser-native AI inference.
                Written for developers and ML engineers.
              </p>
            </motion.div>

            {/* Table of contents */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-xl border border-[var(--border)] px-5 py-4 mb-6"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)] mb-2">On this page</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors duration-150 py-0.5"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Content sections */}
            <div className="space-y-4">
              {sections.map((section, i) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.02, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-white rounded-xl border border-[var(--border)] scroll-mt-16 overflow-hidden"
                >
                  <div className="border-b border-[var(--border-light)] px-5 py-3.5">
                    <h2 className="text-sm font-bold text-[var(--fg)]">{section.title}</h2>
                  </div>
                  <div className="px-5 py-4">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] px-5 py-4 mt-6 text-center">
              <p className="text-xs text-[var(--fg-subtle)]">
                Last updated: June 2026 &middot;{" "}
                <a
                  href="https://github.com/batraaryan03/browser-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--fg-muted)] hover:text-[var(--fg)] underline underline-offset-2 transition-colors duration-150"
                >
                  View source on GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
