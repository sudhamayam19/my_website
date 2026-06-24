import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Markdown from "react-native-markdown-display";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as SpeechRecognition from "expo-speech-recognition";
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
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GeminiMessage, sendGeminiChat } from "../../lib/mobile-api";
import {
  Todo,
  addTodo,
  deleteTodo,
  loadTodos,
  toggleTodo,
} from "../../lib/todos";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const C = {
  paper:      "#fffaf3",
  cream:      "#f7efe4",
  sand:       "#dcc6a5",
  sandLight:  "#ede3d4",
  ink:        "#19313b",
  teal:       "#1f6973",
  tealDark:   "#185860",
  tealLight:  "#e8f4f5",
  slate:      "#61747d",
  slateLight: "#8fa3ad",
  white:      "#ffffff",
  green:      "#2d7a4a",
  greenLight: "#edf7f1",
  orange:     "#c85a2a",
  orangeLight:"#fdf0e8",
};

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const HISTORY_KEY = "tillu_chat_history_v1";

function getTilluWelcome(): string {
  const hour = new Date().getHours();
  const day = new Date().toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (day === "Monday") {
    return `${greeting} Amma! 🤖✨ Tillu ikkade unna!\n\nMonday anthe — weekly content plan chesukodaniki perfect time! This week enti raayabothunnam? 📝\n\nCricket, culture, or something from the heart? Cheppandi!`;
  }
  return `${greeting} Amma! 🤖 Tillu ikkade unna — ready to help!\n\nBlog ideas, podcast topics, reminders — anni chesta. Cheppandi em kaavalo! ✨`;
}

