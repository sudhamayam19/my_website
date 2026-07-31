import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopicReplyForm } from "@/components/TopicReplyForm";
import { getDiscussionTopic } from "@/lib/discussions";
import { SITE_NAME } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const topic = await getDiscussionTopic(id);
  if (!topic) return { title: `Discussion | ${SITE_NAME}` };
  return {
    title: `${topic.title} | Discussions | ${SITE_NAME}`,
    description: topic.body.slice(0, 160),
  };
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [navItems, topic] = await Promise.all([
    getHomeNav({ includeJourney: true, includeMedia: true }),
    getDiscussionTopic(id),
  ]);

  if (!topic) notFound();

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/discussions" />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
        <Link href="/discussions" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1f6973] hover:underline">
          ← All discussions
        </Link>

        {/* The prompt Sudha opened */}
        <article className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-6">
          <span className="rounded-full bg-[#1f6973]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1f6973]">
            {topic.category}
          </span>
          <h1 className="display-font mt-3 text-3xl font-bold text-[#1f2d39] sm:text-4xl">{topic.title}</h1>
          <p className="mt-2 text-xs text-[#8fa3ad]">
            opened by <span className="font-semibold text-[#60717b]">{topic.author}</span> · {fmt(topic.createdAt)}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-[#2f4049]">{topic.body}</p>
        </article>

        {/* Guidelines */}
        {topic.guidelines && (
          <aside className="rounded-2xl border border-[#d89a55]/40 bg-gradient-to-br from-[#fff9ef] to-[#fffaf3] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8842a]">
              📋 How to take part
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#50616d]">
              {topic.guidelines}
            </p>
          </aside>
        )}

        {/* Replies */}
        <div>
          <h2 className="display-font text-xl font-bold text-[#1f2d39]">
            {topic.replies.length} {topic.replies.length === 1 ? "Response" : "Responses"}
          </h2>
          <div className="mt-3 space-y-3">
            {topic.replies.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 ${
                  r.authorType === "admin"
                    ? "border-[#1f6973]/40 bg-[#1f6973]/5"
                    : "border-[#e8dece] bg-white"
                }`}
              >
                <p className="text-xs font-bold text-[#1f2d39]">
                  {r.author}
                  {r.authorType === "admin" && (
                    <span className="ml-2 rounded-full bg-[#1f6973] px-2 py-0.5 text-[10px] font-bold text-white">
                      Sudha
                    </span>
                  )}
                  <span className="ml-2 font-normal text-[#a0b4bc]">{fmt(r.createdAt)}</span>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#40515c]">{r.message}</p>
              </div>
            ))}
          </div>
        </div>

        <TopicReplyForm topicId={topic.id} />
      </main>

      <SiteFooter />
    </div>
  );
}
