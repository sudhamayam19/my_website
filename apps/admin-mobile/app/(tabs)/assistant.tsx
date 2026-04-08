import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { initLlama, LlamaContext } from "llama.rn";
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
};

// Gemma 4 E2B Q4_K_M — ~1.3GB, best for 12GB RAM phones
const MODEL_URL =
  "https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_FILENAME = "gemma-4-E2B-it-Q4_K_M.gguf";
const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;

const SYSTEM_PROMPT = `You are Sudha's personal AI assistant. Sudha Devarakonda is a professional RJ, Translator, and Voice Artist based in Hyderabad, India.

Help Sudha with:
- Writing and editing blog posts in her warm, storytelling style
- Drafting replies to comments on her website
- Writing RJ scripts, podcast intros, voice-over copy
- Social media captions for YouTube and Instagram
- Translation assistance (Telugu ↔ Hindi ↔ English)
- Generating post ideas based on her work

Keep responses practical, warm, and professional. When writing content, match her voice — conversational, thoughtful, and engaging.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ModelStatus = "idle" | "downloading" | "loading" | "ready" | "error";

export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [partialResponse, setPartialResponse] = useState("");
  const contextRef = useRef<LlamaContext | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkModelExists();
    return () => {
      contextRef.current?.release();
    };
  }, []);

  const checkModelExists = async () => {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    if (info.exists) {
      await loadModel();
    }
  };

  const downloadModel = async () => {
    setStatus("downloading");
    setDownloadProgress(0);
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        MODEL_PATH,
        {},
        (progress) => {
          const pct =
            progress.totalBytesExpectedToWrite > 0
              ? (progress.totalBytesWritten /
                  progress.totalBytesExpectedToWrite) *
                100
              : 0;
          setDownloadProgress(Math.round(pct));
        }
      );
      await downloadResumable.downloadAsync();
      await loadModel();
    } catch (e) {
      setStatus("error");
      Alert.alert("Download failed", "Please check your internet and try again.");
    }
  };

  const loadModel = async () => {
    setStatus("loading");
    try {
      const ctx = await initLlama({
        model: MODEL_PATH,
        use_mlock: true,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0, // CPU only for stability; set higher if GPU works
      });
      contextRef.current = ctx;
      setStatus("ready");
      setMessages([
        {
          role: "assistant",
          content:
            "Namaste Sudha! 🙏 I'm your personal AI assistant running fully on your phone — no internet needed, completely private.\n\nHow can I help you today? I can write blog posts, draft replies, create RJ scripts, or help with translations!",
        },
      ]);
    } catch (e) {
      setStatus("error");
      Alert.alert("Model load failed", "Try restarting the app.");
    }
  };

  const deleteModel = () => {
    Alert.alert("Delete Model", "This will delete the downloaded model (1.3GB). You'll need to re-download to use the assistant again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || generating || !contextRef.current) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setGenerating(true);
    setPartialResponse("");

    try {
      const chatMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...newMessages,
      ];

      let full = "";
      await contextRef.current.completion(
        {
          messages: chatMessages,
          n_predict: 512,
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

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setPartialResponse("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setGenerating(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, messages, generating]);

  // ── Render: not downloaded yet ──────────────────────────────────────────────
  if (status === "idle") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>🤖</Text>
        <Text style={styles.title}>Personal AI Assistant</Text>
        <Text style={styles.subtitle}>
          Powered by Gemma 4 E2B — runs 100% on your phone.{"\n"}
          No internet needed. No data sent anywhere. Free forever.
        </Text>
        <View style={styles.specRow}>
          {["~1.3 GB", "Offline", "Private", "Free"].map((s) => (
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

  // ── Render: downloading ─────────────────────────────────────────────────────
  if (status === "downloading") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.modelIcon}>⬇️</Text>
        <Text style={styles.title}>Downloading Gemma 4 E2B</Text>
        <Text style={styles.subtitle}>Stay on WiFi — this is ~1.3 GB</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>{downloadProgress}%</Text>
      </View>
    );
  }

  // ── Render: loading model into memory ───────────────────────────────────────
  if (status === "loading") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Loading model into memory…</Text>
      </View>
    );
  }

  // ── Render: error ───────────────────────────────────────────────────────────
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

  // ── Render: ready — chat UI ─────────────────────────────────────────────────
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
            <Text style={styles.headerSub}>Gemma 4 E2B · On-device · Private</Text>
          </View>
        </View>
        <Pressable onPress={deleteModel} hitSlop={12}>
          <Ionicons name="trash-outline" size={20} color={colors.slate} />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                msg.role === "user" ? styles.userText : styles.aiText,
              ]}
            >
              {msg.content}
            </Text>
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

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {[
            "Write a blog post idea",
            "Draft a comment reply",
            "Write an RJ script intro",
            "Translate to Telugu",
            "Instagram caption idea",
          ].map((q) => (
            <Pressable
              key={q}
              style={styles.quickChip}
              onPress={() => {
                setInput(q);
              }}
            >
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
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
          onPress={sendMessage}
          disabled={!input.trim() || generating}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modelIcon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.slate, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  specRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 },
  specChip: { backgroundColor: colors.lightTeal, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  specText: { fontSize: 12, fontWeight: "700", color: colors.teal },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.teal, borderRadius: 50,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hint: { marginTop: 12, fontSize: 12, color: colors.slate },
  progressBar: {
    width: "100%", height: 8, backgroundColor: colors.sand,
    borderRadius: 8, overflow: "hidden", marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: colors.teal, borderRadius: 8 },
  progressText: { fontSize: 16, fontWeight: "700", color: colors.teal },
  header: {
    backgroundColor: colors.paper,
    borderBottomWidth: 1, borderBottomColor: colors.sand,
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.lightTeal,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  headerSub: { fontSize: 11, color: colors.teal, fontWeight: "600" },
  messageList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: "82%", borderRadius: 18, padding: 12 },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.teal,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.sand,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: "#fff" },
  aiText: { color: colors.ink },
  quickRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickChip: {
    backgroundColor: colors.white, borderRadius: 20,
    borderWidth: 1, borderColor: colors.sand,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  quickText: { fontSize: 12, color: colors.teal, fontWeight: "600" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.sand,
    backgroundColor: colors.paper,
  },
  input: {
    flex: 1, backgroundColor: colors.cream,
    borderRadius: 22, borderWidth: 1, borderColor: colors.sand,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: colors.ink, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.teal,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.sand },
});
