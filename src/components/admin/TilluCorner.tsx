"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  TilluCall, TilluDoc, getCalls, getDocs, deleteCall, deleteDoc,
  downloadText, callToText,
} from "@/lib/tillu-corner";

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
}
function mmss(s: number): string { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

export function TilluCorner() {
  const [tab, setTab] = useState<"scripts" | "calls">("scripts");
  const [docs, setDocs] = useState<TilluDoc[]>([]);
  const [calls, setCalls] = useState<TilluCall[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setDocs(getDocs()); setCalls(getCalls()); }, []);

  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500); } catch { /* */ }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📁</span>
          <div>
            <h1 className="display-font text-3xl font-bold text-[#1f2d39]">Tillu Corner</h1>
            <p className="text-sm text-[#5f6f79]">Saved scripts & call transcripts</p>
          </div>
        </div>
        <Link href="/admin/tillu" className="rounded-full bg-[#1f6973] px-4 py-2 text-sm font-bold text-white hover:bg-[#185860] transition">
          🤖 Open Tillu
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["scripts", "calls"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === t ? "bg-[#1f6973] text-white" : "border border-[#d3c1a8] text-[#5f6f79] hover:border-[#1f6973]"
            }`}>
            {t === "scripts" ? `📝 Scripts (${docs.length})` : `📞 Calls (${calls.length})`}
          </button>
        ))}
      </div>

      {/* Scripts */}
      {tab === "scripts" && (
        docs.length === 0 ? (
          <Empty text="No saved scripts yet. In Tillu chat, tap “📁 Save to Corner” on any reply." />
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="rounded-2xl border border-[#e0d4c0] bg-[#fffaf2] p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setOpen(open === d.id ? null : d.id)} className="flex-1 text-left">
                    <p className="font-semibold text-[#1f2d39]">{d.title}</p>
                    <p className="text-xs text-[#8fa3ad]">{fmt(d.date)} · from {d.source}</p>
                  </button>
                  <div className="flex shrink-0 gap-1.5">
                    <IconBtn label={copied === d.id ? "✓" : "Copy"} onClick={() => void copy(d.id, d.content)} />
                    <IconBtn label="⬇︎" onClick={() => downloadText(`${d.title.slice(0, 40)}.txt`, d.content)} />
                    <IconBtn label="✕" danger onClick={() => { deleteDoc(d.id); setDocs(getDocs()); }} />
                  </div>
                </div>
                {open === d.id && (
                  <pre className="mt-3 whitespace-pre-wrap border-t border-[#e8dece] pt-3 text-sm text-[#374b54] font-sans">{d.content}</pre>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Calls */}
      {tab === "calls" && (
        calls.length === 0 ? (
          <Empty text="No call transcripts yet. Make a Call Tillu session and hang up — it saves here." />
        ) : (
          <div className="space-y-2">
            {calls.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#e0d4c0] bg-[#fffaf2] p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 text-left">
                    <p className="font-semibold text-[#1f2d39]">📞 Call — {fmt(c.date)}</p>
                    <p className="text-xs text-[#8fa3ad]">{mmss(c.durationSecs)} · {c.turns.length} messages</p>
                  </button>
                  <div className="flex shrink-0 gap-1.5">
                    <IconBtn label={copied === c.id ? "✓" : "Copy"} onClick={() => void copy(c.id, callToText(c))} />
                    <IconBtn label="⬇︎" onClick={() => downloadText(`tillu-call-${c.id}.txt`, callToText(c))} />
                    <IconBtn label="✕" danger onClick={() => { deleteCall(c.id); setCalls(getCalls()); }} />
                  </div>
                </div>
                {open === c.id && (
                  <div className="mt-3 space-y-2 border-t border-[#e8dece] pt-3">
                    {c.turns.map((t, i) => (
                      <p key={i} className={`text-sm ${t.role === "you" ? "text-[#1f6973] font-medium" : "text-[#374b54]"}`}>
                        <span className="font-bold">{t.role === "you" ? "Akka: " : "Tillu: "}</span>{t.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function IconBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
        danger ? "border-[#e8c0c0] text-[#c08080] hover:bg-red-50" : "border-[#d3c1a8] text-[#5f6f79] hover:border-[#1f6973] hover:text-[#1f6973]"
      }`}>
      {label}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] px-6 py-12 text-center">
      <p className="text-sm text-[#8fa3ad]">{text}</p>
    </div>
  );
}
