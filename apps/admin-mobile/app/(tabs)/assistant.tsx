"use client";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
};

const MODEL_URL =
  "https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_FILENAME = "gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
const MODEL_SIZE_LABEL = "3.4 GB";

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
  actionCommentId?: string; // if this reply should be posted to a comment
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

  const commentsText =
    pending.length > 0
      ? pending
          .map(
            (c, i) =>
              `${i + 1}. From "${c.author}" on post "${c.postTitle ?? c.postId}": "${c.message}" [ID: ${c.id}]`
          )
          .join("\n")
      : "No pending comments.";

  const postsText =
    posts.length > 0
      ? posts
          .map(
            (p, i) =>
              `${i + 1}. "${p.title}" (${p.category}) — ${p.excerpt} · ${p.views ?? 0} views, ${p.likes ?? 0} likes`
          )
          .join("\n")
      : "No recent posts.";

  const stats = ctx.dashboard?.stats;
  const statsText = stats
    ? `Total posts: ${stats.totalPosts} | Published: ${stats.publishedPosts} | Total views: ${stats.totalViews} | Pending comments: ${stats.pendingComments}`
    : "";

  return `You are Sudha's personal AI assistant. Sudha Devarakonda is a professional RJ, Translator, and Voice Artist from Hyderabad, India with 20+ years of experience.

## Current Website Stats
${statsText}

## Last 3 Pending Comments (need attention)
${commentsText}

## Last 3 Published Articles
${postsText}

## Your Capabilities
- Draft comment replies (mention the comment number and I'll post it for you)
- Analyze articles and suggest improvements
- Recommend trending article ideas for her audience
- Write RJ scripts, podcast intros, voice-over copy
- Social media captions for YouTube/Instagram
- Translation (Telugu ↔ Hindi ↔ English)
- Write full blog posts in her warm storytelling style

## Guidelines
- Be concise and practical — Sudha is busy
- When drafting a reply to a comment, start with "REPLY TO COMMENT [number]:" so it can be posted directly
- Suggest 2-3 trending article ideas based on her categories when asked
- Keep responses under 200 words unless writing a full post
- Match her voice — warm, conversational, thoughtful`;
}

