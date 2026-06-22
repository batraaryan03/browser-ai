"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnnxChat, type ModelConfig } from "@/lib/onnx-chat";
import { type TokenizerConfig } from "@/lib/bpe-tokenizer";
import { unzip } from "fflate";

// ── Image/Video assets ───────────────────────────────────────────────

const CHAT_WORKFLOW_IMG = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80&fm=webp&fit=crop";
const TRAIN_IMG = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80&fm=webp&fit=crop";
const UPLOAD_IMG = "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&q=80&fm=webp&fit=crop";
const INFERENCE_IMG = "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80&fm=webp&fit=crop";

const DEMO_VIDEO_URL = "https://www.pexels.com/video/smartphone-with-ai-chat-interface-on-screen-30479272/";

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Train your model",
    desc: "Fine-tune SmolLM2-360M on your text using LoRA + Unsloth. Runs on your GPU or free Google Colab. Takes ~5-15 minutes.",
    image: TRAIN_IMG,
  },
  {
    step: "02",
    title: "Export to ONNX",
    desc: "The script automatically exports to ONNX with KV-cache support. The model files are bundled into a ZIP archive.",
    image: UPLOAD_IMG,
  },
  {
    step: "03",
    title: "Upload & chat",
    desc: "Drag the ZIP into this page. The model loads into browser memory via ONNX Runtime Web. All inference runs locally — zero servers.",
    image: INFERENCE_IMG,
  },
];

// ── Types ────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ModelFiles {
  /** model.onnx file */
  onnx: ArrayBuffer;
  /** config.json */
  config: ModelConfig;
  /** tokenizer.json */
  tokenizer: TokenizerConfig;
  /** metadata.json (optional) */
  metadata?: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

// ── Sub-components ───────────────────────────────────────────────────

function CursorBlink() {
  return <span className="inline-block h-4 w-[2px] bg-gray-400 animate-caret align-middle" />;
}

