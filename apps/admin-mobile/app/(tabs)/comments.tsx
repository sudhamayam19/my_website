import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthGuard } from "@/components/auth-guard";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { deleteComment, fetchComments, type MobileComment } from "@/lib/mobile-api";

const INVALID_COMMENT_ID_MESSAGE =
  "This comment is not stored in the live database yet, so it cannot be deleted.";

function isLikelyPersistentCommentId(id: string): boolean {
  return /^[a-z0-9]{10,}$/i.test(id.trim());
}

export default function CommentsScreen() {
  const [comments, setComments] = useState<MobileComment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = () => {
    fetchComments()
      .then(setComments)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load comments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadComments();
  }, []);

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

  return (
    <AuthGuard>
      <AdminScreen
        eyebrow="Comments"
        title="Latest replies"
        subtitle="A clean mobile feed of live comments from the website."
      >
        <Card title="Comment feed">
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#1f6973" />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.stack}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.author}>{comment.author}</Text>
                      <Pill label={new Date(comment.createdAt).toLocaleDateString()} tone="teal" />
                    </View>
                    <Pressable style={styles.deleteButton} onPress={() => handleDelete(comment)}>
                      {deletingId === comment.id ? (
                        <ActivityIndicator size="small" color="#9a4335" />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color="#9a4335" />
                      )}
                    </Pressable>
                  </View>
                  <Text style={styles.postTitle}>{comment.postTitle || "Blog post"}</Text>
                  <Text style={styles.message}>{comment.message}</Text>
                </View>
              ))}
            </View>
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
  stack: {
    gap: 12,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f7ddd7",
    alignItems: "center",
    justifyContent: "center",
  },
});
