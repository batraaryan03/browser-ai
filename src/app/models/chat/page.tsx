"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ServerInfo {
  status: string;
  model: string;
  device: string;
  metadata?: {
    style_description?: string;
    char_count?: number;
    word_count?: number;
    training_minutes?: number;
    trained_at?: string;
  };
}

const SERVER_URL = "http://localhost:8000";

function CursorBlink() {
  return <span className="inline-block h-4 w-[2px] bg-gray-400 animate-caret align-middle" />;
}

function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  // If it's a streaming message in progress, show raw text with cursor
  if (isStreaming) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {content}
        <CursorBlink />
      </p>
    );
  }

  // If content looks like plain text (no markdown syntax), render as plain text
  if (!content.includes("```") && !content.includes("**") && !content.includes("__") && !content.includes("* ") && !content.match(/^#{1,6}\s/m)) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-code:px-1 prose-code:py-0.5 prose-code:bg-black/[0.05] prose-code:rounded prose-pre:bg-black/[0.04] prose-pre:border prose-pre:border-black/[0.06] prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-800 prose-a:text-gray-600 prose-a:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Connect to your personality model server to start chatting." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an AI trained to adopt the writing style, tone, and personality of the text provided during training. Respond naturally as if you are that persona."
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const connectToServer = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${SERVER_URL}/health`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const info: ServerInfo = await res.json();
      setServerInfo(info);
      setConnected(true);
      const greeting = info.metadata?.style_description
        ? `Connected! I'm trained to channel the personality behind your text. Ask me anything — I'll respond in that voice.`
        : "Connected! Ready to chat in my trained personality.";
      setMessages([{ role: "assistant", content: greeting }]);
      toast.success("Connected to personality model server");
    } catch {
      toast.error("Could not connect to server. Make sure serve.py is running on port 8000.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent("");

    // Build conversation history (last 9 previous messages for context)
    // The current message is sent separately via the `message` field
    const historyMessages = messages
      .slice(-9)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`${SERVER_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: historyMessages,
          system_prompt: systemPrompt || null,
          max_tokens: 512,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                fullResponse += data.token;
                setStreamingContent(fullResponse);
              }
              if (data.done && data.full) {
                fullResponse = data.full;
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }

      const finalContent = fullResponse.trim() || "(no response)";
      setMessages((prev) => [...prev, { role: "assistant", content: finalContent }]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — fine, keep what we have
        return;
      }
      toast.error("Lost connection to server. Reconnect to continue.");
      setConnected(false);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingContent("");
      abortControllerRef.current = null;
    }
  }, [input, loading, messages, systemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto flex flex-col h-[75dvh] min-h-[500px] space-y-3">
          {/* Header */}
          <div className="text-center space-y-2 shrink-0">
            <h1 className="text-2xl font-medium tracking-tight">Personality Chat</h1>
            <p className="text-sm text-gray-400">
              Talk to your fine-tuned personality model. It runs on your machine —
              nothing leaves your device.
            </p>
          </div>

          {/* Connection card */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white px-5 py-5 space-y-4 shrink-0"
            >
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">
                  Start the personality server on your machine, then connect below.
                </p>
                <div className="text-xs text-gray-400 font-mono bg-black/[0.02] px-3 py-2 leading-relaxed">
                  python train/serve.py --model ./output/personality
                </div>
              </div>

              <button
                onClick={connectToServer}
                disabled={connecting}
                className="w-full bg-black text-white py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-85 transition-opacity disabled:opacity-40 active:scale-[0.98] transition-transform duration-100"
              >
                {connecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-1 w-4 bg-white/30 animate-pulse" />
                    Connecting...
                  </span>
                ) : (
                  "Connect to Server"
                )}
              </button>

              <p className="text-[10px] text-gray-300 text-center">
                The server must be running at{" "}
                <span className="font-mono">localhost:8000</span>
              </p>
            </motion.div>
          )}

          {/* Server info bar */}
          {connected && serverInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white px-4 py-2.5 flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Connected
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">{serverInfo.device}</span>
              </div>
              <div className="flex items-center gap-3">
                {serverInfo.metadata && (
                  <span className="text-[10px] text-gray-400">
                    {serverInfo.metadata.char_count?.toLocaleString()} chars
                    {serverInfo.metadata.trained_at && (
                      <> · {formatDate(serverInfo.metadata.trained_at)}</>
                    )}
                  </span>
                )}
                <button
                  onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                  {showSystemPrompt ? "Hide" : "System"}
                </button>
              </div>
            </motion.div>
          )}

          {/* System prompt editor */}
          <AnimatePresence>
            {connected && showSystemPrompt && (
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
                    This instruction is prepended to every conversation. It guides how the personality responds.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages area */}
          {connected && (
            <div className="flex-1 bg-white overflow-y-auto space-y-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`px-4 py-3 ${
                    msg.role === "assistant"
                      ? "bg-black/[0.01]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Role indicator */}
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

                    {/* Content */}
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

              {/* Loading dots (when streaming hasn't started yet) */}
              {loading && !streamingContent && (
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
          {connected && (
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
              {loading ? (
                <button
                  onClick={() => abortControllerRef.current?.abort()}
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
          {connected && (
            <div className="bg-white px-4 py-3 shrink-0">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Powered by <strong>SmolLM2-360M-Instruct</strong> fine-tuned with LoRA.
                The model runs on your machine — no data leaves your device.
                Responses stream in real-time via the local server.
              </p>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
