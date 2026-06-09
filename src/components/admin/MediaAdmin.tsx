"use client";

import { useEffect, useState } from "react";

type Category = "tv" | "radio" | "print" | "online" | "podcast" | "event";

interface MediaItem {
  _id: string;
  title: string;
  outlet: string;
  category: Category;
  date: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  featured: boolean;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "tv", label: "TV" },
  { value: "radio", label: "Radio" },
  { value: "print", label: "Print" },
  { value: "online", label: "Online" },
  { value: "podcast", label: "Podcast" },
  { value: "event", label: "Event" },
];

const EMPTY: Omit<MediaItem, "_id"> = {
  title: "", outlet: "", category: "tv", date: new Date().toISOString().slice(0, 10),
  description: "", link: "", imageUrl: "", featured: false,
};

export function MediaAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<MediaItem, "_id"> & { id?: string }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d: { items?: MediaItem[] }) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.outlet.trim()) { setMsg("Title and outlet are required."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      const saved: MediaItem = { ...form, _id: data.id ?? form.id ?? "" };
      setItems((prev) => {
        const without = prev.filter((i) => i._id !== saved._id);
        return [saved, ...without].sort((a, b) => b.date.localeCompare(a.date));
      });
      setForm(EMPTY); setShowForm(false); setMsg("Saved!");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this appearance?")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const edit = (item: MediaItem) => {
    setForm({ ...item, id: item._id });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-[#1f2d39]">Media & Press</h1>
          <p className="text-sm text-[#5f6f79] mt-1">Add interviews, features, and appearances</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setShowForm((v) => !v); setMsg(""); }}
          className="rounded-full bg-[#1f6973] px-4 py-2 text-sm font-bold text-white hover:bg-[#185860] transition"
        >
          {showForm ? "Cancel" : "+ Add Appearance"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-[#d3c1a8] bg-[#fffaf2] p-6 space-y-4">
          <h2 className="font-bold text-[#1f2d39]">{form.id ? "Edit" : "New"} Appearance</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Title *</span>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Interview title or show name"
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Outlet / Channel *</span>
              <input value={form.outlet} onChange={(e) => setForm((f) => ({ ...f, outlet: e.target.value }))}
                placeholder="e.g. Deccan Chronicle, Radio Mirchi"
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Category</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#304a56]">Description</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Brief description of the appearance"
              className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Link (optional)</span>
              <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Image URL (optional)</span>
              <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 accent-[#1f6973]" />
            <span className="text-sm font-semibold text-[#304a56]">Feature this appearance (shows prominently)</span>
          </label>

          {msg && <p className="text-sm font-medium text-[#455964]">{msg}</p>}

          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#1f6973] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#185860] disabled:opacity-60 transition">
            {saving ? "Saving…" : "Save Appearance"}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-[#8fa3ad] py-6">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] px-6 py-12 text-center">
          <p className="text-[#8fa3ad]">No appearances yet. Add the first one above!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-4 rounded-2xl border border-[#e0d4c0] bg-[#fffaf2] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.featured && <span className="text-[10px] font-bold uppercase tracking-wider text-[#c07a2e] bg-[#fff3dc] px-2 py-0.5 rounded-full">Featured</span>}
                  <span className="text-[11px] font-bold uppercase text-[#1f6973]">{item.category}</span>
                  <span className="text-xs text-[#8fa3ad]">{item.date}</span>
                </div>
                <p className="font-semibold text-[#1f2d39] truncate mt-0.5">{item.title}</p>
                <p className="text-xs text-[#60717b]">{item.outlet}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => edit(item)} className="rounded-full border border-[#d3c1a8] px-3 py-1.5 text-xs font-bold text-[#455964] hover:border-[#1f6973] hover:text-[#1f6973] transition">
                  Edit
                </button>
                <button onClick={() => void remove(item._id)} className="rounded-full px-3 py-1.5 text-xs font-bold text-[#c08080] hover:bg-red-50 hover:text-red-600 transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
