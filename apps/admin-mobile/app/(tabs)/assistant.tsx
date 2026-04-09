import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as KeepAwake from "expo-keep-awake";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as SpeechRecognition from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchComments,
  fetchDashboard,
  fetchPosts,
  MobileComment,
  MobileDashboardResponse,
  MobilePost,
  replyToComment,
} from "../../lib/mobile-api";

const C = {
  paper:     "#fffaf3",
  cream:     "#f7efe4",
  sand:      "#dcc6a5",
  sandLight: "#ede3d4",
  ink:       "#19313b",
  teal:      "#1f6973",
  tealDark:  "#185860",
  tealLight: "#e8f4f5",
  clay:      "#b85c44",
  clayLight: "#fdf0ec",
  slate:     "#61747d",
  slateLight:"#8fa3ad",
  white:     "#ffffff",
};

const MODEL_URL      = "https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_FILENAME = "gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_PATH     = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
const MODEL_SIZE     = "3.4 GB";

// ── helpers ─────────────────────────────────────────────────────────────────
// Gemma 4 wraps thinking in <|channel|>thought ... <|channel|>
// Some models use <think>...</think> — handle both.
function stripThinking(text: string) {
  let cleaned = text
    .replace(/<\|channel\|>thought[\s\S]*?<\|channel\|>/gi, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "");

  if (/final output generation/i.test(cleaned)) {
    cleaned = cleaned.replace(/^[\s\S]*?final output generation[^A-Za-z0-9]*/i, "");
  }
  if (/<\|channel\|>final/i.test(cleaned)) {
    cleaned = cleaned.replace(/^[\s\S]*?<\|channel\|>final\s*/i, "");
  }
  cleaned = cleaned.replace(/<\|channel\|>\w+/gi, "");
  cleaned = cleaned.replace(/^thinking process:\s*/i, "");

  return cleaned.replace(/^\s+/, "").trim();
}
function isInsideThink(text: string) {
  // Gemma-style: opened by <|channel|>thought, closed by next <|channel|>
  const gemmaOpen  = (text.match(/<\|channel\|>thought/gi) ?? []).length;
  const gemmaClose = (text.match(/<\|channel\|>/gi) ?? []).length - gemmaOpen;
  if (gemmaOpen > 0) return gemmaClose < gemmaOpen;
  // Classic <think> style
  return (text.match(/<think>/gi) ?? []).length > (text.match(/<\/think>/gi) ?? []).length;
}

// ── background notification (keeps Android from killing the process) ─────────
const NOTIF_ID = "ai-inference";
const DONE_NOTIF_ID = "ai-done";
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});
async function showInferenceNotif() {
  await Notifications.requestPermissionsAsync();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID,
    content: { title: "AI Assistant", body: "Generating response… You can switch apps.", sticky: true } as Notifications.NotificationContentInput,
    trigger: null,
  });
}
async function hideInferenceNotif(done = false) {
  await Notifications.dismissNotificationAsync(NOTIF_ID);
  if (done) {
    await Notifications.scheduleNotificationAsync({
      identifier: DONE_NOTIF_ID,
      content: { title: "AI Assistant", body: "Your response is ready! Tap to view." },
      trigger: null,
    });
  }
}

// ── llama.rn lazy load ───────────────────────────────────────────────────────
let initLlama: typeof import("llama.rn").initLlama | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  initLlama = (require("llama.rn") as typeof import("llama.rn")).initLlama;
} catch { initLlama = null; }
type LlamaCtx = import("llama.rn").LlamaContext;

// ── types ────────────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant"; content: string; imageUri?: string; commentId?: string; }
interface SiteCtx { dashboard: MobileDashboardResponse | null; pending: MobileComment[]; posts: MobilePost[]; }
type Status = "idle" | "downloading" | "loading" | "ready" | "error";

