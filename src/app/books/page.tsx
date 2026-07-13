import type { Metadata } from "next";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Book3D } from "@/components/Book3D";
import { SITE_NAME } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Books | ${SITE_NAME}`,
  description:
    "Kriya Yoga Darsanam — a spiritual classic by Swami Shankarananda Giri, translated into Telugu by Sudha Devarakonda.",
};

export default async function BooksPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/books" />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-14">
        {/* Hero */}
        <section className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">Published Works</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">Books</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            A published translator — Sudha brings profound works to Telugu readers, keeping their
            soul intact.
          </p>
        </section>

        {/* Featured book */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <Book3D
            coverSrc="/books/kriya-yoga-cover.jpg"
            backSrc="/books/kriya-yoga-back.jpg"
            title="క్రియా యోగ దర్శనము"
            author="స్వామి శంకరానంద గిరి"
          />

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8842a]">Telugu Translation</p>
            <h2 className="display-font mt-2 text-3xl font-bold text-[#1f2d39]">
              క్రియా యోగ దర్శనము
            </h2>
            <p className="mt-1 text-lg text-[#4f5f69]">Kriya Yoga Darsanam</p>
            <p className="mt-1 text-sm text-[#60717b]">Dhyanam &amp; symbolic exposition · Revised &amp; expanded second edition</p>

            <div className="mt-5 space-y-2 text-sm">
              <p><span className="font-bold text-[#1f2d39]">Original author:</span> <span className="text-[#4f5f69]">Swami Shankarananda Giri</span></p>
              <p><span className="font-bold text-[#1f2d39]">Telugu translation:</span> <span className="text-[#4f5f69]">Srimati Devarakonda Sudha</span></p>
              <p><span className="font-bold text-[#1f2d39]">Subject:</span> <span className="text-[#4f5f69]">Kriya Yoga &amp; meditation</span></p>
            </div>

            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#185860]"
            >
              📖 Enquire about this book
            </a>
          </div>
        </section>

        {/* About the book */}
        <section className="rounded-3xl border border-[#d8c8b0] bg-[#fffaf3] p-8">
          <h2 className="display-font text-2xl font-bold text-[#1f2d39]">About the book</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#4f5f69]">
            <p>
              In the 1920s, Paramahansa Yogananda brought the meditation of Kriya Yoga to the Western
              world, where it stood among the highest of spiritual practices. Today, as more and more
              people grow curious about spirituality and what it truly means, this book answers that
              question in clear, universal terms.
            </p>
            <p>
              Rather than framing the path through any single religion — or through denial of the
              divine — <em>Kriya Yoga Darsanam</em> uses language and definitions accessible to
              everyone, drawing a sharp line between genuine spiritual practice and belief based only
              on emotion or assumption. It explores the precise, almost mathematical relationship
              between spirituality, humanity, and faith.
            </p>
          </div>
        </section>

        {/* The blessing */}
        <section className="rounded-3xl bg-[#1f3a40] px-6 py-10 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9ec7cc]">శుభాశీస్సులు · A Blessing</p>
          <blockquote className="display-font mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#eaf4f5]">
            “ఈ గ్రంథాన్ని తెలుగు భాషలో అనువదించిన శ్రీమతి దేవరకొండ సుధ గారిని అభినందిస్తూ ఆశీర్వదిస్తున్నాను.”
          </blockquote>
          <p className="mx-auto mt-4 max-w-2xl text-sm italic leading-relaxed text-[#bcd4d6]">
            “I congratulate and bless Srimati Devarakonda Sudha, who translated this work into Telugu.”
          </p>
          <p className="mt-5 text-sm font-bold text-white">— Swami Shankarananda Giri</p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
