"use client";

import { signOut } from "next-auth/react";

export function AdminSessionControls() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-[#b98d67] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2a6670] transition hover:bg-[#f6efe3]"
    >
      Sign out
    </button>
  );
}
