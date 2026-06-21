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
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>browser ai</strong> is an open-source platform for running AI models entirely in your browser.
          No servers, no API keys, no data leaving your device. Every model — from image classification to
          fine-tuned personality chatbots — runs locally via WebGPU or WebAssembly.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          The platform is built for two audiences: <strong>users</strong> who want private, free AI tools
          without setup, and <strong>developers/ML engineers</strong> who want to fine-tune, export, and
          deploy custom models for browser-based inference.
        </p>
        <div className="bg-black/[0.02] px-4 py-3 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Core Principles</p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li><strong>100% client-side</strong> — All inference runs in the browser tab. Your data never touches a server.</li>
            <li><strong>Zero operating cost</strong> — No API fees, no GPU rentals, no subscriptions. The user's hardware does the work.</li>
            <li><strong>Privacy by design</strong> — Uploaded images, text, and model files never leave the device.</li>
            <li><strong>Offline capable</strong> — After the initial model download, most features work without internet.</li>
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
        <p className="text-sm text-gray-600 leading-relaxed">
          The platform uses two inference engines depending on the model type:
        </p>

        <div className="border border-black/[0.06] divide-y divide-black/[0.04]">
          <div className="px-4 py-3">
            <p className="text-xs font-medium mb-1">Transformers.js (for standard models)</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Used for: Summarization, Image Classification, Object Detection, Segmentation, OCR.
              Models are downloaded from Hugging Face Hub, cached in the browser Cache API, and
              executed via ONNX Runtime Web. The library handles tokenization, model loading,
              and post-processing automatically.
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium mb-1">Custom ONNX Runtime Web (for fine-tuned models)</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Used for: Personality Chat (fine-tuned SmolLM2). Users upload ONNX model files as ZIP
              archives. The <code className="bg-black/[0.04] px-1">OnnxChat</code> class loads the model
              directly from <code className="bg-black/[0.04] px-1">ArrayBuffer</code> via
              <code className="bg-black/[0.04] px-1">ort.InferenceSession.create()</code>, while a
              custom BPE tokenizer handles text encoding/decoding. This approach avoids Transformers.js
              pipeline limitations when loading models from user uploads.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Both engines target <strong>WebGPU</strong> for execution with automatic fallback to
          <strong>WebAssembly (WASM)</strong> on browsers without WebGPU support (Firefox, Safari).
        </p>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Stack</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
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
              <div key={label} className="flex items-start gap-2">
                <span className="text-gray-300 shrink-0">{label}:</span>
                <span>{value}</span>
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
        <p className="text-sm text-gray-600 leading-relaxed">
          The personality training pipeline fine-tunes SmolLM2-360M-Instruct on custom text using
          LoRA (Low-Rank Adaptation) with Unsloth. The entire pipeline runs on the user's GPU or
          Google Colab.
        </p>

        <p className="text-xs font-medium text-gray-600">Step-by-step flow:</p>
        <ol className="space-y-3">
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
              detail: "With the --export-onnx flag, the script runs optimum-cli to export the merged model to ONNX format with KV-cache support (text-generation-with-past task). The ONNX export is ~360 MB in INT8 or ~720 MB in FP16.",
            },
            {
              step: "Upload to browser",
              detail: "The ONNX model files are zipped automatically. The user uploads this ZIP to the browser Chat page, where onnxruntime-web loads the model directly from the ArrayBuffer.",
            },
            {
              step: "Chat entirely in browser",
              detail: "All inference runs locally via WebGPU/WASM. The BPE tokenizer reads tokenizer.json from the uploaded ZIP. Text generation uses KV-cache for efficiency, temperature/top-p sampling, and streaming token callback for real-time display.",
            },
          ].map(({ step, detail }, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="text-black shrink-0 font-medium w-5">{i + 1}.</span>
              <div>
                <span className="font-medium text-gray-600">{step}</span>
                <p className="mt-0.5">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: "training-script",
    title: "Training Script Reference",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          <code className="bg-black/[0.04] px-1">train/smol_lora_train.py</code> is the main training script.
          It uses Unsloth for efficient 4-bit LoRA fine-tuning and optionally exports to ONNX for browser inference.
        </p>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Arguments</p>
          <div className="space-y-2 text-xs">
            {[
              { arg: "--data", desc: "Path to training text file (.txt) — required", default: "—" },
              { arg: "--output", desc: "Output directory", default: "./output" },
              { arg: "--steps", desc: "Number of training steps", default: "60" },
              { arg: "--lora-rank", desc: "LoRA rank (higher = more capacity, more memory)", default: "16" },
              { arg: "--max-seq-length", desc: "Maximum sequence length in tokens", default: "2048" },
              { arg: "--batch-size", desc: "Per-device training batch size", default: "2" },
              { arg: "--learning-rate", desc: "Learning rate for LoRA adapters", default: "2e-4" },
              { arg: "--export-onnx", desc: "Export merged model to ONNX for browser inference", default: "False" },
            ].map(({ arg, desc, default: def }) => (
              <div key={arg} className="flex items-start gap-2">
                <code className="bg-black/[0.04] px-1 shrink-0 font-mono">--{arg}</code>
                <span className="text-gray-500">{desc}</span>
                {def !== "—" && <span className="text-gray-300 shrink-0">(default: {def})</span>}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-medium text-gray-600">Example commands:</p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
{`# Basic training (no ONNX export)
python train/smol_lora_train.py --data ./my-book.txt --steps 60

# Training + ONNX export for browser
python train/smol_lora_train.py --data ./my-book.txt --steps 60 --export-onnx

# Custom hyperparameters
python train/smol_lora_train.py --data ./my-book.txt \\
  --steps 120 --lora-rank 32 --learning-rate 3e-4 --batch-size 4

# Only export to ONNX (model already trained)
optimum-cli export onnx --model ./output/personality \\
  --task text-generation-with-past ./output/personality-onnx/`}
        </pre>
      </div>
    ),
  },
  {
    id: "onnx-export",
    title: "ONNX Export Details",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          The ONNX export is the critical bridge between Python training and browser inference.
          Here is exactly what happens and how the exported model is structured.
        </p>

        <p className="text-xs font-medium text-gray-600">Export command:</p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
optimum-cli export onnx --model ./output/personality --task text-generation-with-past ./output/personality-onnx/</pre>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Files produced</p>
          <div className="space-y-2 text-xs text-gray-500">
            {[
              { file: "model.onnx", desc: "The core computation graph with weights. This is what onnxruntime-web loads." },
              { file: "config.json", desc: "Model architecture hyperparameters (num_layers, num_heads, hidden_size, vocab_size). Required by OnnxChat." },
              { file: "tokenizer.json", desc: "BPE tokenizer vocabulary and merge rules in Hugging Face format. Parsed by the browser-side BPETokenizer." },
              { file: "tokenizer_config.json", desc: "Tokenizer metadata including chat template (ChatML format). Used by serve.py (legacy)." },
              { file: "model.onnx_data", desc: "External data file — only created when model exceeds 2GB protobuf limit. Unlikely for SmolLM2-360M." },
            ].map(({ file, desc }) => (
              <div key={file} className="flex items-start gap-2">
                <code className="bg-black/[0.04] px-1 shrink-0 font-mono text-[10px]">{file}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Tensor input/output names</p>
          <div className="space-y-2 text-xs text-gray-500">
            <p className="font-medium text-gray-600">Inputs:</p>
            {[
              { name: "input_ids", shape: "[batch, seq_len]", dtype: "int64", desc: "Token IDs for the input text" },
              { name: "attention_mask", shape: "[batch, seq_len]", dtype: "int64", desc: "1 for real tokens, 0 for padding" },
              { name: "past_key_values.{i}.key", shape: "[batch, num_heads, past_len, head_dim]", dtype: "float16", desc: "KV cache for layer i (optional on first pass)" },
              { name: "past_key_values.{i}.value", shape: "[batch, num_heads, past_len, head_dim]", dtype: "float16", desc: "KV cache for layer i (optional on first pass)" },
            ].map(({ name, shape, dtype, desc }) => (
              <div key={name} className="flex items-start gap-2 font-mono text-[10px]">
                <span className="text-gray-600 shrink-0">{name}</span>
                <span className="text-gray-300">{shape}</span>
                <span className="text-gray-300">{dtype}</span>
                <span className="text-gray-400 font-sans">— {desc}</span>
              </div>
            ))}
            <p className="font-medium text-gray-600 mt-3">Outputs:</p>
            {[
              { name: "logits", shape: "[batch, seq_len, vocab_size]", dtype: "float16", desc: "Raw prediction scores for each token position" },
              { name: "present.{i}.key", shape: "[batch, num_heads, total_len, head_dim]", dtype: "float16", desc: "Updated KV cache for layer i (feeds back as past_key_values)" },
              { name: "present.{i}.value", shape: "[batch, num_heads, total_len, head_dim]", dtype: "float16", desc: "Updated KV cache for layer i" },
            ].map(({ name, shape, dtype, desc }) => (
              <div key={name} className="flex items-start gap-2 font-mono text-[10px]">
                <span className="text-gray-600 shrink-0">{name}</span>
                <span className="text-gray-300">{shape}</span>
                <span className="text-gray-300">{dtype}</span>
                <span className="text-gray-400 font-sans">— {desc}</span>
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
        <p className="text-sm text-gray-600 leading-relaxed">
          The browser inference engine is implemented in two core libraries:
          <code className="bg-black/[0.04] px-1">src/lib/onnx-chat.ts</code> and
          <code className="bg-black/[0.04] px-1">src/lib/bpe-tokenizer.ts</code>.
        </p>

        <p className="text-xs font-medium text-gray-600">OnnxChat class</p>
        <div className="text-xs text-gray-500 space-y-2 leading-relaxed">
          <p>
            The <code className="bg-black/[0.04] px-1">OnnxChat</code> class wraps ONNX Runtime Web's
            <code className="bg-black/[0.04] px-1">InferenceSession</code> and provides a high-level
            <code className="bg-black/[0.04] px-1">generate()</code> method that handles:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Session creation</strong> from uploaded ArrayBuffer with WebGPU/WASM fallback</li>
            <li><strong>KV-cached generation</strong> — first pass processes full prompt, subsequent passes only process the latest token, reusing cached key/value tensors for O(n) instead of O(n²) complexity</li>
            <li><strong>Dynamic KV prefix detection</strong> — detects whether the ONNX model uses <code className="bg-black/[0.04] px-1">present.*</code> or <code className="bg-black/[0.04] px-1">past_key_values.*</code> naming by inspecting result keys after the first forward pass</li>
            <li><strong>Temperature + top-p sampling</strong> with numerically stable softmax (explicit max subtraction)</li>
            <li><strong>Repetition penalty</strong> applied to logits before sampling</li>
            <li><strong>Streaming via callback</strong> — <code className="bg-black/[0.04] px-1">onToken</code> fires with partial decoded text after every token</li>
            <li><strong>Abort support</strong> via <code className="bg-black/[0.04] px-1">AbortSignal</code> for cancellation</li>
            <li><strong>Event loop yielding</strong> every 4 tokens to keep the UI responsive during generation</li>
          </ul>
        </div>

        <p className="text-xs font-medium text-gray-600 mt-3">BPETokenizer class</p>
        <div className="text-xs text-gray-500 space-y-2 leading-relaxed">
          <p>
            The <code className="bg-black/[0.04] px-1">BPETokenizer</code> implements a minimal
            GPT-2-style ByteLevel BPE tokenizer that parses Hugging Face's
            <code className="bg-black/[0.04] px-1">tokenizer.json</code> format directly:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Pre-tokenization</strong> using GPT-2's regex pattern (splits on whitespace with byte-level encoding)</li>
            <li><strong>BPE merge</strong> via greedy priority-ordered pair merging using the merge table from tokenizer.json</li>
            <li><strong>bytes_to_unicode</strong> mapping for GPT-2-style byte encoding/decoding</li>
            <li><strong>ChatML template</strong> for formatting conversation turns with <code className="bg-black/[0.04] px-1">&lt;|im_start|&gt;</code> / <code className="bg-black/[0.04] px-1">&lt;|im_end|&gt;</code> markers</li>
            <li><strong>Special token handling</strong> for BOS, EOS, PAD, and UNK tokens</li>
          </ul>
        </div>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Performance characteristics (SmolLM2-360M)</p>
          <div className="space-y-2 text-xs text-gray-500">
            {[
              { metric: "Model size (FP16)", value: "~720 MB" },
              { metric: "Model size (INT8)", value: "~360 MB" },
              { metric: "Desktop WebGPU speed", value: "30-60 tok/s" },
              { metric: "Laptop WASM speed", value: "2-10 tok/s" },
              { metric: "Mobile WASM speed", value: "1-3 tok/s" },
              { metric: "Session creation (cold)", value: "2-10s (shader compilation)" },
              { metric: "Session creation (warm)", value: "<1s (cached)" },
              { metric: "VRAM usage (desktop WebGPU)", value: "~800 MB" },
              { metric: "RAM usage (WASM)", value: "~1.2 GB" },
            ].map(({ metric, value }) => (
              <div key={metric} className="flex justify-between">
                <span className="text-gray-600">{metric}</span>
                <span className="font-mono text-[10px]">{value}</span>
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
        <p className="text-sm text-gray-600 leading-relaxed">
          All available models are registered in <code className="bg-black/[0.04] px-1">src/lib/models.ts</code>.
          Each model has a slug, name, description, category, repo path, size, task type, and capability flags.
        </p>

        <div className="border border-black/[0.06] divide-y divide-black/[0.04]">
          {[
            {
              slug: "summarize",
              model: "T5-small (60M)",
              engine: "Transformers.js",
              task: "text2text-generation",
              size: "308 MB",
              offline: true,
            },
            {
              slug: "remove-bg",
              model: "RMBG-1.4",
              engine: "ONNX Runtime Web",
              task: "background-removal",
              size: "44 MB",
              offline: true,
            },
            {
              slug: "classify",
              model: "ViT-base (86M)",
              engine: "Transformers.js",
              task: "image-classification",
              size: "80 MB",
              offline: true,
            },
            {
              slug: "detect",
              model: "YOLOS-tiny (5M)",
              engine: "Transformers.js",
              task: "object-detection",
              size: "40 MB",
              offline: true,
            },
            {
              slug: "segment",
              model: "SegFormer-B0 (3.8M)",
              engine: "Transformers.js",
              task: "image-segmentation",
              size: "15 MB",
              offline: true,
            },
            {
              slug: "chat",
              model: "SmolLM2-360M (fine-tuned)",
              engine: "Custom ONNX + BPE Tokenizer",
              task: "text-generation",
              size: "User upload",
              offline: true,
            },
          ].map(({ slug, model, engine, task, size, offline }) => (
            <div key={slug} className="px-4 py-2.5 grid grid-cols-5 gap-2 text-xs text-gray-500">
              <code className="font-mono text-[10px] text-gray-600">{slug}</code>
              <span>{model}</span>
              <span className="text-gray-400">{engine}</span>
              <code className="font-mono text-[10px]">{task}</code>
              <span className="text-right">{offline ? "✅" : "❌"} {size}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          The registry uses a <code className="bg-black/[0.04] px-1">getEnabledModels()</code> filter that
          only returns models with <code className="bg-black/[0.04] px-1">enabled: true</code>. This allows
          disabling incomplete models (like OCR) while keeping them in the catalog for future development.
        </p>
      </div>
    ),
  },
  {
    id: "browser-training",
    title: "Browser-Based Training",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          For lightweight personality training entirely in the browser (no GPU needed), the platform
          includes a character-level LSTM trainer at <code className="bg-black/[0.04] px-1">/models/train/browser</code>.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          This is a simplified training approach that learns character-level patterns from text. While much
          less capable than the full LoRA + SmolLM2 pipeline, it requires zero setup, runs entirely in
          the browser via TensorFlow.js or a pure JS implementation, and works on any device including phones.
          Results are exported as a JSON weights file that can be imported later.
        </p>
      </div>
    ),
  },
  {
    id: "colab-notebook",
    title: "Google Colab Notebook",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          For users without a local GPU, the <code className="bg-black/[0.04] px-1">train/smol_lora_train.ipynb</code>
          notebook provides the same training pipeline on Google Colab&apos;s free T4 GPU (~5-10 minutes training time).
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://colab.research.google.com/github/batraaryan03/browser-ai/blob/main/train/smol_lora_train.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 text-xs font-medium hover:opacity-85 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Open in Colab
          </a>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          The notebook installs all dependencies (Unsloth, TRL, optimum), uploads the user&apos;s .txt file,
          runs LoRA training, exports to ONNX, and provides the output ZIP for download.
        </p>
      </div>
    ),
  },
  {
    id: "webgpu-setup",
    title: "WebGPU & Cross-Origin Isolation",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          ONNX Runtime Web with WebGPU requires <strong>Cross-Origin Isolation</strong> to enable
          <code className="bg-black/[0.04] px-1">SharedArrayBuffer</code>, which is critical for
          multi-threaded performance.
        </p>

        <div className="bg-black/[0.02] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">Required HTTP headers</p>
          <pre className="text-xs leading-relaxed text-gray-500 font-mono">
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp</pre>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          On Vercel, these can be configured in <code className="bg-black/[0.04] px-1">vercel.json</code>:
        </p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
{`{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}`}</pre>

        <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
          <p className="font-medium text-gray-600">Browser support for WebGPU:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>✅ Chrome 113+ — Full support</li>
            <li>✅ Edge 113+ — Full support (Chromium)</li>
            <li>⚠️ Firefox — Behind flag (gfx.webgpu.enabled)</li>
            <li>⚠️ Safari 16.4+ — Experimental, limited support</li>
            <li>❌ iOS Safari — Known issues with COOP/COEP initialization</li>
          </ul>
          <p className="mt-2">When WebGPU is unavailable, the engine falls back to WASM (slower but functional).</p>
        </div>
      </div>
    ),
  },
  {
    id: "research",
    title: "Research & Alternatives",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Extensive research was conducted to validate the browser-based ONNX inference approach.
          Here are the key findings and alternatives considered.
        </p>

        <p className="text-xs font-medium text-gray-600">Approach comparison</p>
        <div className="border border-black/[0.06] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/[0.02] border-b border-black/[0.06]">
                <th className="px-3 py-2 text-left font-medium text-gray-600">Approach</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Format</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Custom model upload</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Performance</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Maturity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {[
                { approach: "ONNX Runtime Web (chosen)", format: "ONNX (.onnx)", upload: "✅ ArrayBuffer via ZIP", perf: "High (WebGPU)", maturity: "Production-ready" },
                { approach: "Transformers.js pipeline", format: "ONNX (.onnx)", upload: "⚠️ No direct ArrayBuffer API", perf: "High (WebGPU)", maturity: "Production-ready" },
                { approach: "Wllama (llama.cpp WASM)", format: "GGUF (.gguf)", upload: "✅ File object direct", perf: "High (WebGPU)", maturity: "Production-ready" },
                { approach: "Raw WebGPU compute", format: "Custom", upload: "❌ Not supported", perf: "Highest", maturity: "Experimental" },
              ].map(({ approach, format, upload, perf, maturity }) => (
                <tr key={approach}>
                  <td className="px-3 py-2 text-gray-600">{approach}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{format}</td>
                  <td className="px-3 py-2">{upload}</td>
                  <td className="px-3 py-2">{perf}</td>
                  <td className="px-3 py-2">{maturity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-medium text-gray-600 mt-3">Key research findings</p>
        <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
          <p>
            <strong>1. Transformers.js pipeline limitation:</strong> The
            <code className="bg-black/[0.04] px-1">pipeline()</code> function does not accept custom
            file loaders or ArrayBuffer inputs. It expects model IDs (strings) that resolve to Hugging Face
            Hub or filesystem paths. Loading from user uploads requires the raw
            <code className="bg-black/[0.04] px-1">onnxruntime-web</code> approach.
          </p>
          <p>
            <strong>2. Transformers.js AutoTokenizer works standalone:</strong> The
            <code className="bg-black/[0.04] px-1">AutoTokenizer</code> and
            <code className="bg-black/[0.04] px-1">PreTrainedTokenizer</code> classes can be used
            independently to load tokenizer data from JSON objects. This is a viable replacement for the
            custom BPE tokenizer if more tokenizer types need to be supported.
          </p>
          <p>
            <strong>3. Wllama is a strong alternative:</strong> For LLM-focused use cases,
            <a href="https://github.com/ngxson/wllama" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-black transition-colors">Wllama</a>
            (llama.cpp WebAssembly bindings) supports loading GGUF files directly from browser
            <code className="bg-black/[0.04] px-1">File</code> objects, has mature WebGPU support, and
            requires no ONNX conversion step.
          </p>
          <p>
            <strong>4. Browser memory is viable for 360M models:</strong> Modern 64-bit browsers can
            allocate ArrayBuffers up to 4GB. A 360M parameter model in INT8 (~360 MB) fits comfortably
            in browser memory on desktop. Mobile browsers are more constrained (~1GB tab limit) but still
            viable with INT8 quantization.
          </p>
          <p>
            <strong>5. ONNX input/output naming is standardized but varies:</strong> Optimum&apos;s
            <code className="bg-black/[0.04] px-1">text-generation-with-past</code> task produces
            <code className="bg-black/[0.04] px-1">{'{present.{i}.key}'}</code> as output names and expects
            <code className="bg-black/[0.04] px-1">{'past_key_values.{i}.key'}</code> as input names.
            Other exporters may differ, so dynamic detection from session outputs is essential.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "development",
    title: "Development Guide",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Setting up the project for local development.
        </p>

        <p className="text-xs font-medium text-gray-600">Frontend (Next.js)</p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
{`# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript check
npx tsc --noEmit

# Production build
npm run build`}</pre>

        <p className="text-xs font-medium text-gray-600">Training pipeline (Python)</p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
{`# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install training dependencies
pip install unsloth trl accelerate torch transformers datasets
pip install optimum[onnx]  # for ONNX export

# Train a personality model
python train/smol_lora_train.py --data ./my-book.txt --steps 60 --export-onnx`}</pre>

        <p className="text-xs font-medium text-gray-600">Project structure</p>
        <pre className="text-xs leading-relaxed text-gray-500 font-mono bg-black/[0.02] px-4 py-3 overflow-x-auto">
{`browser-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home page with model grid
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles & Tailwind v4
│   │   ├── docs/
│   │   │   └── page.tsx      # Developer documentation
│   │   └── models/
│   │       ├── chat/         # Personality Chat (ONNX upload)
│   │       ├── summarize/    # Text summarization
│   │       ├── classify/     # Image classification
│   │       ├── detect/       # Object detection
│   │       ├── segment/      # Image segmentation
│   │       ├── remove-bg/    # Background removal
│   │       └── train/        # Training pages
│   │           ├── browser/  # In-browser LSTM training
│   │           ├── gpu/      # BYO GPU pipeline guide
│   │           └── import/   # Import trained weights
│   ├── components/
│   │   ├── Navbar.tsx        # Top navigation
│   │   └── Footer.tsx        # Footer with links
│   └── lib/
│       ├── models.ts         # Model registry
│       ├── bpe-tokenizer.ts  # BPE tokenizer (browser)
│       └── onnx-chat.ts      # ONNX inference engine
├── train/
│   ├── smol_lora_train.py    # LoRA training script
│   ├── smol_lora_train.ipynb # Colab notebook
│   └── serve.py.bak          # Legacy server (deprecated)
├── package.json
└── tsconfig.json`}</pre>
      </div>
    ),
  },
  {
    id: "api-reference",
    title: "API Reference",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Reference documentation for the core browser-side libraries.
        </p>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">OnnxChat.create(onnxBuffer, configJson, tokenizerJson)</p>
            <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
              <p>Creates an OnnxChat instance from uploaded model data.</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><code className="bg-black/[0.04] px-1">onnxBuffer</code>: ArrayBuffer — contents of model.onnx</li>
                <li><code className="bg-black/[0.04] px-1">configJson</code>: ModelConfig — parsed config.json</li>
                <li><code className="bg-black/[0.04] px-1">tokenizerJson</code>: TokenizerConfig — parsed tokenizer.json</li>
                <li>Returns: <code className="bg-black/[0.04] px-1">Promise&lt;OnnxChat&gt;</code></li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">OnnxChat.generate(message, options?)</p>
            <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
              <p>Generates a response to a user message.</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><code className="bg-black/[0.04] px-1">message</code>: string — the user input</li>
                <li><code className="bg-black/[0.04] px-1">options.maxTokens</code>: number (default 256) — max tokens to generate</li>
                <li><code className="bg-black/[0.04] px-1">options.temperature</code>: number (default 0.7) — sampling temperature</li>
                <li><code className="bg-black/[0.04] px-1">options.topP</code>: number (default 0.9) — nucleus sampling threshold</li>
                <li><code className="bg-black/[0.04] px-1">options.repetitionPenalty</code>: number (default 1.1) — repetition penalty</li>
                <li><code className="bg-black/[0.04] px-1">options.systemPrompt</code>: string — system instruction</li>
                <li><code className="bg-black/[0.04] px-1">options.messages</code>: array — conversation history</li>
                <li><code className="bg-black/[0.04] px-1">options.onToken</code>: (partial: string) =&gt; void — streaming callback</li>
                <li><code className="bg-black/[0.04] px-1">options.signal</code>: AbortSignal — cancellation support</li>
                <li>Returns: <code className="bg-black/[0.04] px-1">Promise&lt;string&gt;</code> — the full generated response</li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">new BPETokenizer(tokenizerJson)</p>
            <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
              <p>Creates a BPE tokenizer from a Hugging Face tokenizer.json config.</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><code className="bg-black/[0.04] px-1">tokenizer.encode(text)</code>: number[] — encode text to token IDs</li>
                <li><code className="bg-black/[0.04] px-1">tokenizer.decode(ids)</code>: string — decode token IDs to text</li>
                <li><code className="bg-black/[0.04] px-1">tokenizer.applyChatTemplate(messages)</code>: string — format conversation</li>
                <li><code className="bg-black/[0.04] px-1">tokenizer.countTokens(text)</code>: number — count tokens without encoding</li>
              </ul>
            </div>
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
          {
            q: "Does the personality model actually learn my writing style?",
            a: "Yes. The LoRA fine-tuning trains SmolLM2 on your text using causal language modeling — it learns to predict the next token in your writing style. The more training text you provide (50K+ characters recommended), the better the model adopts your vocabulary, sentence structure, and tone.",
          },
          {
            q: "Is my data sent to any server?",
            a: "No. Everything runs locally. Training happens on your GPU or Google Colab (with your consent). Inference happens entirely in your browser via ONNX Runtime Web. Your text, images, and models never leave your device.",
          },
          {
            q: "Why ONNX instead of GGUF?",
            a: "ONNX is supported by Transformers.js (for our vision models) and ONNX Runtime Web (for the custom chat engine). GGUF would require the Wllama library instead. Both approaches work — ONNX was chosen for consistency with the rest of the platform's models.",
          },
          {
            q: "Can I use this with a model other than SmolLM2?",
            a: "The training script currently targets SmolLM2-360M-Instruct. With modification, it could work with any Hugging Face model supported by Unsloth. The browser inference engine works with any ONNX model exported with text-generation-with-past task. You would need to update the references in the training script and ensure the tokenizer format is compatible.",
          },
          {
            q: "Why does the first inference take so long?",
            a: "The first forward pass triggers WebGPU shader compilation, which can take 2-10 seconds. This is a one-time cost — subsequent calls use cached shaders. The system includes a warm-up pass strategy to reduce perceived latency.",
          },
          {
            q: "Will this work on my phone?",
            a: "It depends. Desktop with WebGPU (Chrome/Edge) works well (30-60 tok/s). Mobile Chrome with WebGPU may work but with higher memory pressure. iOS Safari has limited WebGPU support — it falls back to WASM which is slow (1-3 tok/s). INT8 quantization (~360 MB) is recommended for mobile.",
          },
          {
            q: "How do I share my trained personality with others?",
            a: "Share the personality-onnx.zip file. Others can upload it to their own browser-ai Chat page. The ZIP contains the ONNX model, config, and tokenizer — everything needed to run inference entirely in their browser, with no server.",
          },
          {
            q: "Why was the Python server approach abandoned?",
            a: "The initial Phase 2 implementation used a Python FastAPI server (serve.py) to serve the model locally. This required users to install Python dependencies and run a separate process. The browser-native approach eliminates this friction — upload a ZIP and chat immediately, with all inference running client-side.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="border border-black/[0.06] px-4 py-3 space-y-1.5">
            <p className="text-xs font-medium text-gray-600">Q: {q}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-2xl mx-auto space-y-2">
          {/* Header */}
          <div className="text-center space-y-3 pb-8">
            <div className="inline-flex items-center gap-1.5 bg-black/[0.03] px-3 py-1.5">
              <span className="inline-block h-1.5 w-1.5 bg-black" />
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">documentation</span>
            </div>
            <h1 className="text-2xl font-medium tracking-tight">Developer Docs</h1>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Architecture, research, and API reference for browser-native AI inference.
              Written for developers and ML engineers.
            </p>
          </div>

          {/* Table of contents */}
          <div className="bg-white px-5 py-4 mb-6">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">On this page</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                className="bg-white scroll-mt-14"
              >
                <div className="border-b border-black/[0.04] px-5 py-3.5">
                  <h2 className="text-sm font-medium">{section.title}</h2>
                </div>
                <div className="px-5 py-4">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white px-5 py-4 mt-8">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Last updated: June 2026 ·{" "}
              <a
                href="https://github.com/batraaryan03/browser-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-black transition-colors"
              >
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