export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [partialResponse, setPartialResponse] = useState("");
  const [siteCtx, setSiteCtx] = useState<SiteContext>({
    dashboard: null,
    pendingComments: [],
    recentPosts: [],
  });
  const [postingReply, setPostingReply] = useState<string | null>(null);
  const contextRef = useRef<LlamaContext | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void checkModelExists();
    void loadSiteContext();
    return () => { contextRef.current?.release(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSiteContext = async () => {
    try {
      const [dashboard, comments, posts] = await Promise.all([
        fetchDashboard(),
        fetchComments(),
        fetchPosts(),
      ]);
      const pendingComments = comments
        .filter((c) => c.status === "pending" || c.authorType !== "admin")
        .slice(0, 3);
      const recentPosts = posts
        .filter((p) => p.status === "published")
        .slice(0, 3);
      setSiteCtx({ dashboard, pendingComments, recentPosts });
    } catch {
      // silent fail — context just won't have live data
    }
  };

  const checkModelExists = async () => {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) await loadModel();
  };

  const downloadModel = async () => {
    setStatus("downloading");
    setDownloadProgress(0);
    try {
      const dl = FileSystem.createDownloadResumable(
        MODEL_URL,
        MODEL_PATH,
        {},
        (progress) => {
          const pct =
            progress.totalBytesExpectedToWrite > 0
              ? (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100
              : 0;
          setDownloadProgress(Math.round(pct));
        }
      );
      const result = await dl.downloadAsync();
      if (!result || result.status >= 400) {
        throw new Error(result ? `Server error ${result.status}` : "Download failed");
      }
      await loadModel();
    } catch (error) {
      setStatus("error");
      Alert.alert("Download failed", error instanceof Error ? error.message : "Check your internet and try again.");
    }
  };

  const loadModel = async () => {
    if (!initLlama) {
      setStatus("error");
      Alert.alert("Not supported", "On-device AI failed to load. Please reinstall the app.");
      return;
    }
    setStatus("loading");
    try {
      const ctx = await initLlama({
        model: MODEL_PATH,
        use_mlock: true,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0,
      });
      contextRef.current = ctx;
      setStatus("ready");

      const pending = siteCtx.pendingComments.length;
      setMessages([{
        role: "assistant",
        content: `Namaste Sudha! 🙏 I'm ready to help.\n\n${pending > 0 ? `📬 You have **${pending} pending comment(s)** waiting for a reply.\n\n` : ""}Tap a suggestion below or ask me anything!`,
      }]);
    } catch {
      setStatus("error");
      Alert.alert("Load failed", "Try restarting the app.");
    }
  };

  const deleteModel = () => {
    Alert.alert("Delete Model", `This will free up ${MODEL_SIZE_LABEL} of storage.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
          contextRef.current?.release();
          contextRef.current = null;
          setStatus("idle");
          setMessages([]);
        },
      },
    ]);
  };

  // Extract comment number from AI reply like "REPLY TO COMMENT 2: ..."
  const extractReplyTarget = (text: string): { commentIndex: number; replyText: string } | null => {
    const match = /REPLY TO COMMENT\s+(\d+):\s*([\s\S]+)/i.exec(text);
    if (!match) return null;
    return { commentIndex: parseInt(match[1]) - 1, replyText: match[2].trim() };
  };

  const postReply = async (commentId: string, replyText: string) => {
    setPostingReply(commentId);
    try {
      await replyToComment(commentId, replyText);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✅ Reply posted successfully!" },
      ]);
      void loadSiteContext(); // refresh
    } catch {
      Alert.alert("Failed to post", "Could not post the reply. Please try again.");
    } finally {
      setPostingReply(null);
    }
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || generating || !contextRef.current) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setGenerating(true);
    setPartialResponse("");

    try {
      const systemPrompt = buildSystemPrompt(siteCtx);
      let full = "";
      await contextRef.current.completion(
        {
          messages: [
            { role: "system" as const, content: systemPrompt },
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
            setPartialResponse(full);
          }
        }
      );

      const reply = extractReplyTarget(full);
      const commentId = reply ? siteCtx.pendingComments[reply.commentIndex]?.id : undefined;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: full, actionCommentId: commentId },
      ]);
      setPartialResponse("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setGenerating(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, messages, generating, siteCtx]);

  // ── Download screen ─────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>🤖</Text>
        <Text style={styles.title}>Personal AI Assistant</Text>
        <Text style={styles.subtitle}>
          Powered by Gemma 4 E2B — runs 100% on your phone.{"\n"}
          No internet needed. No data sent anywhere. Free forever.
        </Text>

        {/* Live site summary */}
        {siteCtx.dashboard && (
          <View style={styles.ctxCard}>
            <Text style={styles.ctxTitle}>Your Website Today</Text>
            <Text style={styles.ctxItem}>📝 {siteCtx.dashboard.stats.publishedPosts} published posts</Text>
            <Text style={styles.ctxItem}>💬 {siteCtx.dashboard.stats.pendingComments} pending comments</Text>
            <Text style={styles.ctxItem}>👁️ {siteCtx.dashboard.stats.totalViews} total views</Text>
          </View>
        )}

        <View style={styles.specRow}>
          {[MODEL_SIZE_LABEL, "Offline", "Private", "Free"].map((s) => (
            <View key={s} style={styles.specChip}>
              <Text style={styles.specText}>{s}</Text>
            </View>
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
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
        </View>
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

  // ── Chat UI ─────────────────────────────────────────────────────────────────
  const SMART_PROMPTS = [
    siteCtx.pendingComments.length > 0
      ? `Draft replies for my ${siteCtx.pendingComments.length} pending comments`
      : "Write a blog post idea",
    `Analyze my last 3 articles and suggest improvements`,
    `Recommend 3 trending article ideas for my audience`,
    `Write an RJ script intro for today`,
    `Write an Instagram caption for my latest post`,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Gemma 4 · On-device · Private</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
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
        <View style={styles.banner}>
          <Ionicons name="chatbubble-ellipses" size={14} color={colors.clay} />
          <Text style={styles.bannerText}>
            {siteCtx.pendingComments.length} comment(s) waiting for your reply
          </Text>
          <Pressable onPress={() => void sendMessage(`Draft replies for my ${siteCtx.pendingComments.length} pending comments`)}>
            <Text style={styles.bannerAction}>Draft now →</Text>
          </Pressable>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i}>
            <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, msg.role === "user" ? styles.userText : styles.aiText]}>
                {msg.content}
              </Text>
            </View>
            {/* Post reply button if AI drafted a reply */}
            {msg.role === "assistant" && msg.actionCommentId && (
              <Pressable
                style={styles.postReplyBtn}
                disabled={postingReply === msg.actionCommentId}
                onPress={() => {
                  const reply = extractReplyTarget(msg.content);
                  if (reply && msg.actionCommentId) {
                    void postReply(msg.actionCommentId, reply.replyText);
                  }
                }}
              >
                {postingReply === msg.actionCommentId ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={13} color="#fff" />
                    <Text style={styles.postReplyText}>Post this reply</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        ))}

        {generating && partialResponse.length > 0 && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={[styles.bubbleText, styles.aiText]}>{partialResponse}</Text>
          </View>
        )}
        {generating && partialResponse.length === 0 && (
          <View style={[styles.bubble, styles.aiBubble, { flexDirection: "row", gap: 6 }]}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={[styles.bubbleText, styles.aiText]}>Thinking…</Text>
          </View>
        )}
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

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your assistant…"
          placeholderTextColor={colors.slate}
          multiline
          maxLength={1000}
          editable={!generating}
        />
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
  banner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.lightClay, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0d8d0" },
  bannerText: { flex: 1, fontSize: 12, color: colors.clay, fontWeight: "600" },
  bannerAction: { fontSize: 12, color: colors.clay, fontWeight: "800" },
  messageList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: "82%", borderRadius: 18, padding: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.sand },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: "#fff" },
  aiText: { color: colors.ink },
  postReplyBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.clay, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4, marginLeft: 4 },
  postReplyText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  quickRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickChip: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.sand, paddingHorizontal: 14, paddingVertical: 8 },
  quickText: { fontSize: 12, color: colors.teal, fontWeight: "600" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.sand, backgroundColor: colors.paper },
  input: { flex: 1, backgroundColor: colors.cream, borderRadius: 22, borderWidth: 1, borderColor: colors.sand, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.ink, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: colors.sand },
});
