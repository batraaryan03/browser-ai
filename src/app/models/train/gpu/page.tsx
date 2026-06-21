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
              Fine-tune SmolLM2-360M on your text using your own GPU. In ~15-30 minutes,
              you get a unique AI personality that writes in your training style.
            </p>
          </div>

          {/* Local Python method */}
          <div className="bg-white">
            <div className="border-b border-black/[0.04] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Local Python (Mac / Linux / Windows)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requires Python 3.10+, a CUDA-capable GPU (4GB+ VRAM), or use CPU for slower training.
                  All training scripts are in this repo.
                </p>
              </div>
              <button
                onClick={() => copyText(
                  `# Clone the repo\ngit clone ${REPO_URL}.git\ncd browser-ai\n\n# Create virtual environment\npython3 -m venv .venv\nsource .venv/bin/activate\n\n# Install dependencies\npip install unsloth trl accelerate torch transformers datasets\n\n# Train on your text (replace with your file)\npython train/smol_lora_train.py --data ./my-book.txt --epochs 3 --steps 60\n\n# The merged model is saved to ./output/personality/\n\n# Serve the model locally\npython train/serve.py --model ./output/personality`
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
                <span className="text-gray-300"># 1. Clone the repo</span>{"\n"}
                <span>git clone {REPO_URL}.git</span>{"\n"}
                <span>cd browser-ai</span>{"\n\n"}
                <span className="text-gray-300"># 2. Install dependencies</span>{"\n"}
                <span>python3 -m venv .venv</span>{"\n"}
                <span>source .venv/bin/activate  </span><span className="text-gray-300"># or .venv\Scripts\activate on Windows</span>{"\n"}
                <span>pip install unsloth trl accelerate torch transformers datasets</span>{"\n\n"}
                <span className="text-gray-300"># 3. Prepare your training text (.txt file)</span>{"\n"}
                <span className="text-gray-300">#    Paste any book, articles, or writing into a .txt file</span>{"\n\n"}
                <span className="text-gray-300"># 4. Train the personality model</span>{"\n"}
                <span>python train/smol_lora_train.py \</span>{"\n"}
                <span>  --data ./my-book.txt \</span>{"\n"}
                <span>  --epochs 3 --steps 60</span>{"\n\n"}
                <span className="text-gray-300"># 5. Serve the model locally</span>{"\n"}
                <span>python train/serve.py --model ./output/personality</span>{"\n\n"}
                <span className="text-gray-300"># 6. Open your browser → go to the Chat page</span>{"\n"}
                <span className="text-gray-300">#    Click "Connect to Server"</span>
              </pre>
            </div>
          </div>

          {/* Google Colab option */}
          <div className="bg-white">
            <div className="border-b border-black/[0.04] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Google Colab (Free T4 GPU)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  No setup needed. Google gives you a free T4/P100 GPU. Upload your .txt file
                  and run the notebook — ~5-10 minutes training.
                </p>
              </div>
              <button
                onClick={() => copyText(
                  "# Open in Colab\n# https://colab.research.google.com/github/batraaryan03/browser-ai/blob/main/train/smol_lora_train.ipynb\n\n!pip install unsloth trl accelerate torch transformers datasets\n!python train/smol_lora_train.py --data ./my-book.txt --epochs 3"
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
                <span>https://colab.research.google.com/github/batraaryan03/browser-ai/</span>{"\n"}
                <span>blob/main/train/smol_lora_train.ipynb</span>{"\n\n"}
                <span className="text-gray-300"># Follow the notebook:</span>{"\n"}
                <span>1. Install dependencies</span>{"\n"}
                <span>2. Upload your .txt file</span>{"\n"}
                <span>3. Run training (~5-10 min on T4)</span>{"\n"}
                <span>4. Download the merged model ZIP</span>{"\n"}
                <span>5. Unzip on your machine</span>{"\n"}
                <span>6. Run: python train/serve.py --model ./output/personality</span>{"\n"}
                <span>7. Open browser Chat page → Connect</span>
              </pre>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">The pipeline</p>
            <ol className="space-y-2">
              {[
                "Export your training text as a .txt file (50K+ characters recommended)",
                "Run smol_lora_train.py on your GPU — trains SmolLM2-360M with LoRA",
                "Training produces a merged model in ./output/personality/ (~700 MB)",
                "Run serve.py to start a local chat API server on port 8000",
                "Open the browser Chat page and click 'Connect to Server'",
                "Chat with your trained personality — all inference runs on your GPU",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-black shrink-0 font-medium">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Sharing */}
          <div className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">Share your personality</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Share your <strong>metadata.json</strong> and training text so others can
              replicate your personality. Or share the full merged model directory for
              others to serve locally. Every personality is unique — trained by you, owned by you.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
