"use client";

import { useState } from "react";

export function AdminSessionControls() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
      className="rounded-full border border-[#b98d67] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2a6670] transition hover:bg-[#f6efe3] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
