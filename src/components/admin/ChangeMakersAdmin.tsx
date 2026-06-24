"use client";

import { useEffect, useState } from "react";

interface ChangeMaker {
  _id: string;
  name: string;
  tagline: string;
  story: string;
  imageUrl?: string;
  link?: string;
  weekOf: string;
  published: boolean;
}

const EMPTY: Omit<ChangeMaker, "_id"> = {
  name: "", tagline: "", story: "", imageUrl: "", link: "",
  weekOf: new Date().toISOString().slice(0, 10), published: false,
};

export function ChangeMakersAdmin() {
  const [items, setItems] = useState<ChangeMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<ChangeMaker, "_id"> & { id?: string }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/changemakers", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { items?: ChangeMaker[] }) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.tagline.trim() || !form.story.trim() || !form.weekOf) {
      setMsg("Name, tagline, story and week are required."); return;
    }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/changemakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      const saved: ChangeMaker = { ...form, _id: data.id ?? form.id ?? "" };
      setItems((prev) => {
        const without = prev.filter((i) => i._id !== saved._id);
        return [saved, ...without].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
      });
      setForm(EMPTY); setShowForm(false); setMsg("Saved!");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this Change Maker?")) return;
    await fetch(`/api/admin/changemakers/${id}`, { method: "DELETE", credentials: "same-origin" });
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const edit = (item: ChangeMaker) => {
    setForm({ ...item, id: item._id });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-[#1f2d39]">Change Makers</h1>
          <p className="text-sm text-[#5f6f79] mt-1">One person per week who changed the world</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setShowForm((v) => !v); setMsg(""); }}
          className="rounded-full bg-[#1f6973] px-4 py-2 text-sm font-bold text-white hover:bg-[#185860] transition"
        >
          {showForm ? "Cancel" : "+ Add Person"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#d3c1a8] bg-[#fffaf2] p-6 space-y-4">
          <h2 className="font-bold text-[#1f2d39]">{form.id ? "Edit" : "New"} Change Maker</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Name *</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nelson Mandela"
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Week of *</span>
              <input type="date" value={form.weekOf} onChange={(e) => setForm((f) => ({ ...f, weekOf: e.target.value }))}
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#304a56]">Tagline * <span className="font-normal text-[#8fa3ad]">(one line summary)</span></span>
            <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="e.g. Freedom fighter who ended apartheid in South Africa"
              className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#304a56]">Story *</span>
            <textarea value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              rows={6} placeholder="Tell the story of how this person changed the world..."
              className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Photo URL (optional)</span>
              <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-[#304a56]">Read more link (optional)</span>
              <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#d3c1a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a6670]" />
            </label>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="h-4 w-4 accent-[#1f6973]" />
            <span className="text-sm font-semibold text-[#304a56]">Publish (shows on website)</span>
          </label>

          {msg && <p className="text-sm font-medium text-[#455964]">{msg}</p>}

          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#1f6973] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#185860] disabled:opacity-60 transition">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#8fa3ad] py-6">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] px-6 py-12 text-center">
          <p className="text-[#8fa3ad]">No change makers yet. Add the first one above!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-4 rounded-2xl border border-[#e0d4c0] bg-[#fffaf2] px-4 py-3">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-full object-cover shrink-0 border border-[#d3c1a8]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.published
                    ? <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Published</span>
                    : <span className="text-[10px] font-bold uppercase tracking-wider text-[#8fa3ad] bg-[#f5f0e8] px-2 py-0.5 rounded-full">Draft</span>
                  }
                  <span className="text-xs text-[#8fa3ad]">Week of {item.weekOf}</span>
                </div>
                <p className="font-semibold text-[#1f2d39] truncate mt-0.5">{item.name}</p>
                <p className="text-xs text-[#60717b] truncate">{item.tagline}</p>
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
