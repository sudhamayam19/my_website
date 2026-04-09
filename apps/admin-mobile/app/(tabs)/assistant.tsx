import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
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

const colors = {
  cream: "#f7efe4",
  paper: "#fffaf3",
  sand: "#dcc6a5",
  ink: "#19313b",
  teal: "#1f6973",
  clay: "#b85c44",
  slate: "#61747d",
  white: "#ffffff",
  lightTeal: "#e8f4f5",
  lightClay: "#fdf0ec",
  green: "#2d7a4f",
};

const MODEL_URL =
  "https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_FILENAME = "gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
const MODEL_SIZE_LABEL = "3.4 GB";

// Strip <think>...</think> blocks — hide model's internal reasoning
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\n]+/, "").trim();
}

// Check if still inside a <think> block (streaming)
function isInsideThinkBlock(text: string): boolean {
  const opens = (text.match(/<think>/gi) ?? []).length;
  const closes = (text.match(/<\/think>/gi) ?? []).length;
  return opens > closes;
}

// Lazy load llama.rn
let initLlama: typeof import("llama.rn").initLlama | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  initLlama = (require("llama.rn") as typeof import("llama.rn")).initLlama;
} catch {
  initLlama = null;
}
type LlamaContext = import("llama.rn").LlamaContext;

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  actionCommentId?: string;
}

type ModelStatus = "idle" | "downloading" | "loading" | "ready" | "error";

interface SiteContext {
  dashboard: MobileDashboardResponse | null;
  pendingComments: MobileComment[];
  recentPosts: MobilePost[];
}

function buildSystemPrompt(ctx: SiteContext): string {
  const pending = ctx.pendingComments.slice(0, 3);
  const posts = ctx.recentPosts.slice(0, 3);
  const commentsText = pending.length > 0
    ? pending.map((c, i) => `${i + 1}. From "${c.author}" on "${c.postTitle ?? c.postId}": "${c.message}" [ID: ${c.id}]`).join("\n")
    : "No pending comments.";
  const postsText = posts.length > 0
    ? posts.map((p, i) => `${i + 1}. "${p.title}" (${p.category}) — ${p.excerpt} · ${p.views ?? 0} views`).join("\n")
    : "No recent posts.";
  const stats = ctx.dashboard?.stats;
  return `You are Sudha's personal AI assistant. Sudha Devarakonda is a professional RJ, Translator, and Voice Artist from Hyderabad, India with 20+ years experience.

## Website Stats
Posts: ${stats?.publishedPosts ?? "?"} published | Views: ${stats?.totalViews ?? "?"} | Pending comments: ${stats?.pendingComments ?? "?"}

## Pending Comments (need replies)
${commentsText}

## Recent Articles
${postsText}

## You can help with
- Draft comment replies (say "REPLY TO COMMENT [number]: [reply text]" to enable one-tap posting)
- Analyze articles and suggest improvements
- Recommend trending article ideas
- Write RJ scripts, podcast intros, voice-over copy
- Social media captions
- Translation (Telugu ↔ Hindi ↔ English)
- Write full blog posts in her warm storytelling style

Keep responses concise and practical. Match Sudha's warm, conversational voice.`;
}

// Animated message bubble
function MessageBubble({ msg, onPostReply, postingReply }: {
  msg: Message;
  onPostReply?: (commentId: string, replyText: string) => void;
  postingReply?: string | null;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  }, [anim]);

  const extractReplyTarget = (text: string) => {
    const match = /REPLY TO COMMENT\s+(\d+):\s*([\s\S]+)/i.exec(text);
    if (!match) return null;
    return { commentIndex: parseInt(match[1]) - 1, replyText: match[2].trim() };
  };

  const isUser = msg.role === "user";
  const reply = !isUser ? extractReplyTarget(msg.content) : null;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
      ],
    }}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {msg.imageUri && (
          <Image source={{ uri: msg.imageUri }} style={styles.attachedImage} resizeMode="cover" />
        )}
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
          {msg.content}
        </Text>
      </View>
      {reply && msg.actionCommentId && onPostReply && (
        <Pressable
          style={styles.postReplyBtn}
          disabled={postingReply === msg.actionCommentId}
          onPress={() => onPostReply(msg.actionCommentId!, reply.replyText)}
        >
          {postingReply === msg.actionCommentId
            ? <ActivityIndicator size="small" color="#fff" />
            : (<>
                <Ionicons name="send" size={13} color="#fff" />
                <Text style={styles.postReplyText}>Post this reply</Text>
              </>)}
        </Pressable>
      )}
    </Animated.View>
  );
}

