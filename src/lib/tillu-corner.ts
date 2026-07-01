"use client";

// Browser-local store for Tillu Corner: call transcripts + saved scripts/docs.

export interface TilluCall {
  id: string;
  date: string;            // ISO
  durationSecs: number;
  turns: { role: "you" | "tillu"; text: string }[];
}

export interface TilluDoc {
  id: string;
  date: string;            // ISO
  title: string;
  content: string;
  source: "chat" | "call";
}

const CALLS_KEY = "tillu_call_history_v1";
const DOCS_KEY = "tillu_docs_v1";

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}
function write<T>(key: string, v: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(v.slice(-100))); } catch { /* quota */ }
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ── Calls ──
export function getCalls(): TilluCall[] {
  return read<TilluCall>(CALLS_KEY).sort((a, b) => b.date.localeCompare(a.date));
}
export function saveCall(call: Omit<TilluCall, "id">): void {
  if (!call.turns || call.turns.length === 0) return;
  write<TilluCall>(CALLS_KEY, [...read<TilluCall>(CALLS_KEY), { ...call, id: makeId() }]);
}
export function deleteCall(id: string): void {
  write<TilluCall>(CALLS_KEY, read<TilluCall>(CALLS_KEY).filter((c) => c.id !== id));
}

// ── Docs / scripts ──
export function getDocs(): TilluDoc[] {
  return read<TilluDoc>(DOCS_KEY).sort((a, b) => b.date.localeCompare(a.date));
}
export function saveDoc(doc: Omit<TilluDoc, "id" | "date">): TilluDoc {
  const full: TilluDoc = { ...doc, id: makeId(), date: new Date().toISOString() };
  write<TilluDoc>(DOCS_KEY, [...read<TilluDoc>(DOCS_KEY), full]);
  return full;
}
export function deleteDoc(id: string): void {
  write<TilluDoc>(DOCS_KEY, read<TilluDoc>(DOCS_KEY).filter((d) => d.id !== id));
}

// ── Helpers ──
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function callToText(call: TilluCall): string {
  const d = new Date(call.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const body = call.turns.map((t) => `${t.role === "you" ? "Akka" : "Tillu"}: ${t.text}`).join("\n\n");
  return `Tillu Call — ${d}\n\n${body}`;
}
