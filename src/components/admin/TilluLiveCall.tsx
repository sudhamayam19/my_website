"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CallState = "connecting" | "live" | "ended" | "error";

// Ephemeral tokens require the Constrained endpoint
const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const MODEL = "models/gemini-2.5-flash-native-audio-latest";
const IN_RATE = 16000;   // mic → Gemini
const OUT_RATE = 24000;  // Gemini → speaker

// base64 helpers
function b64FromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function bytesFromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function TilluLiveCall({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<CallState>("connecting");
  const [error, setError] = useState("");
  const [tilluSpeaking, setTilluSpeaking] = useState(false);
  const [dbg, setDbg] = useState({ rx: 0, audio: 0, txKb: 0 });
  const [turns, setTurns] = useState<{ role: "you" | "tillu"; text: string }[]>([]);
  const [secs, setSecs] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const turnsRef = useRef<{ role: "you" | "tillu"; text: string }[]>([]);
  const lastRoleRef = useRef<"you" | "tillu" | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const playHeadRef = useRef(0);
  const liveRef = useRef(true);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    liveRef.current = true;
    void start();
    return () => { liveRef.current = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer while the call is live
  useEffect(() => {
    if (state !== "live") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Auto-scroll transcript to newest line
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Append a streaming transcript chunk under the right speaker
  const addTranscript = (role: "you" | "tillu", chunk: string) => {
    if (!chunk) return;
    const arr = turnsRef.current;
    if (lastRoleRef.current === role && arr.length > 0 && arr[arr.length - 1].role === role) {
      arr[arr.length - 1] = { role, text: arr[arr.length - 1].text + chunk };
    } else {
      arr.push({ role, text: chunk });
      lastRoleRef.current = role;
    }
    turnsRef.current = [...arr];
    setTurns(turnsRef.current);
  };

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const cleanup = () => {
    try { procRef.current?.disconnect(); } catch { /* */ }
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    try { micCtxRef.current?.close(); } catch { /* */ }
    try { playCtxRef.current?.close(); } catch { /* */ }
    try { wsRef.current?.close(); } catch { /* */ }
  };

  const endCall = () => {
    liveRef.current = false;
    cleanup();
    setState("ended");
    onClose();
  };

  const start = async () => {
    // 1. Get an ephemeral token + system instruction from our server
    let token = "";
    let systemInstruction = "";
    try {
      const res = await fetch("/api/mobile/tillu-live-token", { method: "POST", credentials: "same-origin" });
      const data = await res.json() as { token?: string; systemInstruction?: string; error?: string };
      if (!data.token) throw new Error(data.error ?? "No token");
      token = data.token;
      systemInstruction = data.systemInstruction ?? "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Token error");
      setState("error");
      return;
    }

    // 2. Mic permission + capture context
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("Microphone permission needed for the call.");
      setState("error");
      return;
    }

    // 3. Open WebSocket with the ephemeral token
    const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send setup (model + audio response + Tillu's system instruction)
      ws.send(JSON.stringify({
        setup: {
          model: MODEL,
          generationConfig: { responseModalities: ["AUDIO"] },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        },
      }));
      startMic();
      setState("live");
    };

    ws.onmessage = async (ev) => {
      let payload: string;
      if (ev.data instanceof Blob) payload = await ev.data.text();
      else payload = ev.data as string;
      handleServerMessage(payload);
    };

    ws.onerror = () => {
      if (liveRef.current) { setError("Connection error. Try again."); setState("error"); }
    };
    ws.onclose = () => {
      if (liveRef.current && state === "live") { setState("ended"); }
    };
  };

  // Stream mic audio → Gemini as TRUE 16kHz PCM16 base64 (downsampled from native rate)
  const startMic = () => {
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    // Don't force sampleRate — browsers often ignore it. Use native rate and downsample ourselves.
    const ctx = new AudioCtx();
    micCtxRef.current = ctx;
    void ctx.resume();
    const srcRate = ctx.sampleRate; // typically 48000
    const src = ctx.createMediaStreamSource(streamRef.current!);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    procRef.current = proc;

    proc.onaudioprocess = (e) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const down = downsample(input, srcRate, IN_RATE);
      const pcm = new Int16Array(down.length);
      for (let i = 0; i < down.length; i++) {
        const s = Math.max(-1, Math.min(1, down[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const b64 = b64FromBytes(new Uint8Array(pcm.buffer));
      // Current native-audio Live API expects realtimeInput.audio (singular Blob)
      ws.send(JSON.stringify({
        realtimeInput: { audio: { mimeType: `audio/pcm;rate=${IN_RATE}`, data: b64 } },
      }));
      setDbg((d) => ({ ...d, txKb: d.txKb + Math.round(b64.length / 1024) }));
    };

    src.connect(proc);
    proc.connect(ctx.destination);
  };

  // Linear-interpolation downsample from srcRate → dstRate
  const downsample = (buf: Float32Array, srcRate: number, dstRate: number): Float32Array => {
    if (dstRate >= srcRate) return buf;
    const ratio = srcRate / dstRate;
    const newLen = Math.round(buf.length / ratio);
    const out = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const idx = i * ratio;
      const lo = Math.floor(idx);
      const hi = Math.min(lo + 1, buf.length - 1);
      const frac = idx - lo;
      out[i] = buf[lo] * (1 - frac) + buf[hi] * frac;
    }
    return out;
  };

  // Handle Gemini's streamed audio replies
  const handleServerMessage = (raw: string) => {
    let msg: {
      setupComplete?: unknown;
      error?: { message?: string };
      serverContent?: {
        modelTurn?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
        outputTranscription?: { text?: string };
        inputTranscription?: { text?: string };
        turnComplete?: boolean;
        interrupted?: boolean;
      };
    };
    try { msg = JSON.parse(raw); } catch { return; }

    setDbg((d) => ({ ...d, rx: d.rx + 1 }));

    if (msg.error?.message) {
      if (liveRef.current) { setError(msg.error.message); setState("error"); }
      return;
    }
    if (msg.setupComplete) return; // handshake ok

    const sc = msg.serverContent;
    if (!sc) return;

    // Live transcripts → on-screen text
    if (sc.inputTranscription?.text) addTranscript("you", sc.inputTranscription.text);
    if (sc.outputTranscription?.text) addTranscript("tillu", sc.outputTranscription.text);

    if (sc.interrupted) { stopPlayback(); return; }

    const parts = sc.modelTurn?.parts ?? [];
    for (const p of parts) {
      const data = p.inlineData?.data;
      const mime = p.inlineData?.mimeType ?? "";
      // Accept PCM audio (mime usually "audio/pcm;rate=24000"); play any inline audio data
      if (data && (mime.includes("audio") || mime.includes("pcm") || mime === "")) {
        setDbg((d) => ({ ...d, audio: d.audio + 1 }));
        playPcm(data);
      }
    }
    if (sc.turnComplete) {
      lastRoleRef.current = null; // next transcript chunk starts a fresh line
      setTimeout(() => setTilluSpeaking(false), 150);
    }
  };

  const copyTurn = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((c) => (c === i ? null : c)), 1500);
    } catch { /* clipboard blocked */ }
  };

  // Instantly cut off Tillu's voice (used when Akka interrupts by speaking)
  const stopPlayback = () => {
    for (const node of activeSourcesRef.current) {
      try { node.onended = null; node.stop(); } catch { /* already stopped */ }
    }
    activeSourcesRef.current = [];
    if (playCtxRef.current) playHeadRef.current = playCtxRef.current.currentTime;
    setTilluSpeaking(false);
  };

  // Queue + play 24kHz PCM16 chunk
  const playPcm = (b64: string) => {
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!playCtxRef.current || playCtxRef.current.state === "closed") {
      playCtxRef.current = new AudioCtx();
      playHeadRef.current = playCtxRef.current.currentTime;
    }
    const ctx = playCtxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    const bytes = bytesFromB64(b64);
    const pcm = new Int16Array(bytes.buffer);
    const f32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;

    const buf = ctx.createBuffer(1, f32.length, OUT_RATE);
    buf.copyToChannel(f32, 0);
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.connect(ctx.destination);

    // Track so we can stop instantly on interruption
    activeSourcesRef.current.push(node);
    node.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((n) => n !== node);
    };

    const startAt = Math.max(ctx.currentTime, playHeadRef.current);
    node.start(startAt);
    playHeadRef.current = startAt + buf.duration;
    setTilluSpeaking(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-[#0c2830]/95 px-4 py-6 backdrop-blur">
      <div className={`relative mt-2 transition-transform ${tilluSpeaking ? "scale-110" : "scale-100"}`}>
        {tilluSpeaking && (
          <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-[#1f6973]/40" />
        )}
        <Image src="/tillu/tillu-mic.png" alt="Tillu" width={120} height={120} priority className="relative" />
      </div>

      <p className="mt-2 text-lg font-bold text-white">Tillu</p>
      <p className="mt-0.5 text-xs font-semibold text-[#9ec7cc]">
        {state === "connecting" && "Connecting… 📞"}
        {state === "live" && (tilluSpeaking ? "🔊 Tillu maatladtundi…" : "🎙️ Vintunna Akka — maatladandi!")}
        {state === "ended" && "Call ended"}
        {state === "error" && `⚠️ ${error}`}
        {state === "live" && `  ·  ${mmss(secs)}`}
      </p>

      {/* Live transcript */}
      {state === "live" && (
        <div className="mt-4 w-full max-w-md flex-1 overflow-y-auto rounded-2xl border border-[#1f4a52] bg-[#0a2026]/60 p-3 space-y-2">
          {turns.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#5f8288]">Maatladandi Akka — your conversation appears here 📝</p>
          ) : (
            turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "you" ? "justify-end" : "justify-start"}`}>
                <div className={`group max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  t.role === "you" ? "bg-[#1f6973] text-white" : "bg-[#13343c] text-[#dfeeef]"
                }`}>
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider opacity-50">
                    {t.role === "you" ? "Akka" : "Tillu"}
                  </span>
                  {t.text}
                  {t.role === "tillu" && t.text.length > 8 && (
                    <button onClick={() => void copyTurn(t.text, i)} className="ml-2 text-[10px] font-semibold text-[#7fb3b8] hover:text-white">
                      {copiedIdx === i ? "✓" : "copy"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      )}

      <div className="mt-5 flex items-center gap-5">
        {state === "error" ? (
          <button onClick={onClose} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1f2d39]">Close</button>
        ) : (
          <button
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d33] text-white shadow-lg transition hover:bg-[#b22]"
            title="End call"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 rotate-[135deg]">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
