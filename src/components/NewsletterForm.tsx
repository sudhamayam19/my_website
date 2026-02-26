"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedEmail = email.trim();

    if (!cleanedEmail || !cleanedEmail.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    window.setTimeout(() => {
      setStatus("success");
      setMessage("Thanks. Your email was captured in frontend preview mode.");
      setEmail("");
    }, 500);
  };

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
