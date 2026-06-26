"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type TilluPose = "idle" | "wave" | "mic" | "idea";
function TilluImg({ pose, size }: { pose: TilluPose; size: number }) {
  return (
    <Image
      src={`/tillu/tillu-${pose}.png`}
      alt="Tillu"
      width={size}
      height={size}
      priority={pose === "wave"}
      style={{ objectFit: "contain" }}
    />
  );
}

interface Msg { role: "user" | "assistant"; text: string }
interface GeminiMsg { role: "user" | "model"; parts: [{ text: string }] }

const WELCOME = `Good day Akka! 🤖 Tillu ikkade unna — ready to help!\n\nBlog ideas, podcast topics, reminders — anni chesta. Cheppandi em kaavalo Akka! ✨`;

const CURRENT_KEY = "tillu_web_current_v1";
const MEMORY_KEY  = "tillu_web_memory_v1";   // compact list of past ideas/topics

const QUICK_PROMPTS = [
  "Kohli article ideas cheppandi! 🏏",
  "This week content plan cheyyi",
  "3 podcast topics suggest cheyyi",
  "Telugu culture article ideas?",
  "What should I work on today?",
];

// Minimal browser SpeechRecognition typings
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function TilluWebChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceModeRef = useRef(false);
  const sendRef = useRef<((override?: string, speak?: boolean) => Promise<void>) | null>(null);

  // Load persisted chat + memory on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Msg[];
        if (saved.length > 0) setMsgs(saved);
      }
      const mem = localStorage.getItem(MEMORY_KEY);
      if (mem) setMemory(JSON.parse(mem) as string[]);
    } catch { /* ignore corrupt */ }
  }, []);

  // Persist current chat whenever it changes
  useEffect(() => {
    if (msgs.length > 0) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(msgs.slice(-100)));
    }
  }, [msgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, sending]);

  // Add a user prompt to compact memory (deduped, capped)
  const rememberIdea = (text: string) => {
    setMemory((prev) => {
      const clean = text.trim();
      if (!clean || prev.includes(clean)) return prev;
      const updated = [...prev, clean].slice(-60); // keep last 60 ideas
      localStorage.setItem(MEMORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const send = async (override?: string, speakReply = false) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    rememberIdea(text);

    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next);

    // Build history; prepend a compact memory turn so Tillu recalls past ideas
    const history: GeminiMsg[] = [];
    if (memory.length > 0) {
      history.push({
        role: "user",
        parts: [{ text: `[MEMORY — topics & ideas we've worked on before, remember these]:\n${memory.map((m) => `• ${m}`).join("\n")}` }],
      });
      history.push({ role: "model", parts: [{ text: "గుర్తుపెట్టుకున్నాను Akka! 🧠 I remember all of these." }] });
    }
    next
      .filter((m) => m.text !== WELCOME)
      .slice(-14)
      .forEach((m) => history.push({
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
      const reply = data.text ?? (data.error ? `Error: ${data.error}` : "Something went wrong 😅");
      setMsgs((prev) => [...prev, { role: "assistant", text: reply }]);
      if (speakReply) speak(reply);
    } catch (e) {
      setMsgs((prev) => [...prev, {
        role: "assistant",
        text: e instanceof Error ? `Arey! Error: ${e.message}` : "Network error 😅",
      }]);
    } finally {
      setSending(false);
    }
  };
  sendRef.current = send;

  // Speak text aloud; when in voice mode, resume listening after Tillu finishes
  const speak = (raw: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const clean = raw
      .replace(/[*#_`>]/g, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\n{2,}/g, ". ")
      .trim();
    if (!clean) { if (voiceModeRef.current) startVoiceListen(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const indian = voices.find((v) => /en-IN|hi-IN|te-IN/i.test(v.lang));
    if (indian) u.voice = indian;
    u.rate = 1.02;
    u.pitch = 1.1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); if (voiceModeRef.current) startVoiceListen(); };
    u.onerror = () => { setSpeaking(false); if (voiceModeRef.current) startVoiceListen(); };
    window.speechSynthesis.speak(u);
  };

  // One listen cycle for hands-free voice mode → auto-sends final transcript
  const startVoiceListen = () => {
    if (!voiceModeRef.current) return;
    const rec = getSpeechRecognition();
    if (!rec) return;
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      finalText = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join("");
      setInput(finalText);
    };
    rec.onend = () => {
      setListening(false);
      const t = finalText.trim();
      if (t && voiceModeRef.current) { setInput(""); void sendRef.current?.(t, true); }
      else if (voiceModeRef.current) { startVoiceListen(); } // heard nothing, keep listening
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* already started */ }
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    voiceModeRef.current = next;
    if (next) {
      const rec = getSpeechRecognition();
      if (!rec) { alert("Voice not supported in this browser. Try Chrome."); setVoiceMode(false); voiceModeRef.current = false; return; }
      startVoiceListen();
    } else {
      recRef.current?.stop();
      window.speechSynthesis?.cancel();
      setListening(false);
      setSpeaking(false);
    }
  };

  // Start a fresh chat — keeps MEMORY, only clears the visible thread
  const newChat = () => {
    setMsgs([{ role: "assistant", text: WELCOME }]);
    localStorage.removeItem(CURRENT_KEY);
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = getSpeechRecognition();
    if (!rec) { alert("Voice input not supported in this browser. Try Chrome."); return; }
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  const copyMsg = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="flex h-screen flex-col bg-[#fffaf3]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#e8dece] bg-[#fffaf3] px-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center">
          <TilluImg pose={listening ? "mic" : sending ? "idea" : "idle"} size={48} />
        </div>
        <div>
          <p className="text-base font-bold text-[#1f2d39]">Tillu</p>
          <p className="text-xs font-semibold text-[#8fa3ad]">
            AI Creative Buddy{memory.length > 0 ? ` · 🧠 ${memory.length} ideas remembered` : ""}
          </p>
        </div>
        <button
          onClick={toggleVoiceMode}
          className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold transition ${
            voiceMode
              ? "bg-[#c85a2a] text-white animate-pulse"
              : "border border-[#1f6973] text-[#1f6973] hover:bg-[#e8f4f5]"
          }`}
        >
          {voiceMode ? (speaking ? "🔊 Tillu maatladtundi…" : listening ? "🎙️ Vintunna…" : "🎙️ Live ON") : "🎙️ Talk Live"}
        </button>
        <button
          onClick={newChat}
          className="rounded-full border border-[#d3c1a8] px-3 py-1.5 text-xs font-bold text-[#455964] hover:border-[#1f6973] hover:text-[#1f6973] transition"
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
                <TilluImg pose={i === 0 ? "wave" : "idle"} size={32} />
              </div>
            )}
            <div className="max-w-[78%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-sm bg-[#1f6973] text-white"
                    : "rounded-bl-sm border border-[#e8dece] bg-white text-[#1f2d39]"
                }`}
              >
                {m.text}
              </div>
              {m.role === "assistant" && m.text !== WELCOME && (
                <button
                  onClick={() => void copyMsg(m.text, i)}
                  className="mt-1 ml-1 inline-flex items-center gap-1 rounded-full border border-[#e8dece] bg-[#f7efe4] px-2.5 py-1 text-[11px] font-semibold text-[#5f6f79] hover:border-[#1f6973] hover:text-[#1f6973] transition"
                >
                  {copied === i ? (
                    <>✓ Copied</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy script
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              <TilluImg pose="idea" size={32} />
            </div>
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
      <div className="border-t border-[#e8dece] bg-[#fffaf3] px-4 py-3 pr-20 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={listening ? "Listening… 🎤 maatladandi" : "Tillu tho maatladandi…"}
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-2xl border border-[#d3c1a8] bg-[#f7efe4] px-4 py-2.5 text-sm text-[#1f2d39] placeholder-[#8fa3ad] outline-none focus:border-[#1f6973] disabled:opacity-60 max-h-32"
          style={{ lineHeight: "1.5" }}
        />
        {/* Mic / dictate button */}
        <button
          onClick={toggleMic}
          title="Dictate"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
            listening ? "bg-[#c85a2a] text-white animate-pulse" : "border border-[#d3c1a8] text-[#1f6973] hover:border-[#1f6973]"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
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