// Animated typing dots
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]))
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.bubble, styles.aiBubble, { flexDirection: "row", gap: 5, paddingVertical: 14 }]}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [partialResponse, setPartialResponse] = useState("");
  const [siteCtx, setSiteCtx] = useState<SiteContext>({ dashboard: null, pendingComments: [], recentPosts: [] });
  const [postingReply, setPostingReply] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const contextRef = useRef<LlamaContext | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void checkModelExists();
    void loadSiteContext();
    return () => { contextRef.current?.release(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speech recognition listeners
  useEffect(() => {
    const startSub = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("result", (e) => {
      if (e.results?.[0]?.transcript) {
        setInput(e.results[0].transcript);
      }
    });
    const endSub = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("end", () => {
      setIsListening(false);
    });
    return () => { startSub.remove(); endSub.remove(); };
  }, []);

  const loadSiteContext = async () => {
    try {
      const [dashboard, comments, posts] = await Promise.all([fetchDashboard(), fetchComments(), fetchPosts()]);
      setSiteCtx({
        dashboard,
        pendingComments: comments.filter((c) => c.status === "pending" || c.authorType !== "admin").slice(0, 3),
        recentPosts: posts.filter((p) => p.status === "published").slice(0, 3),
      });
    } catch { /* silent */ }
  };

  const checkModelExists = async () => {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) await loadModel();
  };

  const downloadModel = async () => {
    setStatus("downloading");
    setDownloadProgress(0);
    try {
      const dl = FileSystem.createDownloadResumable(MODEL_URL, MODEL_PATH, {}, (p) => {
        setDownloadProgress(Math.round(p.totalBytesExpectedToWrite > 0 ? (p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100 : 0));
      });
      const result = await dl.downloadAsync();
      if (!result || result.status >= 400) throw new Error(`Server error ${result?.status ?? ""}`);
      await loadModel();
    } catch (e) {
      setStatus("error");
      Alert.alert("Download failed", e instanceof Error ? e.message : "Check your internet and try again.");
    }
  };

  const loadModel = async () => {
    if (!initLlama) { setStatus("error"); Alert.alert("Not supported", "On-device AI failed to load."); return; }
    setStatus("loading");
    try {
      contextRef.current = await initLlama({ model: MODEL_PATH, use_mlock: true, n_ctx: 2048, n_threads: 4, n_gpu_layers: 0 });
      setStatus("ready");
      setMessages([{ role: "assistant", content: "Namaste Sudha! 🙏 I'm ready to help — fully offline and private.\n\nTap a suggestion or type / speak your request!" }]);
    } catch { setStatus("error"); Alert.alert("Load failed", "Try restarting the app."); }
  };

  const deleteModel = () => {
    Alert.alert("Delete Model", `Free up ${MODEL_SIZE_LABEL} of storage?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
        contextRef.current?.release(); contextRef.current = null;
        setStatus("idle"); setMessages([]);
      }},
    ]);
  };

  const toggleListen = async () => {
    if (isListening) {
      await SpeechRecognition.ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } else {
      const { granted } = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) { Alert.alert("Permission needed", "Please allow microphone access."); return; }
      setIsListening(true);
      await SpeechRecognition.ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: true });
    }
  };

  const speakMessage = (text: string, index: number) => {
    if (speakingMsgId === index) {
      Speech.stop();
      setSpeakingMsgId(null);
    } else {
      Speech.speak(text, { language: "en-IN", onDone: () => setSpeakingMsgId(null), onError: () => setSpeakingMsgId(null) });
      setSpeakingMsgId(index);
    }
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed", "Please allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
    }
  };

  const extractReplyTarget = (text: string) => {
    const match = /REPLY TO COMMENT\s+(\d+):\s*([\s\S]+)/i.exec(text);
    if (!match) return null;
    return { commentIndex: parseInt(match[1]) - 1, replyText: match[2].trim() };
  };

  const postReply = async (commentId: string, replyText: string) => {
    const comment = siteCtx.pendingComments.find((c) => c.id === commentId);
    if (!comment) return;
    setPostingReply(commentId);
    try {
      await replyToComment(commentId, comment.postId, replyText);
      setMessages((prev) => [...prev, { role: "assistant", content: "✅ Reply posted successfully!" }]);
      void loadSiteContext();
    } catch { Alert.alert("Failed to post", "Please try again."); }
    finally { setPostingReply(null); }
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || generating || !contextRef.current) return;

    const userMsg: Message = { role: "user", content: text, imageUri: pendingImage ?? undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setGenerating(true);
    setIsThinking(false);
    setPartialResponse("");

    try {
      let full = "";
      await contextRef.current.completion(
        {
          messages: [
            { role: "system" as const, content: buildSystemPrompt(siteCtx) },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          n_predict: 400,
          temperature: 0.7,
          top_p: 0.9,
          stop: ["<end_of_turn>", "<eos>"],
        },
        (data) => {
          if (data.token) {
            full += data.token;
            setIsThinking(isInsideThinkBlock(full));
            setPartialResponse(stripThinking(full));
          }
        }
      );

      const cleaned = stripThinking(full);
      const reply = extractReplyTarget(cleaned);
      const commentId = reply ? siteCtx.pendingComments[reply.commentIndex]?.id : undefined;
      setMessages((prev) => [...prev, { role: "assistant", content: cleaned, actionCommentId: commentId }]);
      setPartialResponse("");
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setGenerating(false);
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, messages, generating, siteCtx, pendingImage]);

  // ── Download screen ─────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>🤖</Text>
        <Text style={styles.title}>Personal AI Assistant</Text>
        <Text style={styles.subtitle}>Gemma 4 E2B — runs 100% on your phone.{"\n"}No internet. No tracking. Free forever.</Text>
        {siteCtx.dashboard && (
          <View style={styles.ctxCard}>
            <Text style={styles.ctxTitle}>Your Website</Text>
            <Text style={styles.ctxItem}>📝 {siteCtx.dashboard.stats.publishedPosts} published posts</Text>
            <Text style={styles.ctxItem}>💬 {siteCtx.dashboard.stats.pendingComments} pending comments</Text>
            <Text style={styles.ctxItem}>👁️ {siteCtx.dashboard.stats.totalViews} total views</Text>
          </View>
        )}
        <View style={styles.specRow}>
          {[MODEL_SIZE_LABEL, "Offline", "Private", "Free"].map((s) => (
            <View key={s} style={styles.specChip}><Text style={styles.specText}>{s}</Text></View>
          ))}
        </View>
        <Pressable style={styles.primaryBtn} onPress={downloadModel}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Download Model</Text>
        </Pressable>
        <Text style={styles.hint}>Download once, use forever</Text>
      </View>
    );
  }

  if (status === "downloading") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>⬇️</Text>
        <Text style={styles.title}>Downloading Gemma 4 E2B</Text>
        <Text style={styles.subtitle}>Stay on WiFi · {MODEL_SIZE_LABEL}</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${downloadProgress}%` }]} /></View>
        <Text style={styles.progressText}>{downloadProgress}%</Text>
      </View>
    );
  }

  if (status === "loading") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Loading model into memory…</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>⚠️</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Pressable style={styles.primaryBtn} onPress={downloadModel}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const SMART_PROMPTS = [
    siteCtx.pendingComments.length > 0 ? `Draft replies for my ${siteCtx.pendingComments.length} pending comments` : "Write a blog post idea",
    "Analyze my last 3 articles and suggest improvements",
    "Recommend 3 trending article ideas for my audience",
    "Write an RJ script intro for today",
    "Write an Instagram caption for my latest post",
    "Translate this to Telugu",
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Text style={{ fontSize: 18 }}>🤖</Text></View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Gemma 4 · On-device · Private</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable onPress={() => void loadSiteContext()} hitSlop={12}>
            <Ionicons name="refresh-outline" size={20} color={colors.teal} />
          </Pressable>
          <Pressable onPress={deleteModel} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={colors.slate} />
          </Pressable>
        </View>
      </View>

      {/* Pending comments banner */}
      {siteCtx.pendingComments.length > 0 && messages.length <= 1 && (
        <Pressable style={styles.banner} onPress={() => void sendMessage(`Draft replies for my ${siteCtx.pendingComments.length} pending comments`)}>
          <Ionicons name="chatbubble-ellipses" size={14} color={colors.clay} />
          <Text style={styles.bannerText}>{siteCtx.pendingComments.length} comment(s) waiting for reply</Text>
          <Text style={styles.bannerAction}>Draft now →</Text>
        </Pressable>
      )}

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((msg, i) => (
          <View key={i}>
            <MessageBubble msg={msg} onPostReply={postReply} postingReply={postingReply} />
            {msg.role === "assistant" && (
              <Pressable style={styles.speakBtn} onPress={() => speakMessage(msg.content, i)} hitSlop={8}>
                <Ionicons name={speakingMsgId === i ? "stop-circle-outline" : "volume-medium-outline"} size={15} color={colors.slate} />
                <Text style={styles.speakText}>{speakingMsgId === i ? "Stop" : "Listen"}</Text>
              </Pressable>
            )}
          </View>
        ))}

        {generating && isThinking && (
          <View style={[styles.bubble, styles.aiBubble, { flexDirection: "row", gap: 6 }]}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={[styles.bubbleText, { color: colors.slate, fontStyle: "italic" }]}>Thinking…</Text>
          </View>
        )}
        {generating && !isThinking && partialResponse.length > 0 && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={[styles.bubbleText, styles.aiText]}>{partialResponse}</Text>
          </View>
        )}
        {generating && !isThinking && partialResponse.length === 0 && <TypingDots />}
      </ScrollView>

      {/* Smart prompt chips */}
      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {SMART_PROMPTS.map((q) => (
            <Pressable key={q} style={styles.quickChip} onPress={() => void sendMessage(q)}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Pending image preview */}
      {pendingImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: pendingImage }} style={styles.imageThumb} resizeMode="cover" />
          <Pressable onPress={() => setPendingImage(null)} style={styles.removeImage}>
            <Ionicons name="close-circle" size={20} color={colors.clay} />
          </Pressable>
          <Text style={styles.imageNote}>Image attached (as context)</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Attachment */}
        <Pressable onPress={pickImage} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="attach-outline" size={22} color={pendingImage ? colors.teal : colors.slate} />
        </Pressable>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={isListening ? "Listening…" : "Ask your assistant…"}
          placeholderTextColor={isListening ? colors.teal : colors.slate}
          multiline
          maxLength={1000}
          editable={!generating}
        />

        {/* Mic */}
        <Pressable onPress={() => void toggleListen()} style={[styles.iconBtn, isListening && styles.iconBtnActive]} hitSlop={8}>
          <Ionicons name={isListening ? "mic" : "mic-outline"} size={22} color={isListening ? colors.white : colors.slate} />
        </Pressable>

        {/* Send */}
        <Pressable
          style={[styles.sendBtn, (!input.trim() || generating) && styles.sendBtnDisabled]}
          onPress={() => void sendMessage()}
          disabled={!input.trim() || generating}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", padding: 32 },
  modelIcon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.slate, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  ctxCard: { backgroundColor: colors.lightTeal, borderRadius: 16, padding: 14, width: "100%", marginBottom: 20, gap: 4 },
  ctxTitle: { fontSize: 12, fontWeight: "800", color: colors.teal, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  ctxItem: { fontSize: 13, color: colors.ink },
  specRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 },
  specChip: { backgroundColor: colors.lightTeal, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  specText: { fontSize: 12, fontWeight: "700", color: colors.teal },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.teal, borderRadius: 50, paddingHorizontal: 28, paddingVertical: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hint: { marginTop: 12, fontSize: 12, color: colors.slate },
  progressBar: { width: "100%", height: 8, backgroundColor: colors.sand, borderRadius: 8, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: colors.teal, borderRadius: 8 },
  progressText: { fontSize: 16, fontWeight: "700", color: colors.teal },
  header: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.sand, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lightTeal, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  headerSub: { fontSize: 11, color: colors.teal, fontWeight: "600" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.lightClay, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0d8d0" },
  bannerText: { flex: 1, fontSize: 12, color: colors.clay, fontWeight: "600" },
  bannerAction: { fontSize: 12, color: colors.clay, fontWeight: "800" },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  bubble: { maxWidth: "82%", borderRadius: 18, padding: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.sand },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: "#fff" },
  aiText: { color: colors.ink },
  attachedImage: { width: "100%", height: 140, borderRadius: 10, marginBottom: 8 },
  postReplyBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.clay, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4, marginLeft: 4 },
  postReplyText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 2, marginLeft: 6, marginBottom: 4 },
  speakText: { fontSize: 11, color: colors.slate },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sand },
  quickRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickChip: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.sand, paddingHorizontal: 14, paddingVertical: 8 },
  quickText: { fontSize: 12, color: colors.teal, fontWeight: "600" },
  imagePreview: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.sand },
  imageThumb: { width: 44, height: 44, borderRadius: 8 },
  removeImage: { position: "absolute", top: 4, left: 46 },
  imageNote: { flex: 1, fontSize: 12, color: colors.slate },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.sand, backgroundColor: colors.paper },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  iconBtnActive: { backgroundColor: colors.teal },
  input: { flex: 1, backgroundColor: colors.cream, borderRadius: 22, borderWidth: 1, borderColor: colors.sand, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.ink, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: colors.sand },
});
