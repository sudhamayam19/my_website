"use client";

import { useState } from "react";
import { CommentForm } from "@/components/CommentForm";
import { formatRelativeTime, type BlogComment } from "@/lib/site-data";

interface CommentsSectionProps {
  postId: string;
  initialComments: BlogComment[];
}

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>(initialComments);

  const handleCommentAdded = (comment: BlogComment) => {
    setComments((current) => [comment, ...current]);
  };

  const topLevel = comments.filter((comment) => !comment.parentId);
  const replies = comments.filter((comment) => !!comment.parentId);

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
            const commentReplies = replies.filter((reply) => reply.parentId === comment.id);
            return (
              <div key={comment.id}>
                <article className="rounded-2xl border border-[#d7c6ae] bg-[#fdf8ef] p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <p className="font-semibold text-[#1e2f3c]">{comment.author}</p>
                    <p className="text-[#60717b]">{formatRelativeTime(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#445963]">{comment.message}</p>
                </article>

                {commentReplies.map((reply) => (
                  <div key={reply.id} className="ml-6 mt-2">
                    <article className="rounded-2xl border border-[#c1d9d8] bg-[#edf7f6] p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <p className="font-semibold text-[#1f2d39]">{reply.author}</p>
                        {reply.authorType === "admin" ? (
                          <span className="rounded-full bg-[#1f6973] px-2 py-0.5 text-xs font-bold text-white">
                            Author
                          </span>
                        ) : null}
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
