import {
  getAdminStats,
  getBlogPostById,
  getBlogPosts,
  getCommentsByPostId,
  getTopPostsByViews,
  type BlogStats,
  type TopPost,
} from "@/lib/content-store";
import type { BlogComment, BlogPost, CommentStatus } from "@/lib/site-data";

export interface AdminCommentFeedItem extends BlogComment {
  postTitle?: string;
}

export interface MobileDashboardData {
  stats: BlogStats;
  recentPosts: BlogPost[];
  recentComments: AdminCommentFeedItem[];
  topPosts: TopPost[];
}

const ADMIN_COMMENT_STATUSES: CommentStatus[] = ["pending", "approved", "hidden", "spam"];

export async function getRecentComments(limit = 20): Promise<AdminCommentFeedItem[]> {
  const posts = await getBlogPosts({ includeDrafts: true });
  const commentsByPost = await Promise.all(
    posts.map(async (post) => {
      const comments = await getCommentsByPostId(post.id, {
        includeStatuses: ADMIN_COMMENT_STATUSES,
      });
      return comments.map((comment) => ({
        ...comment,
        postTitle: post.title,
      }));
    }),
  );

  return commentsByPost
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getMobileDashboardData(): Promise<MobileDashboardData> {
  const [stats, posts, recentComments, topPosts] = await Promise.all([
    getAdminStats(),
    getBlogPosts({ includeDrafts: true }),
    getRecentComments(8),
    getTopPostsByViews(5),
  ]);

  return {
    stats,
    recentPosts: posts.slice(0, 6),
    recentComments,
    topPosts,
  };
}

export async function getPostTitle(postId: string): Promise<string | undefined> {
  const post = await getBlogPostById(postId);
  return post?.title;
}
