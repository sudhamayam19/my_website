"use client";

import { useState } from "react";
import { CommentForm } from "@/components/CommentForm";
import { formatRelativeTime, type BlogComment } from "@/lib/site-data";

async function likeCommentApi(id: string): Promise<number> {
  const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
  const data = (await res.json()) as { likes?: number };
  return data.likes ?? 0;
}

interface CommentsSectionProps {
  postId: string;
  initialComments: BlogComment[];
}

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>(initialComments);
  const [likingId, setLikingId] = useState<string | null>(null);

  const handleCommentAdded = (comment: BlogComment) => {
    setComments((current) => [comment, ...current]);
  };

  const handleLike = async (id: string) => {
    if (likingId === id) return;
    setLikingId(id);
    const likes = await likeCommentApi(id).catch(() => null);
    if (likes !== null) {
      setComments((current) =>
        current.map((c) => (c.id === id ? { ...c, likes } : c)),
      );
    }
    setLikingId(null);
  };

  const topLevel = comments
    .filter((c) => !c.parentId)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const replies = comments.filter((c) => !!c.parentId);

  return (
    <section className="mt-12 border-t border-[#d8c8b0] pt-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h3 className="display-font text-3xl font-bold text-[#1f2d39]">
          Comments ({topLevel.length})
        </h3>
      </div>

      <div className="space-y-4">
        {topLevel.length ? (
          topLevel.map((comment) => {
            const commentReplies = replies.filter((r) => r.parentId === comment.id);
            return (
              <div key={comment.id}>
                <article
                  className={`rounded-2xl border p-5 ${
                    comment.highlighted
                      ? "border-[#c8a84b] bg-[#fffbec]"
                      : "border-[#d7c6ae] bg-[#fdf8ef]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {comment.pinned && (
                      <span className="text-xs font-bold text-[#2a6670]">📌 Pinned</span>
                    )}
                    {comment.highlighted && (
                      <span className="rounded-full bg-[#c8a84b] px-2 py-0.5 text-xs font-bold text-white">
                        ★ Featured
                      </span>
                    )}
                    <p className="font-semibold text-[#1e2f3c]">{comment.author}</p>
                    <p className="text-[#60717b]">{formatRelativeTime(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#445963]">{comment.message}</p>
                  <button
                    type="button"
                    onClick={() => void handleLike(comment.id)}
                    disabled={likingId === comment.id}
                    className="mt-3 flex items-center gap-1 text-xs text-[#5f6f79] transition hover:text-[#2a6670] disabled:opacity-50"
                  >
                    ♥ {comment.likes ?? 0}
                  </button>
                </article>
                {commentReplies.map((reply) => (
                  <div key={reply.id} className="ml-6 mt-2">
                    <article className="rounded-2xl border border-[#c1d9d8] bg-[#edf7f6] p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <p className="font-semibold text-[#1f2d39]">{reply.author}</p>
                        {reply.authorType === "admin" && (
                          <span className="rounded-full bg-[#1f6973] px-2 py-0.5 text-xs font-bold text-white">
                            Author
                          </span>
                        )}
                        <p className="text-[#60717b]">{formatRelativeTime(reply.createdAt)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#445963]">{reply.message}</p>
                    </article>
                  </div>
                ))}
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-[#c9b497] bg-[#fdf8ef] px-4 py-5 text-sm text-[#50616d]">
            No comments yet. Be the first to comment.
          </p>
        )}
      </div>

      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
    </section>
  );
}
