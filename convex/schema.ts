import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.array(v.string()),
    category: v.string(),
    publishedAt: v.string(),
    publishedAtTs: v.number(),
    readTimeMinutes: v.number(),
    coverGradient: v.string(),
    status: v.union(v.literal("published"), v.literal("draft")),
    featured: v.boolean(),
    seoDescription: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_publishedAtTs", ["status", "publishedAtTs"])
    .index("by_featured_publishedAtTs", ["featured", "publishedAtTs"]),

  comments: defineTable({
    postId: v.id("posts"),
    author: v.string(),
    message: v.string(),
    createdAt: v.string(),
    createdAtTs: v.number(),
  }).index("by_postId_createdAtTs", ["postId", "createdAtTs"]),

  newsletterSubscribers: defineTable({
    email: v.string(),
    createdAt: v.string(),
  }).index("by_email", ["email"]),
});
