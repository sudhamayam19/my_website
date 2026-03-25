import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthGuard } from "@/components/auth-guard";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { fetchComments, type MobileComment } from "@/lib/mobile-api";

export default function CommentsScreen() {
  const [comments, setComments] = useState<MobileComment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments()
      .then(setComments)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load comments."))
      .finally(() => setLoading(false));
  }, []);

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
                    <Text style={styles.author}>{comment.author}</Text>
                    <Pill label={new Date(comment.createdAt).toLocaleDateString()} tone="teal" />
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
});
