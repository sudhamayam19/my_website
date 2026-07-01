"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CallState = "connecting" | "live" | "ended" | "error";

// Ephemeral tokens require the Constrained endpoint
const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const PRIMARY_MODEL = "models/gemini-3.1-flash-live-preview";        // fast, preview
const FALLBACK_MODEL = "models/gemini-2.5-flash-native-audio-latest"; // stable
const IN_RATE = 16000;   // mic → Gemini
const OUT_RATE = 24000;  // Gemini → speaker

// Tools Tillu can call during a live call (executed server-side via /api/mobile/tillu-tool)
const LIVE_TOOLS = [{
  functionDeclarations: [
    { name: "web_search", description: "Search the live web for current news, cricket scores, facts, trending topics.",
      parameters: { type: "OBJECT", properties: { query: { type: "STRING", description: "search query" } }, required: ["query"] } },
    { name: "save_draft", description: "Write and save a COMPLETE blog article as a draft to Sudha's website. Use when she asks you to write/draft an article.",
      parameters: { type: "OBJECT", properties: {
        title: { type: "STRING" }, category: { type: "STRING" }, excerpt: { type: "STRING" },
        content: { type: "STRING", description: "the full article body, paragraphs separated by blank lines" },
      }, required: ["title", "content"] } },
    { name: "add_todo", description: "Add a task/reminder to Sudha's list.",
      parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
    { name: "set_week_topic", description: "Pin this week's content topic.",
      parameters: { type: "OBJECT", properties: { topic: { type: "STRING" } }, required: ["topic"] } },
  ],
}];

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
  const setupOkRef = useRef(false);
  const triedFallbackRef = useRef(false);
  const [visual, setVisual] = useState<"none" | "camera" | "screen">("none");
  const [typed, setTyped] = useState("");
  const visualStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const facingRef = useRef<"environment" | "user">("environment");

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

  // ── Camera / screen share: send a downscaled JPEG frame to Gemini every ~1.5s ──
  const stopVisual = () => {
    if (frameTimerRef.current) { clearInterval(frameTimerRef.current); frameTimerRef.current = null; }
    try { visualStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    visualStreamRef.current = null;
    setVisual("none");
  };

  const sendFrame = () => {
    const v = videoElRef.current;
    const ws = wsRef.current;
    if (!v || v.videoWidth === 0 || !ws || ws.readyState !== WebSocket.OPEN) return;
    const maxW = 768;
    const scale = Math.min(1, maxW / v.videoWidth);
    const w = Math.round(v.videoWidth * scale), h = Math.round(v.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const b64 = dataUrl.split(",")[1];
    if (b64) ws.send(JSON.stringify({ realtimeInput: { video: { mimeType: "image/jpeg", data: b64 } } }));
  };

  const startVisual = async (kind: "camera" | "screen", facing: "environment" | "user" = facingRef.current) => {
    if (visual !== "none") { stopVisual(); if (visual === kind && kind === "screen") return; }
    try {
      const stream = kind === "camera"
        ? await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
        : await navigator.mediaDevices.getDisplayMedia({ video: true });
      visualStreamRef.current = stream;
      if (kind === "camera") facingRef.current = facing;
      // user stops screen share from the browser UI
      stream.getVideoTracks()[0]?.addEventListener("ended", stopVisual);
      setVisual(kind);
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
        await videoElRef.current.play().catch(() => {});
      }
      if (!frameTimerRef.current) frameTimerRef.current = setInterval(sendFrame, 1500);
      addTranscript("you", kind === "camera" ? "📷 [showing camera]" : "🖥️ [sharing screen]");
    } catch {
      // permission denied / cancelled — ignore
    }
  };

  // Flip front ↔ back camera without dropping the call
  const flipCamera = async () => {
    const next = facingRef.current === "environment" ? "user" : "environment";
    await startVisual("camera", next); // startVisual stops the old stream first
  };

  // Text fallback — type to Tillu if mic doesn't work; Tillu still replies with voice
  const sendTyped = () => {
    const text = typed.trim();
    const ws = wsRef.current;
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }));
    addTranscript("you", text);
    lastRoleRef.current = null;
    setTyped("");
  };

  const cleanup = () => {
    try { procRef.current?.disconnect(); } catch { /* */ }
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    try { micCtxRef.current?.close(); } catch { /* */ }
    try { playCtxRef.current?.close(); } catch { /* */ }
    try { wsRef.current?.close(); } catch { /* */ }
    stopVisual();
  };

  const endCall = () => {
    liveRef.current = false;
    cleanup();
    setState("ended");
    onClose();
  };

  // If the fast preview model fails before setup completes, retry once with the stable model
  const maybeFallback = (): boolean => {
    if (setupOkRef.current || triedFallbackRef.current || !liveRef.current) return false;
    triedFallbackRef.current = true;
    try { wsRef.current?.close(); } catch { /* */ }
    void start(FALLBACK_MODEL);
    return true;
  };

  const start = async (model: string = PRIMARY_MODEL) => {
    setupOkRef.current = false;
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

    // 2. Mic permission + capture context (reuse existing stream on fallback retry)
    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      } catch {
        setError("Microphone permission needed for the call.");
        setState("error");
        return;
      }
    }

    // 3. Open WebSocket with the ephemeral token
    const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send setup (model + audio response + Tillu's system instruction)
      ws.send(JSON.stringify({
        setup: {
          model,
          generationConfig: { responseModalities: ["AUDIO"] },
          tools: LIVE_TOOLS,
          // Less trigger-happy interruption: only cut off on a clear, sustained voice
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
              endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
              prefixPaddingMs: 300,
              silenceDurationMs: 700,
            },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        },
      }));
      if (!procRef.current) startMic(); // mic set up once; survives fallback retry
      setState("live");
    };

    ws.onmessage = async (ev) => {
      let payload: string;
      if (ev.data instanceof Blob) payload = await ev.data.text();
      else payload = ev.data as string;
      handleServerMessage(payload);
    };

    ws.onerror = () => {
      if (maybeFallback()) return;
      if (liveRef.current && !setupOkRef.current) { setError("Connection error. Try again."); setState("error"); }
    };
    ws.onclose = (e) => {
      // A close before setup completed usually means the model failed → fall back
      if (e.code !== 1000 && maybeFallback()) return;
      if (liveRef.current && setupOkRef.current) { setState("ended"); }
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
    const proc = ctx.createScriptProcessor(2048, 1, 1); // smaller buffer = lower latency
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

  // Execute a tool server-side and send the result back over the WS
  const handleToolCall = async (calls: { id: string; name: string; args: Record<string, string> }[]) => {
    const responses = [];
    for (const c of calls) {
      let result: unknown = { error: "failed" };
      try {
        const res = await fetch("/api/mobile/tillu-tool", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
          body: JSON.stringify({ name: c.name, args: c.args }),
        });
        const data = await res.json() as { result?: unknown };
        result = data.result ?? { ok: true };
        if (c.name === "save_draft" && (result as { saved?: boolean })?.saved) {
          addTranscript("tillu", `📝 [saved draft: "${c.args.title}"]`);
        }
      } catch { result = { error: "tool error" }; }
      responses.push({ id: c.id, name: c.name, response: result });
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
    }
  };

  // Handle Gemini's streamed audio replies
  const handleServerMessage = (raw: string) => {
    let msg: {
      setupComplete?: unknown;
      error?: { message?: string };
      toolCall?: { functionCalls?: { id: string; name: string; args: Record<string, string> }[] };
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
      if (maybeFallback()) return;
      if (liveRef.current) { setError(msg.error.message); setState("error"); }
      return;
    }
    if (msg.setupComplete) { setupOkRef.current = true; return; } // handshake ok

    if (msg.toolCall?.functionCalls?.length) {
      void handleToolCall(msg.toolCall.functionCalls);
      return;
    }

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

      {/* Live camera / screen preview (also the frame-capture source) */}
      <div className={visual === "none" ? "hidden" : "relative mt-3"}>
        <video
          ref={videoElRef}
          muted
          playsInline
          className="h-24 w-40 rounded-xl border border-[#1f6973] object-cover"
        />
        {visual === "camera" && (
          <button
            onClick={() => void flipCamera()}
            title="Flip camera"
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1f6973] text-white shadow-lg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        {state === "error" ? (
          <button onClick={onClose} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1f2d39]">Close</button>
        ) : (
          <>
            {/* Camera */}
            <button
              onClick={() => (visual === "camera" ? stopVisual() : void startVisual("camera"))}
              disabled={state !== "live"}
              title="Show camera to Tillu"
              className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-40 ${
                visual === "camera" ? "bg-[#1f6973] text-white" : "border border-[#5f8288] text-[#9ec7cc]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d33] text-white shadow-lg transition hover:bg-[#b22]"
              title="End call"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 rotate-[135deg]">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>

            {/* Share screen */}
            <button
              onClick={() => (visual === "screen" ? stopVisual() : void startVisual("screen"))}
              disabled={state !== "live"}
              title="Share screen with Tillu"
              className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-40 ${
                visual === "screen" ? "bg-[#1f6973] text-white" : "border border-[#5f8288] text-[#9ec7cc]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </button>
          </>
        )}
      </div>

      {visual !== "none" && (
        <p className="mt-2 text-[11px] text-[#7fb3b8]">
          {visual === "camera" ? "📷 Tillu can see your camera" : "🖥️ Tillu can see your screen"} — tap again to stop
        </p>
      )}

      {/* Text fallback — type if mic isn't working; Tillu still replies by voice */}
      {state === "live" && (
        <div className="mt-4 flex w-full max-w-md items-center gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendTyped(); }}
            placeholder="Type to Tillu (if mic doesn't work)…"
            className="flex-1 rounded-full border border-[#1f4a52] bg-[#0a2026] px-4 py-2.5 text-sm text-white placeholder-[#5f8288] outline-none focus:border-[#1f6973]"
          />
          <button
            onClick={sendTyped}
            disabled={!typed.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f6973] text-white transition hover:bg-[#185860] disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rotate-45">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
