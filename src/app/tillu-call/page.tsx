"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TilluLiveCall } from "@/components/admin/TilluLiveCall";

export const dynamic = "force-dynamic";

function CallInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? undefined;
  const [ended, setEnded] = useState(false);

  if (ended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c2830] text-center text-white">
        <p className="text-2xl">📞</p>
        <p className="mt-2 text-lg font-bold">Call ended</p>
        <button
          onClick={() => setEnded(false)}
          className="mt-6 rounded-full bg-[#1f6973] px-6 py-3 text-sm font-bold text-white"
        >
          Call Tillu again
        </button>
      </div>
    );
  }

  return <TilluLiveCall authToken={token} onClose={() => setEnded(true)} />;
}

export default function TilluCallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c2830]" />}>
      <CallInner />
    </Suspense>
  );
}
