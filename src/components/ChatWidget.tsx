"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "What services does Sudha offer?",
  "How can I contact her?",
  "Tell me about her work",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setShowSuggested(false);
    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message ?? "Sorry, I couldn&apos;t get a response. Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes chatSlideDown {
          from { opacity: 1; transform: translateY(0)   scale(1);    }
          to   { opacity: 0; transform: translateY(24px) scale(0.96); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(32,106,109,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(32,106,109,0); }
          100% { box-shadow: 0 0 0 0 rgba(32,106,109,0);   }
        }
        @keyframes wiggle {
          0%,100% { transform: rotate(0deg); }
          25%      { transform: rotate(-8deg); }
          75%      { transform: rotate(8deg); }
        }
        .chat-window-enter { animation: chatSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
        .chat-window-exit  { animation: chatSlideDown 0.22s ease-in forwards; }
        .msg-enter { animation: msgFadeIn 0.25s ease forwards; }
        .dot-bounce { animation: dotBounce 1.2s ease-in-out infinite; }
        .dot-bounce:nth-child(2) { animation-delay: 0.18s; }
        .dot-bounce:nth-child(3) { animation-delay: 0.36s; }
        .btn-pulse { animation: pulseRing 2.4s ease-out infinite; }
        .btn-wiggle:hover { animation: wiggle 0.4s ease; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Chat window */}
        {open && (
          <div
            className={`flex flex-col overflow-hidden shadow-2xl ${visible ? "chat-window-enter" : "chat-window-exit"}`}
            style={{
              width: 360,
              height: 540,
              borderRadius: 24,
              border: "1.5px solid #d8c8b0",
              background: "linear-gradient(160deg, #fefbf5 0%, #f7f0e4 100%)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(110deg, #1d2d3c, #206a6d)",
                padding: "14px 16px 12px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative texture */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.07,
                backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 12px)",
              }} />

              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a84b, #b6563f)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, border: "2px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  flexShrink: 0,
                }}>
                  🎙️
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-editorial-display, serif)", letterSpacing: "0.02em" }}>
                      Sudha&apos;s Assistant
                    </p>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#4ade80",
                      boxShadow: "0 0 6px #4ade80",
                      display: "inline-block",
                    }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 12 }}>
                    Ask me about Sudha&apos;s work
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.7)", fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                >
                  ✕
                </button>
              </div>

              {/* Decorative bottom line */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #c8a84b 40%, #b6563f 70%, transparent)",
                opacity: 0.7,
              }} />
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1, overflowY: "auto", padding: "16px 14px",
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="msg-enter" style={{ textAlign: "center", paddingTop: 8 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                    background: "linear-gradient(135deg, #206a6d22, #c8a84b22)",
                    border: "1.5px solid #d8c8b0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26,
                  }}>
                    🎙️
                  </div>
                  <p style={{
                    fontFamily: "var(--font-editorial-display, serif)",
                    fontSize: 17, fontWeight: 700, color: "#1d2d3c", marginBottom: 4,
                  }}>
                    Hello! I&apos;m here to help
                  </p>
                  <p style={{ fontSize: 13, color: "#607179", lineHeight: 1.5 }}>
                    Ask me anything about Sudha&apos;s services, work, or how to get in touch.
                  </p>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="msg-enter"
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #206a6d, #1d2d3c)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, marginRight: 8, alignSelf: "flex-end",
                      border: "1.5px solid #d8c8b0",
                    }}>
                      🎙️
                    </div>
                  )}
                  <div style={{
                    maxWidth: "75%",
                    padding: "9px 13px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    ...(msg.role === "user"
                      ? {
                          background: "linear-gradient(110deg, #206a6d, #1d2d3c)",
                          color: "#fff",
                          boxShadow: "0 4px 14px rgba(32,106,109,0.25)",
                        }
                      : {
                          background: "#fff",
                          color: "#1d2d3c",
                          border: "1.5px solid #e8ddd0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }),
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="msg-enter" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #206a6d, #1d2d3c)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, border: "1.5px solid #d8c8b0",
                  }}>
                    🎙️
                  </div>
                  <div style={{
                    background: "#fff", border: "1.5px solid #e8ddd0",
                    borderRadius: "18px 18px 18px 4px", padding: "10px 14px",
                    display: "flex", gap: 4, alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
                    <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#206a6d", display: "inline-block" }} />
                    <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#206a6d", display: "inline-block" }} />
                    <span className="dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "#206a6d", display: "inline-block" }} />
                  </div>
                </div>
              )}

              {/* Suggested questions */}
              {showSuggested && messages.length === 0 && (
                <div className="msg-enter" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontSize: 11, color: "#8fa3ad", textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Suggested
                  </p>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => void sendMessage(q)}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #d8c8b0",
                        borderRadius: 12, padding: "8px 13px",
                        fontSize: 12.5, color: "#206a6d",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.18s", fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#206a6d";
                        e.currentTarget.style.background = "#f0f8f8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#d8c8b0";
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{
              borderTop: "1.5px solid #e8ddd0",
              padding: "10px 12px",
              display: "flex", gap: 8, alignItems: "center",
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                disabled={loading}
                style={{
                  flex: 1,
                  borderRadius: 50, border: "1.5px solid #d8c8b0",
                  background: "#fdf8ef", padding: "8px 16px",
                  fontSize: 13.5, color: "#1d2d3c",
                  outline: "none", transition: "border-color 0.2s",
                  fontFamily: "var(--font-editorial-body, sans-serif)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#206a6d")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d8c8b0")}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: "50%", border: "none",
                  background: input.trim() && !loading
                    ? "linear-gradient(110deg, #206a6d, #1d2d3c)"
                    : "#e8ddd0",
                  color: input.trim() && !loading ? "#fff" : "#a0b4bc",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, transition: "all 0.2s", flexShrink: 0,
                  boxShadow: input.trim() && !loading ? "0 4px 12px rgba(32,106,109,0.3)" : "none",
                }}
              >
                ➤
              </button>
            </div>

            {/* Footer branding */}
            <div style={{
              textAlign: "center", padding: "5px 0 8px",
              fontSize: 11, color: "#b0bec5",
              background: "rgba(255,255,255,0.5)",
              letterSpacing: "0.04em",
            }}>
              Powered by <span style={{ color: "#206a6d", fontWeight: 600 }}>Claude AI</span>
            </div>
          </div>
        )}

        {/* Floating toggle button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={open ? "" : "btn-pulse btn-wiggle"}
          style={{
            width: 58, height: 58, borderRadius: "50%", border: "none",
            background: open
              ? "linear-gradient(135deg, #1d2d3c, #206a6d)"
              : "linear-gradient(135deg, #206a6d, #b6563f)",
            color: "#fff", fontSize: open ? 18 : 24,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(32,106,109,0.4)",
            transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
            transform: open ? "scale(0.92)" : "scale(1)",
          }}
          onMouseEnter={(e) => { if (!open) e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = open ? "scale(0.92)" : "scale(1)"; }}
          aria-label="Chat with assistant"
        >
          {open ? "✕" : "🎙️"}
        </button>
      </div>
    </>
  );
}
