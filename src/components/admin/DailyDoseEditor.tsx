"use client";

import { useState } from "react";
import type { DailyDose } from "@/lib/site-data";

export function DailyDoseEditor({ initialDose }: { initialDose: DailyDose }) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          author,
          active,
          style,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save Daily Dose.");
      }

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
            onChange={(event) => setText(event.target.value)}
            placeholder="Write today&apos;s quote, knowledge bite, or short reflection."
            className="min-h-32 w-full rounded-2xl border border-[#d3c1a8] bg-[#fffaf2] px-4 py-3 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670]"
          />
        </label>

        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#304a56]">Author or Source</span>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
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
              onChange={(event) => setActive(event.target.checked)}
              className="h-5 w-5 accent-[#1f6973]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2a6670]">Preview</p>
        <p className="mt-2 text-sm leading-relaxed text-[#1f2d39]">
          {text.trim() || "Your Daily Dose will preview here."}
          {author.trim() ? (
            <span className="font-semibold text-[#2a6670]"> — {author.trim()}</span>
          ) : null}
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
