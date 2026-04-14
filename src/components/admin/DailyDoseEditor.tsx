"use client";

import { useEffect, useState } from "react";
import type { DailyDose } from "@/lib/site-data";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayIST() {
  // IST = UTC+5:30
  const ms = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function next10Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ms = Date.now() + 5.5 * 60 * 60 * 1000 + i * 86400_000;
    days.push(new Date(ms).toISOString().slice(0, 10));
  }
  return days;
}

function formatDay(date: string) {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

interface ScheduledDose {
  id: string;
  date: string;
  text: string;
  author?: string;
  style: "scroll" | "flash";
}

// ── Current dose editor ───────────────────────────────────────────────────────

function CurrentDoseEditor({ initialDose }: { initialDose: DailyDose }) {
  const [text, setText] = useState(initialDose.text);
  const [author, setAuthor] = useState(initialDose.author ?? "");
  const [active, setActive] = useState(initialDose.active);
  const [style, setStyle] = useState<"scroll" | "flash">(initialDose.style);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/daily-dose", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author, active, style }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to save Daily Dose.");
      setMessage("Daily Dose updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save Daily Dose.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#304a56]">Message</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write today's quote, knowledge bite, or short reflection."
            className="min-h-32 w-full rounded-2xl border border-[#d3c1a8] bg-[#fffaf2] px-4 py-3 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670]"
          />
        </label>
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#304a56]">Author or Source</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-[#d3c1a8] bg-[#fffaf2] px-4 py-3 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670]"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-[#304a56]">Display style</span>
            <div className="flex flex-wrap gap-2">
              {(["scroll", "flash"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStyle(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    style === option
                      ? "bg-[#1f6973] text-white"
                      : "border border-[#d3c1a8] bg-[#fbf4e7] text-[#455964]"
                  }`}
                >
                  {option === "scroll" ? "Scrolling banner" : "Flash card"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-[#d3c1a8] bg-[#fcf5ea] px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-[#304a56]">Show on website</span>
              <span className="text-xs text-[#5f6f79]">Turn this on when today&apos;s message is ready.</span>
            </span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 accent-[#1f6973]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2a6670]">Preview</p>
        <p className="mt-2 text-sm leading-relaxed text-[#1f2d39]">
          {text.trim() || "Your Daily Dose will preview here."}
          {author.trim() ? <span className="font-semibold text-[#2a6670]"> — {author.trim()}</span> : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="editorial-btn-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Daily Dose"}
        </button>
        {message ? <p className="text-sm font-medium text-[#455964]">{message}</p> : null}
      </div>
    </div>
  );
}

// ── Day row editor ────────────────────────────────────────────────────────────

function DayRow({
  date,
  isToday,
  existing,
  onSaved,
  onDeleted,
}: {
  date: string;
  isToday: boolean;
  existing: ScheduledDose | null;
  onSaved: (dose: ScheduledDose) => void;
  onDeleted: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(existing?.text ?? "");
  const [author, setAuthor] = useState(existing?.author ?? "");
  const [style, setStyle] = useState<"scroll" | "flash">(existing?.style ?? "scroll");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  // sync if parent changes
  useEffect(() => {
    if (!open) {
      setText(existing?.text ?? "");
      setAuthor(existing?.author ?? "");
      setStyle(existing?.style ?? "scroll");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const save = async () => {
    if (!text.trim()) { setErr("Message is required."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/daily-dose/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, text: text.trim(), author: author.trim() || undefined, style }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      onSaved({ id: data.id ?? date, date, text: text.trim(), author: author.trim() || undefined, style });
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/admin/daily-dose/schedule?date=${date}`, { method: "DELETE" });
      onDeleted(date);
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-2xl border transition ${isToday ? "border-[#1f6973] bg-[#f0f8f8]" : "border-[#e0d4c0] bg-[#fffaf2]"}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0 text-center">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-[#1f6973]" : "text-[#8fa3ad]"}`}>
            {isToday ? "Today" : formatDay(date).split(" ")[0]}
          </p>
          <p className={`text-lg font-black leading-none ${isToday ? "text-[#1f6973]" : "text-[#1f2d39]"}`}>
            {new Date(date + "T00:00:00Z").getUTCDate()}
          </p>
          <p className="text-[10px] text-[#8fa3ad]">
            {new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          {existing ? (
            <p className="truncate text-sm text-[#1f2d39] font-medium">{existing.text}</p>
          ) : (
            <p className="text-sm text-[#b0a090] italic">No dose scheduled</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {existing && !open && (
            <button
              onClick={remove}
              disabled={deleting}
              className="rounded-full p-1.5 text-[#c0a080] hover:bg-red-50 hover:text-red-500 transition"
              title="Remove"
            >
              {deleting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => { setOpen((v) => !v); setErr(""); }}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              open
                ? "bg-[#e0edef] text-[#1f6973]"
                : existing
                  ? "border border-[#d3c1a8] bg-white text-[#455964] hover:border-[#1f6973] hover:text-[#1f6973]"
                  : "bg-[#1f6973] text-white hover:bg-[#185860]"
            }`}
          >
            {open ? "Cancel" : existing ? "Edit" : "+ Schedule"}
          </button>
        </div>
      </div>

      {/* Inline form */}
      {open && (
        <div className="border-t border-[#e0d4c0] px-4 pb-4 pt-3 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write the daily dose message…"
            rows={3}
            className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2.5 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670]"
          />
          <div className="flex flex-wrap gap-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author / source (optional)"
              className="flex-1 min-w-[160px] rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670]"
            />
            <div className="flex gap-1.5">
              {(["scroll", "flash"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    style === s ? "bg-[#1f6973] text-white" : "border border-[#d3c1a8] bg-white text-[#455964]"
                  }`}
                >
                  {s === "scroll" ? "Scroll" : "Flash"}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-[#1f6973] px-5 py-2 text-sm font-bold text-white hover:bg-[#185860] disabled:opacity-60 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DailyDoseEditor({ initialDose }: { initialDose: DailyDose }) {
  const [tab, setTab] = useState<"today" | "schedule">("today");
  const [schedule, setSchedule] = useState<ScheduledDose[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const days = next10Days();
  const today = todayIST();

  useEffect(() => {
    if (tab !== "schedule") return;
    setLoadingSchedule(true);
    fetch("/api/admin/daily-dose/schedule")
      .then((r) => r.json())
      .then((data: { doses?: ScheduledDose[] }) => setSchedule(data.doses ?? []))
      .catch(() => null)
      .finally(() => setLoadingSchedule(false));
  }, [tab]);

  const byDate = Object.fromEntries(schedule.map((d) => [d.date, d]));

  const handleSaved = (dose: ScheduledDose) => {
    setSchedule((prev) => {
      const without = prev.filter((d) => d.date !== dose.date);
      return [...without, dose].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleDeleted = (date: string) => {
    setSchedule((prev) => prev.filter((d) => d.date !== date));
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[#e0d4c0] bg-[#faf4eb] p-1 w-fit">
        {(["today", "schedule"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white shadow text-[#1f2d39]" : "text-[#6b7f8a] hover:text-[#1f2d39]"
            }`}
          >
            {t === "today" ? "Today's Dose" : "10-Day Schedule"}
          </button>
        ))}
      </div>

      {tab === "today" && <CurrentDoseEditor initialDose={initialDose} />}

      {tab === "schedule" && (
        <div className="space-y-3">
          <p className="text-sm text-[#5f6f79]">
            Schedule up to 10 days of daily doses in advance. Each day&apos;s dose will automatically
            appear on the website at midnight IST.
          </p>

          {loadingSchedule ? (
            <div className="flex items-center gap-2 py-4 text-sm text-[#8fa3ad]">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading schedule…
            </div>
          ) : (
            <div className="space-y-2">
              {days.map((date) => (
                <DayRow
                  key={date}
                  date={date}
                  isToday={date === today}
                  existing={byDate[date] ?? null}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
