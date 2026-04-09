"use client";

import { useState } from "react";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const dark = variant === "dark";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedEmail = email.trim();

    if (!cleanedEmail || !cleanedEmail.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanedEmail }),
      });
      const data = (await response.json()) as
        | { alreadySubscribed?: boolean; error?: string }
        | undefined;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save email.");
      }

      setStatus("success");
      setMessage(
        data?.alreadySubscribed
          ? "This email is already subscribed."
          : "Thanks. You are subscribed.",
      );
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to subscribe right now.",
      );
    }
  };

  if (dark) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0dfc5]">Stay Updated</p>
          <p className="mt-1 text-sm text-[#b7ab9e]">New posts and podcasts straight to your inbox.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="footer-newsletter-email">Email</label>
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email"
            disabled={status === "loading" || status === "success"}
            className="rounded-full border border-[#3b4b57] bg-[#1d3b46] px-5 py-2.5 text-sm text-[#e9ddcd] placeholder-[#7a8f98] outline-none transition focus:border-[#5a8f98] disabled:opacity-60"
            required
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="rounded-full bg-gradient-to-r from-[#215c66] to-[#b6563f] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "..." : status === "success" ? "Subscribed ✓" : "Subscribe"}
          </button>
          {status === "error" && <p className="text-xs text-red-400">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <section className="editorial-card relative overflow-hidden p-8">
      <div className="editorial-lift absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#2b6777]/15 blur-sm" aria-hidden="true" />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="display-font text-4xl font-bold text-[#1e2d39]">Stay Updated</h2>
        <p className="mt-3 text-[#4d5c66]">
          Subscribe for updates on new posts, audio drops, and platform announcements.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Email
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            disabled={status === "loading"}
            className="w-full flex-1 rounded-full border border-[#c8b397] bg-[#fffefb] px-5 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring disabled:opacity-70"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-gradient-to-r from-[#215c66] to-[#b6563f] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        {status === "error" ? (
          <p className="mt-3 text-sm font-medium text-red-600">{message}</p>
        ) : null}
        {status === "success" ? (
          <p className="mt-3 text-sm font-medium text-emerald-600">{message}</p>
        ) : null}
      </div>
    </section>
  );
}
