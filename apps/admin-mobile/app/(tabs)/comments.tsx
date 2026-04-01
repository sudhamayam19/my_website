import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { AuthGuard } from "@/components/auth-guard";
import { AdminScreen, Card, Pill } from "@/components/screen";
import {
  deleteComment,
  fetchComments,
  replyToComment,
  type MobileComment,
  type MobileCommentStatus,
  updateCommentStatus,
} from "@/lib/mobile-api";

const INVALID_COMMENT_ID_MESSAGE =
  "This comment is not stored in the live database yet, so it cannot be deleted.";

const statusFilters: Array<{ label: string; value: "all" | MobileCommentStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Hidden", value: "hidden" },
  { label: "Spam", value: "spam" },
];

function isLikelyPersistentCommentId(id: string): boolean {
  return /^[a-z0-9]{10,}$/i.test(id.trim());
}

function getStatusTone(status: MobileCommentStatus): "neutral" | "teal" | "clay" {
  if (status === "approved") {
    return "teal";
  }

  if (status === "pending") {
    return "clay";
  }

  return "neutral";
}

export default function CommentsScreen() {
  const [comments, setComments] = useState<MobileComment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MobileCommentStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadComments = (silent = false) => {
    if (!silent) setLoading(true);
    fetchComments()
      .then(setComments)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load comments."))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadComments(true);
  };

  useEffect(() => {
    loadComments();
    intervalRef.current = setInterval(() => loadComments(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredComments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return comments.filter((comment) => {
      if (statusFilter !== "all" && comment.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [comment.author, comment.message, comment.postTitle || ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [comments, searchText, statusFilter]);

  const counts = useMemo(
    () => ({
      total: comments.length,
      pending: comments.filter((comment) => comment.status === "pending").length,
      approved: comments.filter((comment) => comment.status === "approved").length,
    }),
    [comments],
  );

  const handleDelete = (comment: MobileComment) => {
    if (!isLikelyPersistentCommentId(comment.id)) {
      setError(INVALID_COMMENT_ID_MESSAGE);
      return;
    }

    Alert.alert(
      "Delete comment",
      `Delete ${comment.author}'s comment?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(comment.id);
              await deleteComment(comment.id);
              setComments((current) => current.filter((item) => item.id !== comment.id));
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Unable to delete comment.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleStatusChange = async (comment: MobileComment, nextStatus: MobileCommentStatus) => {
    if (!isLikelyPersistentCommentId(comment.id)) {
      setError(INVALID_COMMENT_ID_MESSAGE);
      return;
    }

    try {
      setChangingId(comment.id);
      await updateCommentStatus(comment.id, nextStatus);
      setComments((current) =>
        current.map((item) => (item.id === comment.id ? { ...item, status: nextStatus } : item)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update comment.");
    } finally {
      setChangingId(null);
    }
  };

  const handleReplySubmit = async (comment: MobileComment) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const reply = await replyToComment(comment.id, comment.postId, replyText.trim());
      setComments((current) => [...current, reply]);
      setReplyText("");
      setReplyingToId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <AuthGuard>
      <AdminScreen
        eyebrow="Comments"
        title="Latest replies"
        subtitle="Review, approve, hide, or mark comments as spam without leaving the phone."
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1f6973" />
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        <Card title="Moderation queue" description="Search by author, post title, or message.">
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            placeholder="Search comments"
            placeholderTextColor="#8a989c"
          />
          <View style={styles.filterRow}>
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  style={[styles.filterChip, active ? styles.filterChipActive : null]}
                  onPress={() => setStatusFilter(filter.value)}
                >
                  <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title="Comment feed">
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#1f6973" />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : filteredComments.length ? (
            <View style={styles.stack}>
              {filteredComments.map((comment) => {
                const busy = deletingId === comment.id || changingId === comment.id;
                return (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.row}>
                      <View style={styles.rowLeft}>
                        <Text style={styles.author}>{comment.author}</Text>
                        <Pill label={new Date(comment.createdAt).toLocaleDateString()} tone="teal" />
                        <Pill label={comment.status} tone={getStatusTone(comment.status)} />
                      </View>
                      {busy ? <ActivityIndicator size="small" color="#9a4335" /> : null}
                    </View>
                    <Text style={styles.postTitle}>{comment.postTitle || "Blog post"}</Text>
                    <Text style={styles.message}>{comment.message}</Text>
                    <View style={styles.actionRow}>
                      {comment.status !== "approved" ? (
                        <Pressable
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => void handleStatusChange(comment, "approved")}
                        >
                          <Text style={styles.approveText}>Approve</Text>
                        </Pressable>
                      ) : null}
                      {comment.status !== "hidden" ? (
                        <Pressable
                          style={[styles.actionButton, styles.secondaryAction]}
                          onPress={() => void handleStatusChange(comment, "hidden")}
                        >
                          <Text style={styles.secondaryActionText}>Hide</Text>
                        </Pressable>
                      ) : null}
                      {comment.status !== "spam" ? (
                        <Pressable
                          style={[styles.actionButton, styles.secondaryAction]}
                          onPress={() => void handleStatusChange(comment, "spam")}
                        >
                          <Text style={styles.secondaryActionText}>Spam</Text>
                        </Pressable>
                      ) : null}
                      {!comment.parentId ? (
                        <Pressable
                          style={[styles.actionButton, styles.replyButton]}
                          onPress={() => {
                            setReplyingToId(replyingToId === comment.id ? null : comment.id);
                            setReplyText("");
                          }}
                        >
                          <Text style={styles.replyText}>Reply</Text>
                        </Pressable>
                      ) : null}
                      <Pressable style={styles.deleteButton} onPress={() => handleDelete(comment)}>
                        <Ionicons name="trash-outline" size={18} color="#9a4335" />
                      </Pressable>
                    </View>
                    {replyingToId === comment.id ? (
                      <View style={styles.replyBox}>
                        <TextInput
                          value={replyText}
                          onChangeText={setReplyText}
                          placeholder="Write your reply..."
                          placeholderTextColor="#8a989c"
                          multiline
                          style={styles.replyInput}
                        />
                        <View style={styles.replyActions}>
                          <Pressable
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => void handleReplySubmit(comment)}
                            disabled={submittingReply || !replyText.trim()}
                          >
                            <Text style={styles.approveText}>
                              {submittingReply ? "Posting..." : "Post Reply"}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[styles.actionButton, styles.secondaryAction]}
                            onPress={() => { setReplyingToId(null); setReplyText(""); }}
                          >
                            <Text style={styles.secondaryActionText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyState}>No comments match this filter right now.</Text>
          )}
        </Card>
      </AdminScreen>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 28,
    alignItems: "center",
  },
  error: {
    color: "#b42318",
    fontSize: 14,
  },
  emptyState: {
    color: "#61747d",
    fontSize: 14,
  },
  stack: {
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fffaf3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dcc6a5",
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 4,
  },
  statValue: {
    color: "#19313b",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#61747d",
    fontSize: 13,
    fontWeight: "700",
  },
  searchInput: {
    backgroundColor: "#f7efe4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcc6a5",
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#19313b",
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: "#efe2cf",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#1f6973",
  },
  filterChipText: {
    color: "#6f5c46",
    fontSize: 12,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: "#fffef9",
  },
  commentCard: {
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    flex: 1,
  },
  author: {
    color: "#19313b",
    fontWeight: "800",
    fontSize: 16,
  },
  postTitle: {
    color: "#1f6973",
    fontWeight: "700",
    fontSize: 13,
  },
  message: {
    color: "#445760",
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  approveButton: {
    backgroundColor: "#d9ece8",
  },
  approveText: {
    color: "#1f6973",
    fontWeight: "800",
    fontSize: 12,
  },
  secondaryAction: {
    backgroundColor: "#efe2cf",
  },
  secondaryActionText: {
    color: "#5f6f79",
    fontWeight: "800",
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f7ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
  replyButton: {
    backgroundColor: "#d9ece8",
  },
  replyText: {
    color: "#1f6973",
    fontWeight: "800",
    fontSize: 12,
  },
  replyBox: {
    marginTop: 8,
    gap: 8,
  },
  replyInput: {
    backgroundColor: "#f0fafa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#b5cfd1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#19313b",
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  replyActions: {
    flexDirection: "row",
    gap: 8,
  },
});