// ── Tillu animated mascot ─────────────────────────────────────────────────────
function TilluBot({ size = 36, speaking = false }: { size?: number; speaking?: boolean }) {
  const bobY      = useSharedValue(0);
  const blinkSY   = useSharedValue(1);
  const mouthH    = useSharedValue(size * 0.07);
  const antGlow   = useSharedValue(0.5);

  // idle bob + antenna pulse (mount once)
  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-size * 0.055, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming( size * 0.055, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    antGlow.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 800 }),
        withTiming(0.3, { duration: 800 }),
      ),
      -1, true,
    );
    const t = setInterval(() => {
      blinkSY.value = withSequence(
        withTiming(0.06, { duration: 70 }),
        withTiming(1,    { duration: 120 }),
      );
    }, 2800 + Math.random() * 1600);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mouth animation driven by speaking prop
  useEffect(() => {
    if (speaking) {
      mouthH.value = withRepeat(
        withSequence(
          withTiming(size * 0.19, { duration: 190 }),
          withTiming(size * 0.06, { duration: 190 }),
        ),
        -1, true,
      );
    } else {
      cancelAnimation(mouthH);
      mouthH.value = withTiming(size * 0.07, { duration: 130 });
    }
  }, [speaking, size, mouthH]);

  const bobStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: bobY.value }] }));
  const blinkStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blinkSY.value }] }));
  const mouthStyle = useAnimatedStyle(() => ({ height: mouthH.value }));
  const antStyle   = useAnimatedStyle(() => ({ opacity: antGlow.value }));

  const head   = size * 0.70;
  const eye    = size * 0.16;
  const pupil  = size * 0.075;
  const mouth  = size * 0.34;
  const antB   = Math.max(size * 0.10, 3);
  const antS   = size * 0.13;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Antenna */}
      <View style={{ position: "absolute", top: 0, alignItems: "center" }}>
        <Animated.View style={[antStyle, {
          width: antB, height: antB, borderRadius: antB / 2,
          backgroundColor: "#f5c34a",
          shadowColor: "#f5c34a", shadowOpacity: 0.9, shadowRadius: 4,
        }]} />
        <View style={{ width: 2, height: antS, backgroundColor: "rgba(255,255,255,0.45)" }} />
      </View>

      {/* Head */}
      <Animated.View style={[bobStyle, {
        width: head, height: head,
        borderRadius: head * 0.28,
        backgroundColor: C.teal,
        alignItems: "center", justifyContent: "center",
        shadowColor: C.teal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.38, shadowRadius: 7,
        elevation: 5,
      }]}>
        {/* Inner faceplate */}
        <View style={{
          width: head * 0.78, height: head * 0.72,
          borderRadius: head * 0.18,
          backgroundColor: "rgba(255,255,255,0.11)",
          alignItems: "center", justifyContent: "center",
        }}>
          {/* Eyes */}
          <View style={{ flexDirection: "row", gap: eye * 0.65, marginBottom: eye * 0.35 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{
                width: eye, height: eye, borderRadius: eye / 2,
                backgroundColor: "white",
                alignItems: "center", justifyContent: "center",
              }}>
                <Animated.View style={[blinkStyle, {
                  width: pupil, height: pupil, borderRadius: pupil / 2,
                  backgroundColor: "#0c2830",
                }]} />
              </View>
            ))}
          </View>

          {/* Mouth */}
          <Animated.View style={[mouthStyle, {
            width: mouth, borderRadius: size * 0.04,
            backgroundColor: "rgba(255,255,255,0.62)",
          }]} />
        </View>

        {/* Tiny circuit dots bottom-left */}
        {size >= 30 && (
          <View style={{
            position: "absolute", bottom: head * 0.1, left: head * 0.1,
            flexDirection: "row", gap: 3,
          }}>
            {[1, 0.5, 0.8].map((o, i) => (
              <View key={i} style={{
                width: Math.max(size * 0.05, 3), height: Math.max(size * 0.05, 3),
                borderRadius: size * 0.025,
                backgroundColor: `rgba(255,255,255,${o * 0.28})`,
              }} />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Animated thinking dots ────────────────────────────────────────────────────
function ThinkingDots() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <TilluBot size={28} speaking />
      <View style={[S.bubble, S.aiBubble, { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 14 }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[S.dot, frame > i && { backgroundColor: C.teal }]} />
        ))}
      </View>
    </View>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg, index, onSpeak, speaking }: {
  msg: Msg; index: number;
  onSpeak: (text: string, i: number) => void;
  speaking: number | null;
}) {
  const isUser = msg.role === "user";
  return (
    <View style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <TilluBot size={28} />
          <View>
            <View style={[S.bubble, S.aiBubble]}>
              <Markdown style={mdStyle}>{msg.content}</Markdown>
            </View>
            <Pressable style={S.speakBtn} onPress={() => onSpeak(msg.content, index)} hitSlop={10}>
              <Ionicons
                name={speaking === index ? "stop-circle-outline" : "volume-medium-outline"}
                size={13}
                color={C.slate}
              />
              <Text style={S.speakText}>{speaking === index ? "Stop" : "Listen"}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {isUser && (
        <View style={[S.bubble, S.userBubble]}>
          <Text style={[S.bubbleText, { color: C.white }]}>{msg.content}</Text>
        </View>
      )}
    </View>
  );
}

// ── Todo row ──────────────────────────────────────────────────────────────────
function TodoRow({ todo, onToggle, onDelete }: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isPinned = todo.text.startsWith("📌");
  return (
    <View style={[S.todoRow, isPinned && { borderColor: C.teal, backgroundColor: C.tealLight }]}>
      <Pressable onPress={() => onToggle(todo.id)} style={S.checkbox} hitSlop={8}>
        {todo.completed
          ? <Ionicons name="checkmark-circle" size={22} color={C.teal} />
          : <Ionicons name="ellipse-outline" size={22} color={C.slateLight} />
        }
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[S.todoText, todo.completed && S.todoStrike]}>{todo.text}</Text>
        {todo.dueDate && (
          <Text style={S.todoDue}>Due: {todo.dueDate}</Text>
        )}
      </View>
      <Pressable onPress={() => onDelete(todo.id)} hitSlop={10}>
        <Ionicons name="trash-outline" size={17} color={C.slateLight} />
      </Pressable>
    </View>
  );
}

