import Link from "next/link";

/**
 * Invites readers/listeners over to the Discussions page.
 * Shown on blog posts and podcast episodes.
 */
export function DiscussionCTA() {
  return (
    <Link
      href="/discussions"
      className="mt-8 flex items-center gap-4 rounded-2xl border border-[#1f6973]/25 bg-gradient-to-br from-[#eef7f7] to-[#fffaf3] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="text-3xl">💬</span>
      <div className="min-w-0 flex-1">
        <p className="display-font text-lg font-bold text-[#1f2d39]">
          Got thoughts on this?
        </p>
        <p className="mt-0.5 text-sm text-[#5f6f79]">
          Sudha opens a topic every so often — join the conversation.
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#1f6973] px-4 py-2 text-sm font-bold text-white">
        Discuss →
      </span>
    </Link>
  );
}
