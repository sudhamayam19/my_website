import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// Host-led discussions — Sudha opens a topic, readers reply.

export const listTopics = queryGeneric({
  args: { includeHidden: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("discussionTopics")
      .withIndex("by_lastActivityTs")
      .order("desc")
      .collect();
    const visible = args.includeHidden ? rows : rows.filter((r) => r.status === "approved");
    return visible
      .sort(
        (a, b) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.lastActivityTs - a.lastActivityTs,
      )
      .map((r) => ({
        id: String(r._id),
        title: r.title,
        body: r.body,
        guidelines: r.guidelines ?? "",
        author: r.author,
        category: r.category,
        createdAt: r.createdAt,
        replyCount: r.replyCount,
        status: r.status,
        pinned: r.pinned ?? false,
      }));
  },
});

export const getTopic = queryGeneric({
  args: { id: v.id("discussionTopics") },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.id);
    if (!t || t.status !== "approved") return null;
    const replies = await ctx.db
      .query("discussionReplies")
      .withIndex("by_topicId_createdAtTs", (q) => q.eq("topicId", args.id))
      .order("asc")
      .collect();
    return {
      id: String(t._id),
      title: t.title,
      body: t.body,
      guidelines: t.guidelines ?? "",
      author: t.author,
      category: t.category,
      createdAt: t.createdAt,
      replyCount: t.replyCount,
      status: t.status,
      pinned: t.pinned ?? false,
      replies: replies
        .filter((r) => r.status === "approved")
        .map((r) => ({
          id: String(r._id),
          author: r.author,
          message: r.message,
          createdAt: r.createdAt,
          authorType: r.authorType ?? "user",
        })),
    };
  },
});

export const createTopic = mutationGeneric({
  args: {
    title: v.string(),
    body: v.string(),
    guidelines: v.optional(v.string()),
    author: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    const body = args.body.trim();
    const author = args.author.trim();
    if (!title || !body || !author) throw new Error("Name, title and message are required.");
    if (title.length > 140) throw new Error("Title is too long.");

    const now = new Date().toISOString();
    const ts = Date.parse(now);
    const id = await ctx.db.insert("discussionTopics", {
      title,
      body,
      guidelines: (args.guidelines ?? "").trim() || undefined,
      author,
      category: (args.category ?? "General").trim() || "General",
      createdAt: now,
      createdAtTs: ts,
      lastActivityTs: ts,
      replyCount: 0,
      status: "approved",
    });
    return { id: String(id) };
  },
});

export const addReply = mutationGeneric({
  args: {
    topicId: v.id("discussionTopics"),
    author: v.string(),
    message: v.string(),
    authorType: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.status !== "approved") throw new Error("Discussion unavailable.");

    const author = args.author.trim();
    const message = args.message.trim();
    if (!author || !message) throw new Error("Name and reply are required.");

    const now = new Date().toISOString();
    const ts = Date.parse(now);
    const id = await ctx.db.insert("discussionReplies", {
      topicId: args.topicId,
      author,
      message,
      createdAt: now,
      createdAtTs: ts,
      authorType: args.authorType ?? "user",
      status: "approved",
    });
    await ctx.db.patch(args.topicId, {
      replyCount: topic.replyCount + 1,
      lastActivityTs: ts,
    });
    return { id: String(id), author, message, createdAt: now };
  },
});

export const updateTopicStatus = mutationGeneric({
  args: {
    id: v.id("discussionTopics"),
    status: v.union(v.literal("approved"), v.literal("hidden"), v.literal("spam")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return { ok: true };
  },
});

export const deleteTopic = mutationGeneric({
  args: { id: v.id("discussionTopics") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("discussionReplies")
      .withIndex("by_topicId_createdAtTs", (q) => q.eq("topicId", args.id))
      .collect();
    for (const r of replies) await ctx.db.delete(r._id);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// One-off seed for testing — creates a sample discussion if none exist.
export const seedExample = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("discussionTopics").first();
    if (existing) return { skipped: true, reason: "Discussions already exist." };

    const now = new Date().toISOString();
    const ts = Date.parse(now);
    const id = await ctx.db.insert("discussionTopics", {
      title: "Does Telugu cinema still tell our real stories?",
      body:
        "Every festival season we get bigger sets, louder music, grander heroes. " +
        "But somewhere between the spectacle, I keep wondering — are we still telling " +
        "the small, honest stories that made Telugu cinema ours?\n\n" +
        "What was the last Telugu film that felt truly like home to you?",
      guidelines:
        "• Keep it respectful — everyone's view matters.\n" +
        "• Stay on the topic above.\n" +
        "• Share your own experience, not just opinions.\n" +
        "• No promotions or abusive language.",
      author: "Sudha",
      category: "Telugu Culture",
      createdAt: now,
      createdAtTs: ts,
      lastActivityTs: ts,
      replyCount: 1,
      status: "approved",
    });

    await ctx.db.insert("discussionReplies", {
      topicId: id,
      author: "Ravi",
      message:
        "For me it was 'Balagam'. No big hero, no fights — just a family, a village, " +
        "and grief. I called my mother right after watching it.",
      createdAt: now,
      createdAtTs: ts + 1000,
      authorType: "user",
      status: "approved",
    });

    return { seeded: true, id: String(id) };
  },
});