// ── Overdue banner ────────────────────────────────────────────────────────────
function OverdueBanner({ count, onPress }: { count: number; onPress: () => void }) {
  if (count === 0) return null;
  return (
    <Pressable onPress={onPress} style={S.overdueBanner}>
      <Ionicons name="alert-circle" size={16} color={C.orange} />
      <Text style={S.overdueText}>
        {count} overdue task{count > 1 ? "s" : ""} — Tillu wants to help! 👆
      </Text>
    </Pressable>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const [view, setView]         = useState<"chat" | "tasks">("chat");
  const [msgs, setMsgs]         = useState<Msg[]>([{ role: "assistant", content: getTilluWelcome() }]);
  const [todos, setTodos]       = useState<Todo[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [newTask, setNewTask]   = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const overdueTodos = todos.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d < new Date();
  });

  useEffect(() => {
    void AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try { setMsgs(JSON.parse(raw) as Msg[]); } catch { /* corrupt */ }
      }
    });
    void loadTodos().then(setTodos);

    const s1 = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("result", (e) => {
      if (e.results?.[0]?.transcript) setInput(e.results[0].transcript);
    });
    const s2 = SpeechRecognition.ExpoSpeechRecognitionModule.addListener("end", () => setListening(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    if (msgs.length > 0) {
      void AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-30)));
    }
  }, [msgs]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;

    const userMsg: Msg = { role: "user", content: text };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const geminiHistory: GeminiMessage[] = history
        .filter((m) => m.content !== getTilluWelcome())
        .slice(-14)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const result = await sendGeminiChat(geminiHistory, todos);

      if (result.todo) {
        const newTodo = await addTodo(result.todo.text, result.todo.dueDate);
        setTodos((prev) => [newTodo, ...prev]);
      }

      const aiMsg: Msg = { role: "assistant", content: result.text };
      setMsgs((prev) => [...prev, aiMsg]);
    } catch (e) {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: e instanceof Error ? `Arey! Error vachindi: ${e.message} 😅 Try cheyyi again!` : "Network issue unna! Try again Amma 🙏" },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [input, msgs, sending, todos]);

  const toggleListen = async () => {
    if (listening) {
      await SpeechRecognition.ExpoSpeechRecognitionModule.stop();
      setListening(false);
    } else {
      const { granted } = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) { Alert.alert("Permission needed", "Allow microphone access in settings."); return; }
      setListening(true);
      await SpeechRecognition.ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: true });
    }
  };

  const speakMsg = (text: string, i: number) => {
    if (speaking === i) { Speech.stop(); setSpeaking(null); }
    else {
      Speech.speak(text, {
        language: "en-IN",
        onDone: () => setSpeaking(null),
        onError: () => setSpeaking(null),
      });
      setSpeaking(i);
    }
  };

  const handleToggleTodo = async (id: string) => {
    const updated = await toggleTodo(id);
    setTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert("Delete task?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const updated = await deleteTodo(id);
        setTodos(updated);
      }},
    ]);
  };

  const handleAddTask = async () => {
    const text = newTask.trim();
    if (!text) return;
    const todo = await addTodo(text);
    setTodos((prev) => [todo, ...prev]);
    setNewTask("");
  };

  const clearChat = () => Alert.alert("Clear Chat", "Start fresh with Tillu?", [
    { text: "Cancel", style: "cancel" },
    { text: "Clear", style: "destructive", onPress: async () => {
      await AsyncStorage.removeItem(HISTORY_KEY);
      setMsgs([{ role: "assistant", content: getTilluWelcome() }]);
    }},
  ]);

  const askTilluAboutOverdue = () => {
    const overdueNames = overdueTodos.map(t => t.text).join(", ");
    void send(`Tillu, I have ${overdueTodos.length} overdue task(s): ${overdueNames}. Help me!`);
    setView("chat");
  };

  const pendingCount = todos.filter((t) => !t.completed).length;

  const QUICK_PROMPTS = [
    "Kohli article ideas cheppandi! 🏏",
    "This week content plan cheyyi",
    "3 podcast topics suggest cheyyi",
    "Telugu culture article ideas?",
    "What should I work on today?",
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Tillu Header ── */}
      <View style={[S.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: "row", gap: 0 }}>
          <Pressable
            onPress={() => setView("chat")}
            style={[S.viewTab, view === "chat" && S.viewTabActive]}
          >
            <Text style={[S.viewTabText, view === "chat" && S.viewTabTextActive]}>Chat</Text>
          </Pressable>
          <Pressable
            onPress={() => setView("tasks")}
            style={[S.viewTab, view === "tasks" && S.viewTabActive]}
          >
            <Text style={[S.viewTabText, view === "tasks" && S.viewTabTextActive]}>Tasks</Text>
            {pendingCount > 0 && (
              <View style={[S.badge, overdueTodos.length > 0 && { backgroundColor: C.orange }]}>
                <Text style={S.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TilluBot size={32} speaking={sending} />
          <View>
            <Text style={S.tilluName}>Tillu</Text>
            <Text style={S.tilluSub}>AI Creative Buddy</Text>
          </View>
          {view === "chat" && (
            <Pressable onPress={clearChat} hitSlop={12}>
              <Ionicons name="create-outline" size={20} color={C.teal} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Overdue banner ── */}
      {overdueTodos.length > 0 && (
        <OverdueBanner count={overdueTodos.length} onPress={askTilluAboutOverdue} />
      )}

      {/* ── Chat view ── */}
      {view === "chat" && (
        <>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={S.msgList}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {msgs.map((m, i) => (
              <Bubble key={i} msg={m} index={i} onSpeak={speakMsg} speaking={speaking} />
            ))}
            {sending && <ThinkingDots />}
          </ScrollView>

          {msgs.length <= 1 && !sending && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.promptRow}
              keyboardShouldPersistTaps="handled"
            >
              {QUICK_PROMPTS.map((q) => (
                <Pressable key={q} style={S.promptChip} onPress={() => void send(q)}>
                  <Text style={S.promptText}>{q}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={[S.inputBar, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
            <TextInput
              style={S.input}
              value={input}
              onChangeText={setInput}
              placeholder={listening ? "Tillu listening… 👂" : "Tillu tho maatladandi…"}
              placeholderTextColor={listening ? C.teal : C.slateLight}
              multiline
              maxLength={1000}
              editable={!sending}
              onSubmitEditing={() => void send()}
            />
            <Pressable
              onPress={() => void toggleListen()}
              style={[S.iconBtn, listening && { backgroundColor: C.teal }]}
              hitSlop={8}
            >
              <Ionicons
                name={listening ? "mic" : "mic-outline"}
                size={21}
                color={listening ? C.white : C.slateLight}
              />
            </Pressable>
            {sending ? (
              <View style={[S.sendBtn, { backgroundColor: C.sand }]}>
                <ActivityIndicator size="small" color={C.white} />
              </View>
            ) : (
              <Pressable
                style={[S.sendBtn, !input.trim() && { backgroundColor: C.sand }]}
                onPress={() => void send()}
                disabled={!input.trim()}
              >
                <Ionicons name="send" size={17} color={C.white} />
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* ── Tasks view ── */}
      {view === "tasks" && (
        <>
          <View style={S.addTaskBar}>
            <TextInput
              style={S.addTaskInput}
              value={newTask}
              onChangeText={setNewTask}
              placeholder="Add a task…"
              placeholderTextColor={C.slateLight}
              onSubmitEditing={() => void handleAddTask()}
              returnKeyType="done"
            />
            <Pressable
              style={[S.sendBtn, !newTask.trim() && { backgroundColor: C.sand }]}
              onPress={() => void handleAddTask()}
              disabled={!newTask.trim()}
            >
              <Ionicons name="add" size={20} color={C.white} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={S.taskList}
            keyboardShouldPersistTaps="handled"
          >
            {overdueTodos.length > 0 && (
              <>
                <Text style={[S.sectionLabel, { color: C.orange }]}>⚠️ Overdue</Text>
                {overdueTodos.map((t) => (
                  <TodoRow key={t.id} todo={t} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} />
                ))}
              </>
            )}

            {todos.filter((t) => !t.completed && !overdueTodos.includes(t)).length > 0 && (
              <>
                {overdueTodos.length > 0 && <Text style={S.sectionLabel}>Pending</Text>}
                {todos.filter((t) => !t.completed && !overdueTodos.includes(t)).map((t) => (
                  <TodoRow key={t.id} todo={t} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} />
                ))}
              </>
            )}

            {todos.length === 0 && (
              <View style={S.emptyTasks}>
                <TilluBot size={72} />
                <Text style={S.emptyTitle}>Tillu ready!</Text>
                <Text style={S.emptySub}>
                  Tell me what you want to do and I'll remember it for you, Amma! ✨
                </Text>
              </View>
            )}

            {todos.some((t) => t.completed) && (
              <>
                <Text style={S.sectionLabel}>✅ Completed</Text>
                {todos.filter((t) => t.completed).map((t) => (
                  <TodoRow key={t.id} todo={t} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} />
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  header:         { backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.sandLight, paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewTab:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 4 },
  viewTabActive:  { backgroundColor: C.tealLight },
  viewTabText:    { fontSize: 14, fontWeight: "700", color: C.slateLight },
  viewTabTextActive: { color: C.teal },
  badge:          { backgroundColor: C.teal, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText:      { fontSize: 10, fontWeight: "800", color: C.white },
  tilluName:      { fontSize: 13, fontWeight: "800", color: C.ink },
  tilluSub:       { fontSize: 10, color: C.slateLight, fontWeight: "600" },
  overdueBanner:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.orangeLight, borderBottomWidth: 1, borderBottomColor: "#f0c8a8", paddingHorizontal: 16, paddingVertical: 10 },
  overdueText:    { fontSize: 12, fontWeight: "700", color: C.orange, flex: 1 },
  msgList:        { padding: 14, gap: 14, paddingBottom: 10 },
  bubble:         { maxWidth: "82%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble:     { alignSelf: "flex-end", backgroundColor: C.teal, borderBottomRightRadius: 5 },
  aiBubble:       { alignSelf: "flex-start", backgroundColor: C.white, borderWidth: 1, borderColor: C.sandLight, borderBottomLeftRadius: 5 },
  bubbleText:     { fontSize: 14, lineHeight: 22 },
  speakBtn:       { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: C.cream, borderWidth: 1, borderColor: C.sandLight },
  speakText:      { fontSize: 11, color: C.slate, fontWeight: "600" },
  dot:            { width: 7, height: 7, borderRadius: 4, backgroundColor: C.sandLight },
  promptRow:      { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  promptChip:     { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.sand, paddingHorizontal: 14, paddingVertical: 9 },
  promptText:     { fontSize: 12, color: C.teal, fontWeight: "600" },
  inputBar:       { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.sandLight, backgroundColor: C.paper },
  input:          { flex: 1, backgroundColor: C.cream, borderRadius: 22, borderWidth: 1, borderColor: C.sand, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: C.ink, maxHeight: 110, lineHeight: 20 },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: C.teal, alignItems: "center", justifyContent: "center" },
  addTaskBar:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.sandLight, backgroundColor: C.paper },
  addTaskInput:   { flex: 1, backgroundColor: C.cream, borderRadius: 20, borderWidth: 1, borderColor: C.sand, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.ink },
  taskList:       { padding: 14, gap: 8, paddingBottom: 30 },
  todoRow:        { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.sandLight, paddingHorizontal: 14, paddingVertical: 12 },
  checkbox:       { alignItems: "center", justifyContent: "center" },
  todoText:       { fontSize: 14, color: C.ink, fontWeight: "600", flexWrap: "wrap" },
  todoStrike:     { textDecorationLine: "line-through", color: C.slateLight, fontWeight: "400" },
  todoDue:        { fontSize: 11, color: C.slateLight, marginTop: 2 },
  sectionLabel:   { fontSize: 11, fontWeight: "800", color: C.slateLight, textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 2 },
  emptyTasks:     { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:     { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 8 },
  emptySub:       { fontSize: 13, color: C.slateLight, textAlign: "center", lineHeight: 20 },
});

const mdStyle = {
  body:         { color: C.ink, fontSize: 14, lineHeight: 22 },
  strong:       { fontWeight: "800" as const, color: C.ink },
  em:           { fontStyle: "italic" as const },
  bullet_list:  { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item:    { marginVertical: 2 },
  code_inline:  { backgroundColor: C.cream, borderRadius: 4, paddingHorizontal: 4, fontFamily: "monospace", fontSize: 12 },
  code_block:   { backgroundColor: C.cream, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 12 },
  heading1:     { fontSize: 18, fontWeight: "900" as const, color: C.ink, marginVertical: 6 },
  heading2:     { fontSize: 16, fontWeight: "800" as const, color: C.ink, marginVertical: 4 },
  paragraph:    { marginVertical: 2 },
};
