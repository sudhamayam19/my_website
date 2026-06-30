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

  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const playHeadRef = useRef(0);
  const liveRef = useRef(true);

  useEffect(() => {
    liveRef.current = true;
    void start();
    return () => { liveRef.current = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setTimeout(() => setTilluSpeaking(false), 150);
    }
  };

  const stopPlayback = () => {
    try { playCtxRef.current?.close(); } catch { /* */ }
    playCtxRef.current = null;
    playHeadRef.current = 0;
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

    const startAt = Math.max(ctx.currentTime, playHeadRef.current);
    node.start(startAt);
    playHeadRef.current = startAt + buf.duration;
    setTilluSpeaking(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c2830]/95 backdrop-blur">
      <div className={`relative mb-8 transition-transform ${tilluSpeaking ? "scale-110" : "scale-100"}`}>
        {tilluSpeaking && (
          <span className="absolute inset-0 -m-4 animate-ping rounded-full bg-[#1f6973]/40" />
        )}
        <Image src="/tillu/tillu-mic.png" alt="Tillu" width={180} height={180} priority className="relative" />
      </div>

      <p className="text-xl font-bold text-white">Tillu</p>
      <p className="mt-1 text-sm font-semibold text-[#9ec7cc]">
        {state === "connecting" && "Connecting… 📞"}
        {state === "live" && (tilluSpeaking ? "🔊 Tillu maatladtundi…" : "🎙️ Vintunna Akka — maatladandi!")}
        {state === "ended" && "Call ended"}
        {state === "error" && `⚠️ ${error}`}
      </p>
      {state === "live" && (
        <p className="mt-1 font-mono text-[10px] text-[#5f8288]">
          mic↑{dbg.txKb}kb · server↓{dbg.rx} · audio{dbg.audio}
        </p>
      )}

      <div className="mt-10 flex items-center gap-5">
        {state === "error" ? (
          <button onClick={onClose} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1f2d39]">Close</button>
        ) : (
          <button
            onClick={endCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d33] text-white shadow-lg transition hover:bg-[#b22]"
            title="End call"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 rotate-[135deg]">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </button>
        )}
      </div>

      <p className="mt-6 max-w-xs text-center text-[11px] text-[#6f9298]">
        Real Gemini Live · native voice. Speak naturally — Tillu hears you and talks back.
      </p>
    </div>
  );
}
