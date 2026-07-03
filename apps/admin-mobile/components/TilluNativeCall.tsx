import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Image, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchTilluLiveToken, executeTilluTool } from "../lib/mobile-api";
import { onAudioInput, playChunk, startRecording, stopPlayback, stopRecording } from "../modules/tillu-audio";

const C = { bg: "#0c2830", teal: "#1f6973", sub: "#9ec7cc", faint: "#5f8288", white: "#fff" };

const MODEL = "models/gemini-2.5-flash-native-audio-latest"; // stable native-audio for reliability
const WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const VOICE = "Leda";

const LIVE_TOOLS = [{
  functionDeclarations: [
    { name: "web_search", description: "Search the live web for news, scores, facts.", parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] } },
    { name: "save_draft", description: "Write and save a full blog article draft.", parameters: { type: "OBJECT", properties: { title: { type: "STRING" }, category: { type: "STRING" }, excerpt: { type: "STRING" }, content: { type: "STRING" } }, required: ["title", "content"] } },
    { name: "add_todo", description: "Add a task/reminder.", parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
    { name: "set_week_topic", description: "Pin this week's topic.", parameters: { type: "OBJECT", properties: { topic: { type: "STRING" } }, required: ["topic"] } },
  ],
}];

type State = "connecting" | "live" | "error" | "ended";
interface Turn { role: "you" | "tillu"; text: string }

