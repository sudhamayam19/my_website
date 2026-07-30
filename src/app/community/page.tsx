import type { Metadata } from "next";
import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { NewTopicForm } from "@/components/NewTopicForm";
import { getDiscussionTopics } from "@/lib/discussions";
import { SITE_NAME } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Community | ${SITE_NAME}`,
  description:
    "Join the conversation — discuss cricket, Telugu culture, writing and life with Sudha Devarakonda's community.",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CommunityPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });
  const topics = await getDiscussionTopics(false);

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/community" />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">Community</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">Discussions</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            A space for readers and listeners — share your thoughts on cricket, Telugu culture,
            writing, and life. Everyone&apos;s welcome.
          </p>
        </div>

        <NewTopicForm />

        {topics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8c8b0] bg-[#fffaf3] px-6 py-16 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-bold text-[#1f2d39]">No discussions yet</p>
            <p className="mt-1 text-sm text-[#60717b]">Be the first to start one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/community/${t.id}`}
                className="block rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-5 transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.pinned && <span className="text-xs">📌</span>}
                      <span className="rounded-full bg-[#1f6973]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1f6973]">
                        {t.category}
                      </span>
                    </div>
                    <h2 className="display-font mt-2 text-xl font-bold text-[#1f2d39]">{t.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-[#5f6f79]">{t.body}</p>
                    <p className="mt-2 text-xs text-[#8fa3ad]">
                      by <span className="font-semibold text-[#60717b]">{t.author}</span> · {timeAgo(t.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="display-font text-2xl font-bold text-[#1f6973]">{t.replyCount}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8fa3ad]">
                      {t.replyCount === 1 ? "reply" : "replies"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
