"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Connect to your personality model server to start chatting." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connectToServer = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${SERVER_URL}/health`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const info: ServerInfo = await res.json();
      setServerInfo(info);
      setConnected(true);
      setMessages([
        {
          role: "assistant",
          content: info.metadata?.style_description
            ? `Connected! I'm trained on your text. Ask me anything.`
            : "Connected! Ready to chat.",
        },
      ]);
      toast.success("Connected to personality model server");
    } catch {
      toast.error("Could not connect to server. Make sure it's running on port 8000.");
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

    try {
      const res = await fetch(`${SERVER_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          max_tokens: 256,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "(no response)" },
      ]);
    } catch {
      toast.error("Failed to get response. Is the server still running?");
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        <div className="w-full max-w-lg mx-auto flex flex-col h-[75dvh] min-h-[500px] space-y-4">
          {/* Header */}
          <div className="text-center space-y-2 shrink-0">
            <h1 className="text-2xl font-medium tracking-tight">Personality Chat</h1>
            <p className="text-sm text-gray-400">
              Chat with your fine-tuned personality model. The model runs on your machine
              via the local server — nothing leaves your device.
            </p>
          </div>

          {/* Connection status */}
          {!connected && (
            <div className="bg-white p-4 text-center space-y-3 shrink-0">
              <p className="text-sm text-gray-500">
                Start the model server on your machine first, then connect.
              </p>
              <div className="text-xs text-gray-400 font-mono bg-black/[0.02] px-3 py-2">
                python train/serve.py --model ./output/personality
              </div>
              <button
                onClick={connectToServer}
                disabled={connecting}
                className="bg-black text-white px-5 py-2 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {connecting ? "Connecting..." : "Connect to Server"}
              </button>
              <p className="text-[10px] text-gray-300">
                Make sure the serve.py is running on port 8000
              </p>
            </div>
          )}

          {/* Server info */}
          {connected && serverInfo && (
            <div className="bg-white px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 bg-green-500" />
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Connected</span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">{serverInfo.device}</span>
              </div>
              {serverInfo.metadata && (
                <span className="text-[10px] text-gray-400">
                  {serverInfo.metadata.char_count?.toLocaleString()} chars · {formatDate(serverInfo.metadata.trained_at)}
                </span>
              )}
            </div>
          )}

          {/* Messages */}
          {connected && (
            <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 ${
                      msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-black/[0.03] text-gray-700"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-black/[0.03] px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" />
                      <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                      <span className="inline-block h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {connected && (
            <div className="flex items-end gap-2 shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-black text-white px-4 py-3 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-30 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                  <path d="M2 8l12-5-5 12-3-4-4-3z" />
                </svg>
              </button>
            </div>
          )}

          {/* Footer info */}
          <div className="bg-white px-4 py-3 shrink-0">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Powered by <strong>SmolLM2-360M-Instruct</strong> fine-tuned with LoRA.
              The model runs on your machine via the local server.
              No data leaves your device — all inference is local.
              Share your training text and metadata.json so others can experience your personality.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