export function TilluNativeCall({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>("connecting");
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const liveRef = useRef(true);
  const lastRoleRef = useRef<"you" | "tillu" | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const inputSubRef = useRef<{ remove: () => void } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    liveRef.current = true;
    void start();
    return () => { liveRef.current = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    try { inputSubRef.current?.remove(); } catch { /* */ }
    try { stopRecording(); } catch { /* */ }
    try { stopPlayback(); } catch { /* */ }
    try { wsRef.current?.close(); } catch { /* */ }
  };

  const addTurn = (role: "you" | "tillu", chunk: string) => {
    if (!chunk) return;
    const arr = turnsRef.current;
    if (lastRoleRef.current === role && arr.length && arr[arr.length - 1].role === role) {
      arr[arr.length - 1] = { role, text: arr[arr.length - 1].text + chunk };
    } else {
      arr.push({ role, text: chunk });
      lastRoleRef.current = role;
    }
    turnsRef.current = [...arr];
    setTurns(turnsRef.current);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const start = async () => {
    // 1. Mic permission (Android)
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) { setError("Microphone permission needed."); setState("error"); return; }
    }

    // 2. Ephemeral token + system instruction
    let token = "", systemInstruction = "";
    try {
      const data = await fetchTilluLiveToken();
      token = data.token; systemInstruction = data.systemInstruction ?? "";
    } catch (e) { setError(e instanceof Error ? e.message : "Token error"); setState("error"); return; }

    // 3. WebSocket
    const ws = new WebSocket(`${WS_BASE}?access_token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        setup: {
          model: MODEL,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
          tools: LIVE_TOOLS,
          realtimeInputConfig: { automaticActivityDetection: { startOfSpeechSensitivity: "START_SENSITIVITY_LOW", endOfSpeechSensitivity: "END_SENSITIVITY_LOW", prefixPaddingMs: 300, silenceDurationMs: 700 } },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        },
      }));
      // Start streaming mic → WS
      inputSubRef.current = onAudioInput(({ base64 }) => {
        const w = wsRef.current;
        if (w && w.readyState === WebSocket.OPEN) {
          w.send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: base64 } } }));
        }
      });
      startRecording();
      setState("live");
    };

    ws.onmessage = (ev) => handleMessage(typeof ev.data === "string" ? ev.data : "");
    ws.onerror = () => { if (liveRef.current) { setError("Connection error."); setState("error"); } };
    ws.onclose = () => { if (liveRef.current && state === "live") setState("ended"); };
  };

  const handleMessage = async (raw: string) => {
    let m: any;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.error?.message) { if (liveRef.current) { setError(m.error.message); setState("error"); } return; }
    if (m.setupComplete) return;

    if (m.toolCall?.functionCalls?.length) {
      const responses = [];
      for (const c of m.toolCall.functionCalls) {
        let result: unknown = { ok: true };
        try { const r = await executeTilluTool(c.name, c.args); result = r.result; } catch { result = { error: "tool failed" }; }
        responses.push({ id: c.id, name: c.name, response: result });
      }
      wsRef.current?.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
      return;
    }

    const sc = m.serverContent;
    if (!sc) return;
    if (sc.inputTranscription?.text) addTurn("you", sc.inputTranscription.text);
    if (sc.outputTranscription?.text) addTurn("tillu", sc.outputTranscription.text);
    if (sc.interrupted) { stopPlayback(); return; }
    for (const p of (sc.modelTurn?.parts ?? [])) {
      if (p.inlineData?.data) playChunk(p.inlineData.data);
    }
    if (sc.turnComplete) lastRoleRef.current = null;
  };

  const end = () => { liveRef.current = false; cleanup(); onClose(); };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <Pressable onPress={end} style={styles.close} hitSlop={10}>
        <Ionicons name="chevron-down" size={26} color={C.white} />
      </Pressable>

      <Image source={require("../assets/tillu/tillu-mic.png")} style={styles.avatar} />
      <Text style={styles.name}>Tillu</Text>
      <Text style={styles.status}>
        {state === "connecting" && "Connecting… 📞"}
        {state === "live" && "🎙️ Vintunna Akka — maatladandi!"}
        {state === "ended" && "Call ended"}
        {state === "error" && `⚠️ ${error}`}
      </Text>

      <ScrollView ref={scrollRef} style={styles.transcript} contentContainerStyle={{ padding: 12, gap: 8 }}>
        {turns.map((t, i) => (
          <View key={i} style={{ alignItems: t.role === "you" ? "flex-end" : "flex-start" }}>
            <View style={[styles.bubble, t.role === "you" ? styles.you : styles.tillu]}>
              <Text style={styles.bubbleLabel}>{t.role === "you" ? "Akka" : "Tillu"}</Text>
              <Text style={styles.bubbleText}>{t.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ alignItems: "center", paddingBottom: insets.bottom + 20 }}>
        {state === "error" ? (
          <Pressable onPress={end} style={styles.closeBtn}><Text style={styles.closeBtnText}>Close</Text></Pressable>
        ) : (
          <Pressable onPress={end} style={styles.endBtn}>
            <Ionicons name="call" size={26} color={C.white} style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { flex: 1, backgroundColor: C.bg, alignItems: "center" },
  close:      { alignSelf: "flex-start", padding: 12 },
  avatar:     { width: 120, height: 120, resizeMode: "contain", marginTop: 4 },
  name:       { color: C.white, fontSize: 20, fontWeight: "800", marginTop: 6 },
  status:     { color: C.sub, fontSize: 13, fontWeight: "600", marginTop: 4, textAlign: "center", paddingHorizontal: 20 },
  transcript: { flex: 1, alignSelf: "stretch", marginTop: 14, marginHorizontal: 16, borderRadius: 16, backgroundColor: "rgba(10,32,38,0.6)", borderWidth: 1, borderColor: "#1f4a52" },
  bubble:     { maxWidth: "85%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  you:        { backgroundColor: C.teal },
  tillu:      { backgroundColor: "#13343c" },
  bubbleLabel:{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "800", textTransform: "uppercase", marginBottom: 2 },
  bubbleText: { color: "#dfeeef", fontSize: 14 },
  endBtn:     { width: 62, height: 62, borderRadius: 31, backgroundColor: "#d33", alignItems: "center", justifyContent: "center" },
  closeBtn:   { backgroundColor: C.white, borderRadius: 30, paddingHorizontal: 28, paddingVertical: 12 },
  closeBtnText:{ color: "#1f2d39", fontWeight: "800" },
});
