"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

const METHODS = [
  {
    title: "Docker (Recommended)",
    desc: "One command, works everywhere. Uses your local NVIDIA GPU.",
    steps: [
      "# Pull the training image",
      "docker pull your-repo/browser-ai-trainer:latest",
      "",
      "# Run with your data mounted",
      "docker run --gpus all \\",
      "  -v $(pwd)/data:/data \\",
      "  -v $(pwd)/output:/output \\",
      "  your-repo/browser-ai-trainer:latest \\",
      "  --model t5-small \\",
      "  --method lora \\",
      "  --epochs 3",
    ],
  },
  {
    title: "Google Colab",
    desc: "Free GPU (T4/P100). No setup needed — just run the notebook.",
    steps: [
      "# 1. Open the notebook",
      "#    https://colab.research.google.com/github/your-repo/trainer",
      "",
      "# 2. Mount Google Drive",
      "from google.colab import drive",
      "drive.mount('/content/drive')",
      "",
      "# 3. Install dependencies",
      "!pip install torch transformers peft accelerate",
      "",
      "# 4. Run training",
      "!python train.py --model t5-small --method lora --epochs 3",
      "",
      "# 5. Download the adapter",
      "#    It will appear in your Drive or as a file download",
    ],
  },
  {
    title: "Local Python (Any Linux/Mac)",
    desc: "Direct installation. Requires Python 3.10+ and a CUDA-capable GPU.",
    steps: [
      "# 1. Create a virtual environment",
      "python3 -m venv .venv",
      "source .venv/bin/activate",
      "",
      "# 2. Install dependencies",
      "pip install torch transformers peft accelerate",
      "",
      "# 3. Export your data from the browser",
      "#    Use the export button on the training page to get your data file",
      "",
      "# 4. Run training",
      "python train.py \\",
      "  --model t5-small \\",
      "  --method lora \\",
      "  --data ./my-data.txt \\",
      "  --epochs 3 \\",
      "  --output ./adapter.safetensors",
      "",
      "# 5. Import the adapter back",
      "#    Upload the .safetensors file on the import page",
    ],
  },
];

export default function GPUTrainPage() {
  const copySteps = (steps: string[]) => {
    const text = steps.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Bring Your Own GPU</h1>
            <p className="text-sm text-gray-400">
              Train models on your own hardware. Choose any method — Docker, Colab, or local Python.
              You own the weights. No cloud costs. No limits.
            </p>
          </div>

          {/* Methods */}
          {METHODS.map((method) => (
            <div key={method.title} className="bg-white">
              <div className="border-b border-black/[0.04] px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium">{method.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{method.desc}</p>
                </div>
                <button
                  onClick={() => copySteps(method.steps)}
                  className="shrink-0 flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
                  title="Copy commands"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                    <rect x="4" y="4" width="7.5" height="7.5" />
                    <path d="M1.5 9V2A.5.5 0 012 1.5h6.5" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <pre className="text-xs leading-relaxed text-gray-500 whitespace-pre-wrap font-mono">
                  {method.steps.map((line, i) => (
                    <span key={i} className={line.startsWith("#") ? "text-gray-300" : ""}>
                      {line}{"\n"}
                    </span>
                  ))}
                </pre>
              </div>
            </div>
          ))}

          {/* Important note */}
          <div className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">How it works</p>
            <ol className="space-y-2">
              {[
                "Export your training data from the browser training page",
                "Run the training command on your GPU machine (Docker/Colab/local)",
                "Training produces a LoRA adapter file (~24KB-5MB)",
                "Upload the adapter back via the Import page",
                "Use the adapter in your browser for inference — instant, private, free",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-black shrink-0 font-medium">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
