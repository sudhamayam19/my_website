"use client";

import { useEffect, useRef, useState } from "react";

interface Msg { role: "user" | "assistant"; text: string }
interface GeminiMsg { role: "user" | "model"; parts: [{ text: string }] }

const WELCOME = `Good day! 🤖 Tillu ikkade unna — ready to help!\n\nBlog ideas, podcast topics, reminders — anni chesta. Cheppandi em kaavalo! ✨`;

const QUICK_PROMPTS = [
  "Kohli article ideas cheppandi! 🏏",
  "This week content plan cheyyi",
  "3 podcast topics suggest cheyyi",
  "Telugu culture article ideas?",
  "What should I work on today?",
];

export function TilluWebChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, sending]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next);

    const history: GeminiMsg[] = next
      .filter((m) => m.text !== WELCOME)
      .slice(-14)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    try {
      const res = await fetch("/api/mobile/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ messages: history, todos: [] }),
      });
      const data = await res.json() as { text?: string; error?: string };
      setMsgs((prev) => [...prev, {
        role: "assistant",
        text: data.text ?? (data.error ? `Error: ${data.error}` : "Something went wrong 😅"),
      }]);
    } catch (e) {
      setMsgs((prev) => [...prev, {
        role: "assistant",
        text: e instanceof Error ? `Arey! Error: ${e.message}` : "Network error 😅",
      }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  return (
    <div className="flex h-screen flex-col bg-[#fffaf3]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#e8dece] bg-[#fffaf3] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f6973] text-xl shadow">
          🤖
        </div>
        <div>
          <p className="text-base font-bold text-[#1f2d39]">Tillu</p>
          <p className="text-xs font-semibold text-[#8fa3ad]">AI Creative Buddy</p>
        </div>
        <button
          onClick={() => setMsgs([{ role: "assistant", text: WELCOME }])}
          className="ml-auto rounded-full border border-[#d3c1a8] px-3 py-1.5 text-xs font-bold text-[#455964] hover:border-[#1f6973] hover:text-[#1f6973] transition"
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f6973] text-sm">
                🤖
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "rounded-br-sm bg-[#1f6973] text-white"
                  : "rounded-bl-sm border border-[#e8dece] bg-white text-[#1f2d39]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f6973] text-sm">🤖</div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[#e8dece] bg-white px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#1f6973]"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — shown when chat is fresh */}
      {msgs.length <= 1 && !sending && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              className="shrink-0 rounded-full border border-[#d3c1a8] bg-white px-4 py-2 text-xs font-semibold text-[#1f6973] hover:border-[#1f6973] transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#e8dece] bg-[#fffaf3] px-4 py-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Tillu tho maatladandi…"
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-2xl border border-[#d3c1a8] bg-[#f7efe4] px-4 py-2.5 text-sm text-[#1f2d39] placeholder-[#8fa3ad] outline-none focus:border-[#1f6973] disabled:opacity-60 max-h-32"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={() => void send()}
          disabled={!input.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f6973] text-white transition hover:bg-[#185860] disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rotate-45">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