function buildPrompt(ctx: SiteCtx) {
  const c = ctx.pending.slice(0, 3).map((c, i) =>
    `${i + 1}. "${c.author}" on "${c.postTitle ?? c.postId}": "${c.message}" [ID:${c.id}]`).join("\n") || "None.";
  const p = ctx.posts.slice(0, 3).map((p, i) =>
    `${i + 1}. "${p.title}" (${p.category}) — ${p.views ?? 0} views`).join("\n") || "None.";
  const s = ctx.dashboard?.stats;
  return `You are Sudha's personal AI assistant. Sudha Devarakonda is a professional RJ, Translator, and Voice Artist from Hyderabad, India.

Stats: ${s?.publishedPosts ?? "?"} posts · ${s?.totalViews ?? "?"} views · ${s?.pendingComments ?? "?"} pending comments

Pending comments:
${c}

Recent articles:
${p}

Help with: comment replies, blog posts, RJ scripts, translations (Telugu/Hindi/English), social captions, article ideas.
When drafting a reply write: "REPLY TO COMMENT [number]: [reply text]"
Be concise and warm. Match Sudha's conversational storytelling voice.
Never reveal chain-of-thought, analysis, thinking process, scratchpad, tool output, or channel tags.
Respond with only the final answer for the user.`;
}

// ── animated dots ────────────────────────────────────────────────────────────
function ThinkingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loops = dots.map((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 140),
      Animated.timing(d, { toValue: -7, duration: 280, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0,  duration: 280, useNativeDriver: true }),
      Animated.delay(420),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[S.bubble, S.aiBubble, { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16, paddingHorizontal: 18 }]}>
      {dots.map((d, i) => <Animated.View key={i} style={[S.dot, { transform: [{ translateY: d }] }]} />)}
    </View>
  );
}

// ── bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg, index, onPost, posting, onSpeak, speaking }: {
  msg: Msg; index: number;
  onPost?: (id: string, text: string) => void;
  posting?: string | null;
  onSpeak: (text: string, i: number) => void;
  speaking: number | null;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }).start();
  }, [anim]);

  const isUser = msg.role === "user";
  const replyMatch = !isUser ? /REPLY TO COMMENT\s+(\d+):\s*([\s\S]+)/i.exec(msg.content) : null;
  const replyText  = replyMatch?.[2]?.trim();

  return (
    <Animated.View style={{ opacity: anim, transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ], alignItems: isUser ? "flex-end" : "flex-start" }}>
      <View style={[S.bubble, isUser ? S.userBubble : S.aiBubble]}>
        {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={S.attachImg} resizeMode="cover" />}
        <Text style={[S.bubbleText, isUser ? S.userText : S.aiText]}>{msg.content}</Text>
      </View>

      {!isUser && (
        <View style={S.bubbleActions}>
          <Pressable style={S.actionBtn} onPress={() => onSpeak(msg.content, index)} hitSlop={10}>
            <Ionicons name={speaking === index ? "stop-circle-outline" : "volume-medium-outline"} size={14} color={C.slate} />
            <Text style={S.actionText}>{speaking === index ? "Stop" : "Listen"}</Text>
          </Pressable>
          {msg.commentId && replyText && onPost && (
            <Pressable
              style={[S.actionBtn, S.postBtn]}
              onPress={() => onPost(msg.commentId!, replyText)}
              disabled={posting === msg.commentId}
            >
              {posting === msg.commentId
                ? <ActivityIndicator size="small" color="#fff" />
                : (<><Ionicons name="send" size={13} color="#fff" /><Text style={[S.actionText, { color: "#fff" }]}>Post reply</Text></>)
              }
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const [status,   setStatus]   = useState<Status>("idle");
  const [dlPct,    setDlPct]    = useState(0);
  const [msgs,     setMsgs]     = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [running,  setRunning]  = useState(false);
  const [thinking, setThinking] = useState(false);
  const [partial,  setPartial]  = useState("");
  const [posting,  setPosting]  = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [listening,setListening]= useState(false);
  const [imgUri,   setImgUri]   = useState<string | null>(null);
  const [siteCtx,  setSiteCtx]  = useState<SiteCtx>({ dashboard: null, pending: [], posts: [] });
  const llamaRef  = useRef<LlamaCtx | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void checkModel();
    void loadCtx();
    const s1 = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("result", (e) => {
      if (e.results?.[0]?.transcript) setInput(e.results[0].transcript);
    });
    const s2 = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("end", () => setListening(false));
    return () => { s1.remove(); s2.remove(); llamaRef.current?.release(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCtx = async () => {
    try {
      const [db, comments, posts] = await Promise.all([fetchDashboard(), fetchComments(), fetchPosts()]);
      setSiteCtx({
        dashboard: db,
        pending: comments.filter((c) => c.status === "pending").slice(0, 3),
        posts:   posts.filter((p) => p.status === "published").slice(0, 3),
      });
    } catch { /* silent */ }
  };

  const checkModel = async () => {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) await loadModel();
  };

  const download = async () => {
    setStatus("downloading"); setDlPct(0);
    try {
      const dl = FileSystem.createDownloadResumable(MODEL_URL, MODEL_PATH, {}, (p) =>
        setDlPct(Math.round(p.totalBytesExpectedToWrite > 0 ? (p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100 : 0)));
      const res = await dl.downloadAsync();
      if (!res || res.status >= 400) throw new Error(`Server error ${res?.status ?? ""}`);
      await loadModel();
    } catch (e) { setStatus("error"); Alert.alert("Download failed", e instanceof Error ? e.message : "Try again."); }
  };

  const loadModel = async () => {
    if (!initLlama) { setStatus("error"); Alert.alert("Not supported", "On-device AI failed to load."); return; }
    setStatus("loading");
    try {
      llamaRef.current = await initLlama({ model: MODEL_PATH, use_mlock: true, n_ctx: 2048, n_threads: 4, n_gpu_layers: 0 });
      setStatus("ready");
      setMsgs([{ role: "assistant", content: "Namaste Sudha! 🙏 Ready to help — fully offline and private.\n\nTap a suggestion or speak your request!" }]);
    } catch { setStatus("error"); Alert.alert("Load failed", "Restart the app and try again."); }
  };

  const stopGeneration = async () => {
    await llamaRef.current?.stopCompletion();
    void hideInferenceNotif(false);
    setRunning(false);
    setThinking(false);
  };

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || running || !llamaRef.current) return;
    const userMsg: Msg = { role: "user", content: text, imageUri: imgUri ?? undefined };
    const next = [...msgs, userMsg];
    setMsgs(next); setInput(""); setImgUri(null);
    setRunning(true); setThinking(false); setPartial("");
    KeepAwake.activateKeepAwakeAsync("ai-inference");
    void showInferenceNotif();
    let full = "";
    try {
      await llamaRef.current.completion(
        { messages: [{ role: "system" as const, content: buildPrompt(siteCtx) }, ...next.map((m) => ({ role: m.role, content: m.content }))],
          n_predict: 400,
          temperature: 0.45,
          top_p: 0.9,
          stop: ["<end_of_turn>", "<eos>", "<think>", "<|channel|>thought", "Thinking Process:"] },
        (data) => {
          if (data.token) {
            full += data.token;
            setThinking(isInsideThink(full));
            setPartial(stripThinking(full));
          }
        }
      );
      const clean = stripThinking(full);
      const finalText =
        clean ||
        (/^(hi|hello|hey)\b/i.test(text)
          ? "Hello there! How can I assist you today? Whether you need help with a script, a translation, or an idea, just let me know."
          : "I am here to help. Please ask again in one short sentence.");
      const rMatch = /REPLY TO COMMENT\s+(\d+):/i.exec(clean);
      const commentId = rMatch ? siteCtx.pending[parseInt(rMatch[1]) - 1]?.id : undefined;
      setMsgs((prev) => [...prev, { role: "assistant", content: finalText, commentId }]);
      setPartial("");
    } catch {
      // stopCompletion throws — that's expected, just show what was generated
      const clean = stripThinking(full);
      if (clean.length > 0) {
        setMsgs((prev) => [...prev, { role: "assistant", content: clean }]);
      }
      setPartial("");
    } finally {
      setRunning(false); setThinking(false);
      KeepAwake.deactivateKeepAwake("ai-inference");
      void hideInferenceNotif(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, msgs, running, siteCtx, imgUri]);

  const postReply = async (commentId: string, replyText: string) => {
    const comment = siteCtx.pending.find((c) => c.id === commentId);
    if (!comment) return;
    setPosting(commentId);
    try {
      await replyToComment(commentId, comment.postId, replyText);
      setMsgs((p) => [...p, { role: "assistant", content: "✅ Reply posted!" }]);
      void loadCtx();
    } catch { Alert.alert("Failed", "Could not post reply. Try again."); }
    finally { setPosting(null); }
  };

  const toggleListen = async () => {
    if (listening) {
      await SpeechRecognition.ExpoSpeechRecognitionModule.stop();
      setListening(false);
    } else {
      const { granted } = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) { Alert.alert("Permission needed", "Please allow microphone access."); return; }
      setListening(true);
      await SpeechRecognition.ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: true });
    }
  };

  const speakMsg = (text: string, i: number) => {
    if (speaking === i) { Speech.stop(); setSpeaking(null); }
    else { Speech.speak(text, { language: "en-IN", onDone: () => setSpeaking(null), onError: () => setSpeaking(null) }); setSpeaking(i); }
  };

  const pickImg = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed"); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled) setImgUri(res.assets[0].uri);
  };

  const deleteModel = () => Alert.alert("Delete Model", `Free up ${MODEL_SIZE}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
      llamaRef.current?.release(); llamaRef.current = null;
      setStatus("idle"); setMsgs([]);
    }},
  ]);

  // ── screens ──────────────────────────────────────────────────────────────
  if (status === "idle") return (
    <View style={[S.center, { paddingTop: insets.top + 16 }]}>
      <Text style={S.icon}>🤖</Text>
      <Text style={S.title}>Personal AI Assistant</Text>
      <Text style={S.sub}>Gemma 4 E2B — runs 100% on your phone.{"\n"}No internet. No tracking. Free forever.</Text>
      {siteCtx.dashboard && (
        <View style={S.ctxCard}>
          <Text style={S.ctxTitle}>Your Website</Text>
          <Text style={S.ctxRow}>📝  {siteCtx.dashboard.stats.publishedPosts} published posts</Text>
          <Text style={S.ctxRow}>💬  {siteCtx.dashboard.stats.pendingComments} pending comments</Text>
          <Text style={S.ctxRow}>👁️  {siteCtx.dashboard.stats.totalViews} total views</Text>
        </View>
      )}
      <View style={S.chips}>
        {[MODEL_SIZE, "Offline", "Private", "Free"].map((s) => (
          <View key={s} style={S.chip}><Text style={S.chipText}>{s}</Text></View>
        ))}
      </View>
      <Pressable style={S.primaryBtn} onPress={download}>
        <Ionicons name="download-outline" size={18} color="#fff" />
        <Text style={S.primaryBtnText}>Download Model</Text>
      </Pressable>
      <Text style={S.hint}>One-time download · works forever offline</Text>
    </View>
  );

  if (status === "downloading") return (
    <View style={[S.center, { paddingTop: insets.top + 16 }]}>
      <Text style={S.icon}>⬇️</Text>
      <Text style={S.title}>Downloading Gemma 4 E2B</Text>
      <Text style={S.sub}>Keep WiFi on · {MODEL_SIZE}</Text>
      <View style={S.barWrap}><View style={[S.barFill, { width: `${dlPct}%` }]} /></View>
      <Text style={S.pct}>{dlPct}%</Text>
    </View>
  );

  if (status === "loading") return (
    <View style={[S.center, { paddingTop: insets.top + 16 }]}>
      <ActivityIndicator size="large" color={C.teal} />
      <Text style={[S.sub, { marginTop: 16 }]}>Loading model into memory…</Text>
    </View>
  );

  if (status === "error") return (
    <View style={[S.center, { paddingTop: insets.top + 16 }]}>
      <Text style={S.icon}>⚠️</Text>
      <Text style={S.title}>Something went wrong</Text>
      <Pressable style={S.primaryBtn} onPress={download}>
        <Text style={S.primaryBtnText}>Try Again</Text>
      </Pressable>
    </View>
  );

  const PROMPTS = [
    siteCtx.pending.length > 0 ? `Draft replies for my ${siteCtx.pending.length} pending comments` : "Write a blog post idea",
    "Analyze my last 3 articles and suggest improvements",
    "Recommend 3 trending article ideas for my audience",
    "Write an RJ script intro for today",
    "Write an Instagram caption for my latest post",
    "Translate this to Telugu",
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.paper }} behavior={Platform.OS === "ios" ? "padding" : "height"}>

      {/* ── header ── */}
      <View style={[S.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={S.avatar}><Text style={{ fontSize: 20 }}>🤖</Text></View>
          <View>
            <Text style={S.hTitle}>AI Assistant</Text>
            <Text style={S.hSub}>Gemma 4 · On-device · Private</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          <Pressable onPress={() => void loadCtx()} hitSlop={12}>
            <Ionicons name="refresh-outline" size={20} color={C.teal} />
          </Pressable>
          <Pressable onPress={deleteModel} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={C.slateLight} />
          </Pressable>
        </View>
      </View>

      {/* ── pending banner ── */}
      {siteCtx.pending.length > 0 && msgs.length <= 1 && (
        <Pressable style={S.banner} onPress={() => void send(`Draft replies for my ${siteCtx.pending.length} pending comments`)}>
          <Ionicons name="chatbubble-ellipses" size={14} color={C.clay} />
          <Text style={S.bannerText}>{siteCtx.pending.length} comment(s) awaiting reply</Text>
          <Text style={S.bannerCta}>Draft now →</Text>
        </Pressable>
      )}

      {/* ── messages ── */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={S.msgList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {msgs.map((m, i) => (
          <Bubble key={i} msg={m} index={i} onPost={postReply} posting={posting} onSpeak={speakMsg} speaking={speaking} />
        ))}
        {running && thinking && (
          <View style={[S.aiBubble, S.bubble, { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 }]}>
            <ActivityIndicator size="small" color={C.teal} />
            <Text style={{ fontSize: 13, color: C.slateLight, fontStyle: "italic" }}>Thinking…</Text>
          </View>
        )}
        {running && !thinking && partial.length > 0 && (
          <View style={[S.bubble, S.aiBubble]}>
            <Text style={[S.bubbleText, S.aiText]}>{partial}</Text>
          </View>
        )}
        {running && !thinking && partial.length === 0 && <ThinkingDots />}
      </ScrollView>

      {/* ── quick prompts ── */}
      {msgs.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.promptRow}>
          {PROMPTS.map((q) => (
            <Pressable key={q} style={S.promptChip} onPress={() => void send(q)}>
              <Text style={S.promptText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── image preview ── */}
      {imgUri && (
        <View style={S.imgPreview}>
          <Image source={{ uri: imgUri }} style={S.imgThumb} resizeMode="cover" />
          <Text style={S.imgNote}>Image attached</Text>
          <Pressable onPress={() => setImgUri(null)} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={C.clay} />
          </Pressable>
        </View>
      )}

      {/* ── input bar ── */}
      <View style={[S.inputBar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
        <Pressable onPress={pickImg} style={S.iconBtn} hitSlop={8}>
          <Ionicons name="attach-outline" size={22} color={imgUri ? C.teal : C.slateLight} />
        </Pressable>

        <TextInput
          style={S.input}
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Listening…" : "Ask anything…"}
          placeholderTextColor={listening ? C.teal : C.slateLight}
          multiline
          maxLength={1000}
          editable={!running}
        />

        <Pressable onPress={() => void toggleListen()} style={[S.iconBtn, listening && S.iconActive]} hitSlop={8}>
          <Ionicons name={listening ? "mic" : "mic-outline"} size={22} color={listening ? C.white : C.slateLight} />
        </Pressable>

        {running ? (
          <Pressable style={[S.sendBtn, { backgroundColor: C.clay }]} onPress={() => void stopGeneration()}>
            <Ionicons name="stop" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[S.sendBtn, !input.trim() && S.sendOff]}
            onPress={() => void send()}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  center:      { flex: 1, backgroundColor: C.paper, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  icon:        { fontSize: 60, marginBottom: 18 },
  title:       { fontSize: 22, fontWeight: "800", color: C.ink, textAlign: "center", marginBottom: 10 },
  sub:         { fontSize: 14, color: C.slate, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  ctxCard:     { width: "100%", backgroundColor: C.tealLight, borderRadius: 16, padding: 16, marginBottom: 24, gap: 6 },
  ctxTitle:    { fontSize: 11, fontWeight: "800", color: C.teal, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  ctxRow:      { fontSize: 13, color: C.ink },
  chips:       { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 },
  chip:        { backgroundColor: C.tealLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipText:    { fontSize: 12, fontWeight: "700", color: C.teal },
  primaryBtn:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.teal, borderRadius: 50, paddingHorizontal: 30, paddingVertical: 15 },
  primaryBtnText: { color: C.white, fontWeight: "800", fontSize: 15 },
  hint:        { marginTop: 14, fontSize: 12, color: C.slateLight, textAlign: "center" },
  barWrap:     { width: "100%", height: 8, backgroundColor: C.sand, borderRadius: 8, overflow: "hidden", marginBottom: 10 },
  barFill:     { height: "100%", backgroundColor: C.teal, borderRadius: 8 },
  pct:         { fontSize: 18, fontWeight: "800", color: C.teal },
  header:      { backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.sandLight, paddingHorizontal: 18, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar:      { width: 42, height: 42, borderRadius: 21, backgroundColor: C.tealLight, alignItems: "center", justifyContent: "center" },
  hTitle:      { fontSize: 16, fontWeight: "800", color: C.ink },
  hSub:        { fontSize: 11, color: C.teal, fontWeight: "600", marginTop: 1 },
  banner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.clayLight, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f0d5cc" },
  bannerText:  { flex: 1, fontSize: 12, color: C.clay, fontWeight: "600" },
  bannerCta:   { fontSize: 12, color: C.clay, fontWeight: "800" },
  msgList:     { padding: 16, gap: 14, paddingBottom: 12 },
  bubble:      { maxWidth: "82%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble:  { alignSelf: "flex-end", backgroundColor: C.teal, borderBottomRightRadius: 5 },
  aiBubble:    { alignSelf: "flex-start", backgroundColor: C.white, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: C.sandLight },
  bubbleText:  { fontSize: 14, lineHeight: 22 },
  userText:    { color: C.white },
  aiText:      { color: C.ink },
  attachImg:   { width: "100%", height: 130, borderRadius: 10, marginBottom: 8 },
  bubbleActions: { flexDirection: "row", gap: 8, marginTop: 5, marginLeft: 4, flexWrap: "wrap" },
  actionBtn:   { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: C.cream, borderWidth: 1, borderColor: C.sandLight },
  actionText:  { fontSize: 11, color: C.slate, fontWeight: "600" },
  postBtn:     { backgroundColor: C.clay, borderColor: C.clay },
  dot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: C.sandLight },
  promptRow:   { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  promptChip:  { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.sand, paddingHorizontal: 16, paddingVertical: 9 },
  promptText:  { fontSize: 12, color: C.teal, fontWeight: "600" },
  imgPreview:  { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.cream, borderTopWidth: 1, borderTopColor: C.sandLight },
  imgThumb:    { width: 44, height: 44, borderRadius: 10 },
  imgNote:     { flex: 1, fontSize: 12, color: C.slate },
  inputBar:    { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.sandLight, backgroundColor: C.paper },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconActive:  { backgroundColor: C.teal },
  input:       { flex: 1, backgroundColor: C.cream, borderRadius: 22, borderWidth: 1, borderColor: C.sand, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: C.ink, maxHeight: 120, lineHeight: 20 },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: C.teal, alignItems: "center", justifyContent: "center" },
  sendOff:     { backgroundColor: C.sand },
});
