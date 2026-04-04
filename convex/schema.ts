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
    coverImageUrl: v.optional(v.string()),
    status: v.union(v.literal("published"), v.literal("draft")),
    featured: v.boolean(),
    seoDescription: v.string(),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
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
    status: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("pending"),
        v.literal("hidden"),
        v.literal("spam"),
      ),
    ),
    parentId: v.optional(v.id("comments")),
    authorType: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    likes: v.optional(v.number()),
    pinned: v.optional(v.boolean()),
    highlighted: v.optional(v.boolean()),
  }).index("by_postId_createdAtTs", ["postId", "createdAtTs"]),

  adminDeviceTokens: defineTable({
    token: v.string(),
    platform: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_token", ["token"]),

  newsletterSubscribers: defineTable({
    email: v.string(),
    createdAt: v.string(),
  }).index("by_email", ["email"]),
});
