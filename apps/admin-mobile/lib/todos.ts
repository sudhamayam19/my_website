import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export interface Todo {
  id: string;
  text: string;
  dueDate?: string;
  completed: boolean;
  notifId?: string;
}

const TODOS_KEY = "assistant_todos_v1";

export async function loadTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(TODOS_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function resolveToDate(dueDate: string): Date | null {
  const now = new Date();
  const lower = dueDate.toLowerCase().trim();

  if (lower === "today") {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    return d.getTime() > Date.now() ? d : null;
  }
  if (lower === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  if (lower === "this weekend" || lower === "weekend") {
    const d = new Date(now);
    const day = d.getDay();
    d.setDate(d.getDate() + ((6 - day + 7) % 7 || 7));
    d.setHours(9, 0, 0, 0);
    return d;
  }

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const idx = days.indexOf(lower);
  if (idx !== -1) {
    const d = new Date(now);
    const diff = (idx - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  const parsed = new Date(dueDate);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(9, 0, 0, 0);
    return parsed.getTime() > Date.now() ? parsed : null;
  }

  return null;
}

async function scheduleReminder(text: string, dueDate: string): Promise<string | undefined> {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return undefined;

    const target = resolveToDate(dueDate);
    if (!target || target.getTime() <= Date.now()) return undefined;

    return await Notifications.scheduleNotificationAsync({
      content: { title: "Reminder", body: text, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    return undefined;
  }
}

export async function addTodo(text: string, dueDate?: string): Promise<Todo> {
  const todos = await loadTodos();
  const notifId = dueDate ? await scheduleReminder(text, dueDate) : undefined;
  const todo: Todo = { id: Date.now().toString(), text, dueDate, completed: false, notifId };
  await saveTodos([todo, ...todos]);
  return todo;
}

export async function toggleTodo(id: string): Promise<Todo[]> {
  const todos = await loadTodos();
  const updated = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  await saveTodos(updated);
  return updated;
}

export async function deleteTodo(id: string): Promise<Todo[]> {
  const todos = await loadTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo?.notifId) {
    try { await Notifications.cancelScheduledNotificationAsync(todo.notifId); } catch { /* ignore */ }
  }
  const updated = todos.filter((t) => t.id !== id);
  await saveTodos(updated);
  return updated;
}

export function parseTodoMarker(text: string): { text: string; dueDate?: string } | null {
  const match = /\[TODO:\s*([^|\]\n]+)(?:\|\s*([^\]\n]+))?\]/i.exec(text);
  if (!match) return null;
  return { text: match[1].trim(), dueDate: match[2]?.trim() };
}

export function stripTodoMarker(text: string): string {
  return text.replace(/\s*\[TODO:[^\]]*\]/gi, "").trim();
}