function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  if (isStreaming) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {content}
        <CursorBlink />
      </p>
    );
  }

  const hasMarkdown =
    content.includes("```") ||
    content.includes("**") ||
    content.includes("__") ||
    content.includes("* ") ||
    content.includes("- ") ||
    content.match(/^#{1,6}\s/m);

  if (!hasMarkdown) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-code:px-1 prose-code:py-0.5 prose-code:bg-black/[0.05] prose-code:rounded prose-pre:bg-black/[0.04] prose-pre:border prose-pre:border-black/[0.06] prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-800 prose-a:text-gray-600 prose-a:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function ChatPage() {
  // Model state
  const [modelFiles, setModelFiles] = useState<ModelFiles | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [chat, setChat] = useState<OnnxChat | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadProgress, setLoadProgress] = useState("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an AI trained to adopt the writing style, tone, and personality of the text provided during training. Respond naturally as if you are that persona.",
  );
  const [modelName, setModelName] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ── File upload / ZIP extraction ─────────────────────────────────

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so re-uploading same file triggers change
    e.target.value = "";

    if (!file.name.endsWith(".zip")) {
      toast.error("Please upload a .zip file containing your model");
      return;
    }

    setLoadingModel(true);
    setLoadProgress("Reading ZIP file...");

    try {
      const zipBuffer = await file.arrayBuffer();
      const zipData = new Uint8Array(zipBuffer);

      setLoadProgress("Extracting model files...");

      // Extract ZIP using fflate
      const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        unzip(zipData, (err, contents) => {
          if (err) reject(new Error("Failed to extract ZIP: " + err.message));
          else resolve(contents as Record<string, Uint8Array>);
        });
      });

      // Find model files
      const fileMap = new Map<string, Uint8Array>();
      for (const [name, data] of Object.entries(files)) {
        // Strip directory prefix (e.g., "personality/model.onnx" → "model.onnx")
        const basename = name.split("/").pop() || name;
        fileMap.set(basename, data);
      }

      // Check for required files
      let onnxFile = fileMap.get("model.onnx");
      if (!onnxFile) {
        // Try to find any .onnx file
        const onnxEntry = Object.entries(files).find(([name]) => name.endsWith(".onnx"));
        if (!onnxEntry) {
          throw new Error("No .onnx model file found in the ZIP. Make sure to export with optimum-cli.");
        }
        onnxFile = onnxEntry[1];
      }

      const configData = fileMap.get("config.json");
      if (!configData) throw new Error("No config.json found in the ZIP");

      const tokenizerData = fileMap.get("tokenizer.json");
      if (!tokenizerData) throw new Error("No tokenizer.json found in the ZIP");

      // Parse JSON files
      setLoadProgress("Parsing model configuration...");
      const config: ModelConfig = JSON.parse(new TextDecoder().decode(configData));
      const tokenizerJson: TokenizerConfig = JSON.parse(new TextDecoder().decode(tokenizerData));

      // Optional metadata
      let metadata: Record<string, unknown> | undefined;
      const metaData = fileMap.get("metadata.json");
      if (metaData) {
        metadata = JSON.parse(new TextDecoder().decode(metaData));
      }

      // Also find external data files (for models > 2GB)
      const externalDataFiles: Array<{ name: string; data: Uint8Array }> = [];
      for (const [name, data] of Object.entries(files)) {
        if (name.endsWith(".onnx.data")) {
          externalDataFiles.push({ name, data });
        }
      }

      if (externalDataFiles.length > 0) {
        setLoadProgress(`Found ${externalDataFiles.length} external data file(s). Loading model...`);
      }

      // Get the ONNX buffer as a proper ArrayBuffer
      const onnxBuffer = onnxFile.buffer.slice(
        onnxFile.byteOffset,
        onnxFile.byteOffset + onnxFile.byteLength,
      ) as ArrayBuffer;

      // Use model name from metadata or config
      const name = metadata?.style_description
        ? (metadata.style_description as string).slice(0, 40)
        : config.model_type || "Personality Model";
      setModelName(name);

      // Create OnnxChat instance
      setLoadProgress("Loading model into browser... (this may take a moment)");
      const chatInstance = await OnnxChat.create(onnxBuffer, config, tokenizerJson);

      setChat(chatInstance);
      setModelLoaded(true);
      setModelFiles({ onnx: onnxBuffer, config, tokenizer: tokenizerJson, metadata });

      setMessages([
        {
          role: "assistant",
          content: metadata?.style_description
            ? `I'm trained to channel a unique personality. Ask me anything — I'll respond in that voice.`
            : "Model loaded! I'm ready to chat. What's on your mind?",
        },
      ]);

      toast.success("Model loaded! Ready to chat.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load model");
      setModelLoaded(false);
      setChat(null);
    } finally {
      setLoadingModel(false);
      setLoadProgress("");
    }
  }, []);

  // ── Send / generate ─────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || generating || !chat) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setGenerating(true);
    setIsStreaming(true);
    setStreamingContent("");

    // Conversation history (last 9 messages for context)
    const historyMessages = messages
      .slice(-9)
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await chat.generate(text, {
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        repetitionPenalty: 1.1,
        systemPrompt: systemPrompt || undefined,
        messages: historyMessages,
        signal: controller.signal,
        onToken: (partial) => {
          setStreamingContent(partial);
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response || "(no response)" },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Generation failed. Try again.");
    } finally {
      setGenerating(false);
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [input, generating, messages, chat, systemPrompt]);

  // ── Input handlers ──────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto flex flex-col space-y-3">
          {/* Header */}
          <div className="text-center space-y-2 shrink-0">
            <h1 className="text-2xl font-medium tracking-tight">Personality Chat</h1>
            <p className="text-sm text-gray-400">
              Upload your trained model and chat with it entirely in your browser.
              No server needed — everything runs on your machine.
            </p>
          </div>

          {/* ── How it works section (before model loaded) ─────────── */}

          {!modelLoaded && !loadingModel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Workflow steps with images */}
              <div className="grid gap-4">
                {HOW_IT_WORKS_STEPS.map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--border-light)]"
                  >
                    <div className="aspect-[16/7] overflow-hidden">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[var(--green)] tracking-wider">{item.step}</span>
                        <span className="text-xs text-[var(--border)]">·</span>
                        <span className="text-xs font-semibold text-[var(--fg)]">{item.title}</span>
                      </div>
                      <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Upload card */}
              <div className="rounded-2xl bg-white border border-dashed border-[var(--border)] p-5 text-center hover:border-[var(--fg-subtle)] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--green-light)]">
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      stroke="var(--green)" strokeWidth="1.5" strokeLinecap="square"
                    >
                      <path d="M10 2v10M6 8l4 4 4-4M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--fg)]">
                      Upload your model ZIP
                    </p>
                    <p className="text-xs text-[var(--fg-subtle)] mt-0.5">
                      Contains model.onnx, config.json, tokenizer.json
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[var(--green)] bg-[var(--green-light)] px-3 py-1 rounded-full">
                    Click to upload
                  </span>
                </div>
              </div>

              {/* Quick command reference */}
              <div className="bg-[var(--bg-alt)] rounded-2xl px-5 py-4">
                <p className="text-xs font-medium text-[var(--fg-subtle)] mb-2 uppercase tracking-wider">Quick start</p>
                <pre className="text-xs text-[var(--fg-muted)] font-mono leading-relaxed">
                  <span className="text-[var(--fg-subtle)]"># Train + export on your GPU</span>{"\n"}
                  <span className="text-[var(--fg)]">python train/smol_lora_train.py \</span>{"\n"}
                  <span className="text-[var(--fg)]">  --data ./my-book.txt --steps 60 --export-onnx</span>{"\n\n"}
                  <span className="text-[var(--fg-subtle)]"># Upload the ZIP and start chatting</span>
                </pre>
              </div>

              {/* Demo video embed */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--green)]" />
                  <span className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider">See it in action</span>
                </div>
                <div className="relative overflow-hidden rounded-2xl aspect-video bg-[var(--bg-alt)]">
                  <iframe
                    src="https://www.pexels.com/video/smartphone-with-ai-chat-interface-on-screen-30479272/embed"
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    title="AI Chat Interface Demo"
                  />
                </div>
                <p className="text-xs text-[var(--fg-subtle)] text-center">
                  Watch how the personality model runs entirely in your browser — no server involved
                </p>
              </div>
            </motion.div>
          )}

          {/* Loading card */}
          {loadingModel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white px-5 py-8 text-center shrink-0"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="inline-block h-2 w-2 bg-black rounded-full animate-pulse" />
                <span className="inline-block h-2 w-2 bg-black rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                <span className="inline-block h-2 w-2 bg-black rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
              <p className="text-sm text-gray-500">{loadProgress}</p>
              <p className="text-[10px] text-gray-300 mt-2">
                Loading a ~700 MB model into browser memory...
              </p>
            </motion.div>
          )}

          {/* Info bar (when model loaded) */}
          {modelLoaded && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white px-4 py-2.5 flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-block h-2 w-2 bg-green-500 rounded-full shrink-0" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider shrink-0">
                  Model Ready
                </span>
                <span className="text-[10px] text-gray-300 shrink-0">·</span>
                <span className="text-[10px] text-gray-400 truncate">
                  {modelName}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                  {showSystemPrompt ? "Hide" : "System"}
                </button>
                <button
                  onClick={() => {
                    setModelLoaded(false);
                    setChat(null);
                    setMessages([]);
                    setModelFiles(null);
                    setModelName("");
                  }}
                  className="text-[10px] text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                  Unload
                </button>
              </div>
            </motion.div>
          )}

          {/* System prompt editor */}
          <AnimatePresence>
            {modelLoaded && showSystemPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden shrink-0"
              >
                <div className="bg-white px-4 py-3 space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    System Prompt
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={3}
                    className="w-full resize-none bg-black/[0.02] px-3 py-2 text-xs text-gray-600 placeholder:text-gray-300 focus:outline-none leading-relaxed"
                    placeholder="Describe how the model should behave..."
                  />
                  <p className="text-[10px] text-gray-300">
                    This instruction guides how the personality responds. It's prepended to every conversation.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages area */}
          {modelLoaded && (
            <div className="flex-1 bg-white overflow-y-auto space-y-0" style={{ minHeight: "300px" }}>
              {messages.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-gray-300">Send a message to start chatting.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`px-4 py-3 ${msg.role === "assistant" ? "bg-black/[0.01]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {msg.role === "assistant" ? (
                        <div className="h-6 w-6 flex items-center justify-center bg-black text-[10px] text-white font-medium">
                          AI
                        </div>
                      ) : (
                        <div className="h-6 w-6 flex items-center justify-center bg-black/[0.04] text-[10px] text-gray-500 font-medium">
                          Y
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">
                        {msg.role === "assistant" ? "Model" : "You"}
                      </p>
                      <MessageContent content={msg.content} />
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-3 bg-black/[0.01]"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="h-6 w-6 flex items-center justify-center bg-black text-[10px] text-white font-medium">
                        AI
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">
                        Model
                      </p>
                      <MessageContent content={streamingContent} isStreaming />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading dots (before streaming starts) */}
              {generating && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-3 bg-black/[0.01]"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="h-6 w-6 flex items-center justify-center bg-black text-[10px] text-white font-medium">
                        AI
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mb-1">
                        Model
                      </p>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" />
                        <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input area */}
          {modelLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2 shrink-0"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none bg-white px-4 py-3 pr-12 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>
              {generating ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="bg-red-500/10 text-red-500 px-3 h-[44px] flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0 active:scale-[0.97] transition-transform duration-100"
                  title="Stop generation"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-black text-white px-4 h-[44px] flex items-center justify-center hover:opacity-85 transition-opacity disabled:opacity-30 shrink-0 active:scale-[0.97] transition-transform duration-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  >
                    <path d="M2 8l12-5-5 12-3-4-4-3z" />
                  </svg>
                </button>
              )}
            </motion.div>
          )}

          {/* Footer info */}
          {modelLoaded && (
            <div className="bg-white px-4 py-3 shrink-0">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Powered by <strong>SmolLM2-360M-Instruct</strong> fine-tuned with LoRA.
                Runs entirely in your browser via{" "}
                <strong>ONNX Runtime Web</strong> — no data leaves your device.
              </p>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
