"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

const REPO_URL = "https://github.com/batraaryan03/browser-ai";

export default function GPUTrainPage() {
  const copyText = (text: string) => {
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
              Train advanced models on your own hardware. You own the weights. No cloud costs. No limits.
              Everything runs locally from our training scripts.
            </p>
          </div>

          {/* The only method: Clone the repo and run */}
          <div className="bg-white">
            <div className="border-b border-black/[0.04] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Local Python (Mac / Linux / Windows)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requires Python 3.10+ and a CUDA-capable NVIDIA GPU (or use CPU for small jobs).
                  All training scripts are in this repo.
                </p>
              </div>
              <button
                onClick={() => copyText(
                  `# Clone the repo\ngit clone ${REPO_URL}.git\ncd browser-ai\n\n# Create virtual environment\npython3 -m venv .venv\nsource .venv/bin/activate  # or .venv\\Scripts\\activate on Windows\n\n# Install dependencies\npip install torch transformers peft accelerate\n\n# Run training\npython train/lora_train.py --model t5-small --epochs 3 --data ./my-data.txt`
                )}
                className="shrink-0 flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
                title="Copy commands"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                  <rect x="4" y="4" width="7.5" height="7.5" /><path d="M1.5 9V2A.5.5 0 012 1.5h6.5" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  {REPO_URL}
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(REPO_URL); toast.success("URL copied"); }}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                    <rect x="3.5" y="3.5" width="7" height="7" /><path d="M1.5 8.5V2A.5.5 0 012 1.5h6.5" />
                  </svg>
                </button>
              </div>

              <pre className="text-xs leading-relaxed text-gray-500 whitespace-pre-wrap font-mono">
                <span className="text-gray-300"># Clone this repo</span>{"\n"}
                <span>git clone {REPO_URL}.git</span>{"\n"}
                <span>cd browser-ai</span>{"\n\n"}
                <span className="text-gray-300"># Create a virtual environment</span>{"\n"}
                <span>python3 -m venv .venv</span>{"\n"}
                <span>source .venv/bin/activate  </span><span className="text-gray-300"># or .venv\Scripts\activate on Windows</span>{"\n\n"}
                <span className="text-gray-300"># Install dependencies</span>{"\n"}
                <span>pip install torch transformers peft accelerate</span>{"\n\n"}
                <span className="text-gray-300"># Export your training data from the browser training page</span>{"\n"}
                <span className="text-gray-300"># Then run:</span>{"\n"}
                <span>python train/lora_train.py --model t5-small --epochs 3 --data ./my-data.txt</span>{"\n\n"}
                <span className="text-gray-300"># The trained adapter will be saved as output/adapter.safetensors</span>{"\n"}
                <span className="text-gray-300"># Upload it back on the Import page</span>
              </pre>
            </div>
          </div>

          {/* Google Colab option */}
          <div className="bg-white">
            <div className="border-b border-black/[0.04] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Google Colab (Free GPU)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  No setup needed. Google gives you a free T4/P100 GPU. Just run the notebook.
                </p>
              </div>
              <button
                onClick={() => copyText(
                  "# Open in Colab\n# https://colab.research.google.com/github/batraaryan03/browser-ai/blob/main/train/lora_train.ipynb\n\nfrom google.colab import drive\ndrive.mount('/content/drive')\n!pip install torch transformers peft accelerate\n!python train/lora_train.py --model t5-small --epochs 3"
                )}
                className="shrink-0 flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
                title="Copy commands"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                  <rect x="4" y="4" width="7.5" height="7.5" /><path d="M1.5 9V2A.5.5 0 012 1.5h6.5" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <pre className="text-xs leading-relaxed text-gray-500 whitespace-pre-wrap font-mono">
                <span className="text-gray-300"># Open the training notebook in Colab:</span>{"\n"}
                <span>https://colab.research.google.com/github/batraaryan03/browser-ai/blob/main/train/lora_train.ipynb</span>{"\n\n"}
                <span className="text-gray-300"># Then in Colab:</span>{"\n"}
                <span>from google.colab import drive</span>{"\n"}
                <span>drive.mount('/content/drive')</span>{"\n"}
                <span>!pip install torch transformers peft accelerate</span>{"\n"}
                <span>!python train/lora_train.py --model t5-small --epochs 3</span>
              </pre>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">The workflow</p>
            <ol className="space-y-2">
              {[
                "Export your training config from the browser Export page",
                "Clone this repo and run the training script on your GPU machine",
                "The script produces a LoRA adapter file (.safetensors)",
                "Upload the adapter back via the Import page to use in your browser",
                "Now inference runs in-browser — instant, private, free",
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
