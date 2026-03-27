export function isLikelyPersistentCommentId(id: string): boolean {
  const value = id.trim();
  return /^[a-z0-9]{10,}$/i.test(value);
}

export const INVALID_COMMENT_ID_MESSAGE =
  "This comment is not stored in the live database yet, so it cannot be deleted.";
