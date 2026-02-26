export type PostStatus = "published" | "draft";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverGradient: string;
  status: PostStatus;
  featured: boolean;
  seoDescription: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  accentClass: string;
  icon: "radio" | "mic" | "languages" | "podcast" | "sparkles";
  placeholderLabel: string;
  placeholderGradient: string;
}

export interface MediaCard {
  id: string;
  platform: string;
  description: string;
  href: string;
  buttonLabel: string;
  gradientClass: string;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export const SITE_NAME = "Sudha Devarakonda";
export const SITE_TAGLINE = "RJ | Translator | Voice Artist";

export const timelineEvents: TimelineEvent[] = [
  {
    year: "2005",
    title: "Radio Journey Begins",
    description:
      "Started as an RJ and built a daily connection with listeners through music and storytelling.",
    accentClass: "border-[#2f7e87]",
    icon: "radio",
    placeholderLabel: "Add first radio studio photo",
    placeholderGradient: "from-[#d8ece8] to-[#f5eee0]",
  },
  {
    year: "2008",
    title: "Voice Artist",
    description:
      "Expanded into commercials, narration, and branded voice projects for broadcast and digital media.",
    accentClass: "border-[#bb6a4b]",
    icon: "mic",
    placeholderLabel: "Add voice recording session photo",
    placeholderGradient: "from-[#f4e2d8] to-[#f9eed9]",
  },
  {
    year: "2012",
    title: "Translation Work",
    description:
      "Began professional translation projects to bridge language and culture for wider audiences.",
    accentClass: "border-[#a5894d]",
    icon: "languages",
    placeholderLabel: "Add translation project photo",
    placeholderGradient: "from-[#efe8d1] to-[#f8f1df]",
  },
  {
    year: "2020",
    title: "Podcast Launch",
    description:
      "Launched long-format audio storytelling with interviews and personal reflections.",
    accentClass: "border-[#366779]",
    icon: "podcast",
    placeholderLabel: "Add podcast setup photo",
    placeholderGradient: "from-[#dce8f2] to-[#ece6dd]",
  },
  {
    year: "Today",
    title: "Building Across Platforms",
    description:
      "Publishing blogs, audio, and videos while preparing a scalable content workflow.",
    accentClass: "border-[#c07a2e]",
    icon: "sparkles",
    placeholderLabel: "Add latest profile photo",
    placeholderGradient: "from-[#f4e2c9] to-[#f7e8de]",
  },
];

export const mediaCards: MediaCard[] = [
  {
    id: "spotify",
    platform: "Spotify",
    description: "Listen to episodes, interviews, and curated audio moments.",
    href: "https://open.spotify.com/show/2aZL5tQATcdx7xCypHXJrI",
    buttonLabel: "Listen",
    gradientClass: "from-[#146b62] to-[#2d8f83]",
  },
  {
    id: "youtube",
    platform: "YouTube",
    description: "Watch conversations, clips, and behind-the-scenes stories.",
    href: "https://youtube.com/@sudhamayam?si=IhQWkDIrhwcWyMNJ",
    buttonLabel: "Watch",
    gradientClass: "from-[#8f3f2f] to-[#c0664f]",
  },
  {
    id: "instagram",
    platform: "Instagram",
    description: "Follow daily updates, reels, and quick snapshots.",
    href: "https://www.instagram.com/devarakonda.sudha.1?igsh=cjE5aDQzOGsxdmVq",
    buttonLabel: "Follow",
    gradientClass: "from-[#264c66] via-[#3d7c84] to-[#bf6d45]",
  },
];

export const socialLinks: SocialLink[] = [
  {
    id: "spotify",
    label: "Spotify",
    href: "https://open.spotify.com/show/2aZL5tQATcdx7xCypHXJrI",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@sudhamayam?si=IhQWkDIrhwcWyMNJ",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/devarakonda.sudha.1?igsh=cjE5aDQzOGsxdmVq",
  },
];

export const defaultBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "the-art-of-voice",
    title: "The Art of Voice: Finding Your Unique Sound",
    excerpt:
      "How deliberate practice, breath control, and authenticity helped shape a distinct voice style.",
    category: "Voice Acting",
    publishedAt: "2024-12-15",
    readTimeMinutes: 6,
    coverGradient: "from-[#1f6a6d] to-[#4ea59e]",
    status: "published",
    featured: true,
    seoDescription:
      "A practical guide to finding your voice style through range, context, and consistency.",
    content: [
      "Voice acting is not only about sound quality. It is about intention, control, and emotional clarity.",
      "At the beginning of my career, I focused on tone. Over time I learned that context matters more than polish.",
      "The first breakthrough came from breath work. Better breathing gave me stamina and consistency across long sessions.",
      "The second breakthrough came from listening. Real conversation rhythm is the best teacher for believable delivery.",
      "If you want to improve quickly, record short scripts daily and review them with one specific goal each day.",
      "Your unique voice is not a gift you wait for. It is a craft you build with repetition and honest feedback.",
    ],
  },
  {
    id: "2",
    slug: "behind-the-mic",
    title: "Behind the Mic: 20 Years of Radio Stories",
    excerpt:
      "A look at the moments that made radio deeply personal, from live calls to meaningful listener feedback.",
    category: "Radio Memories",
    publishedAt: "2024-11-28",
    readTimeMinutes: 7,
    coverGradient: "from-[#9e3d2d] to-[#d38d59]",
    status: "published",
    featured: true,
    seoDescription:
      "A twenty-year radio retrospective on live broadcasting, listener trust, and storytelling.",
    content: [
      "Radio taught me that consistency builds trust. A familiar voice can become part of someone’s daily routine.",
      "Live calls were always unpredictable, and that was the point. Real stories do not follow scripts.",
      "Some of the most memorable episodes were not high-profile interviews. They were honest small moments.",
      "When listeners say a show helped them through a difficult day, the work immediately feels bigger than content.",
      "Two decades later, the mission is unchanged: stay present, stay clear, and speak with care.",
    ],
  },
  {
    id: "3",
    slug: "bridging-cultures-through-translation",
    title: "Bridging Cultures Through Translation",
    excerpt:
      "Translation is more than replacing words. It is carrying meaning, tone, and culture across languages.",
    category: "Translation",
    publishedAt: "2024-11-10",
    readTimeMinutes: 5,
    coverGradient: "from-[#7d6a33] to-[#bfad67]",
    status: "published",
    featured: true,
    seoDescription:
      "Why high-quality translation requires context, cultural awareness, and emotional equivalence.",
    content: [
      "Translation quality depends on intent, not just vocabulary accuracy.",
      "Idioms, humor, and cultural references require adaptation, not direct conversion.",
      "The right translation preserves impact. The exact words can change, but the message cannot.",
      "Good translators spend time understanding audience expectations before touching the text.",
      "This work is a bridge between communities, and bridge-building always needs care.",
    ],
  },
  {
    id: "4",
    slug: "podcasting-storytelling-frontier",
    title: "Podcasting: A New Frontier for Storytelling",
    excerpt:
      "Why long-form audio creates space for deeper conversations and stronger audience relationships.",
    category: "Podcasting",
    publishedAt: "2024-10-25",
    readTimeMinutes: 6,
    coverGradient: "from-[#2f4f77] to-[#4f7ea8]",
    status: "published",
    featured: false,
    seoDescription:
      "Lessons from launching a podcast and building audience connection through long-form audio.",
    content: [
      "Podcasting gives creators time. Time allows nuance, and nuance builds trust.",
      "Unlike tight radio slots, episodes can follow ideas naturally and remain focused.",
      "Production quality matters, but audience loyalty usually starts with clarity and consistency.",
      "Publishing on schedule and improving each episode is more important than chasing perfection.",
      "If you have meaningful stories to share, long-form audio is still one of the strongest formats.",
    ],
  },
  {
    id: "5",
    slug: "power-of-spoken-word",
    title: "The Power of Spoken Word",
    excerpt:
      "Why voice delivery changes meaning and how spoken language can influence decisions and emotions.",
    category: "Inspiration",
    publishedAt: "2024-10-08",
    readTimeMinutes: 4,
    coverGradient: "from-[#8d493d] to-[#c48451]",
    status: "published",
    featured: false,
    seoDescription:
      "How intentional spoken language can inspire, comfort, and shape audience response.",
    content: [
      "Words carry content. Voice carries intent.",
      "The same sentence can reassure or discourage depending on tone and pacing.",
      "In audio work, preparation matters, but presence matters more.",
      "Speak with purpose. People remember how you made them feel long after the script ends.",
    ],
  },
  {
    id: "6",
    slug: "remote-recording-tips",
    title: "From Studio to Home: Remote Recording Tips",
    excerpt:
      "A practical setup guide for producing clean voice recordings from home without expensive gear.",
    category: "Voice Acting",
    publishedAt: "2024-09-20",
    readTimeMinutes: 5,
    coverGradient: "from-[#455a35] to-[#879f5f]",
    status: "published",
    featured: false,
    seoDescription:
      "Actionable home recording tips covering room setup, gear basics, and editing workflow.",
    content: [
      "A quiet room and basic acoustic treatment can outperform expensive equipment in a noisy space.",
      "Use a dedicated microphone and monitor with headphones while recording.",
      "Keep a repeatable setup. Consistent distance and gain simplify editing.",
      "Do a quick sample recording before every session to catch issues early.",
      "Start simple and improve one part of the chain at a time.",
    ],
  },
];

export const defaultBlogComments: BlogComment[] = [
  {
    id: "c1",
    postId: "1",
    author: "Priya Sharma",
    message: "Strong points on breath control. This helped my daily practice routine.",
    createdAt: "2025-01-03T09:45:00.000Z",
  },
  {
    id: "c2",
    postId: "1",
    author: "Rahul Verma",
    message: "The reminder about authenticity is exactly what beginners need to hear.",
    createdAt: "2025-01-05T18:10:00.000Z",
  },
  {
    id: "c3",
    postId: "2",
    author: "Neha Reddy",
    message: "Loved the radio memories. Live calls really do create a different energy.",
    createdAt: "2025-01-09T11:20:00.000Z",
  },
];

export function formatDisplayDate(input: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

export function formatRelativeTime(input: string): string {
  const date = new Date(input).getTime();
  const now = Date.now();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
