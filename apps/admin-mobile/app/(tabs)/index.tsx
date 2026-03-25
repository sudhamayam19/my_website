import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthGuard } from "@/components/auth-guard";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { fetchDashboard, type MobileDashboardResponse } from "@/lib/mobile-api";

export default function HomeScreen() {
  const [data, setData] = useState<MobileDashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <AdminScreen
        eyebrow="Mobile Admin"
        title="Quick control room"
        subtitle="Live website stats, recent posts, and fresh comments tuned for a phone-first workflow."
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#1f6973" />
          </View>
        ) : error ? (
          <Card title="Unable to load" description={error} />
        ) : data ? (
          <>
            <Card title="Site snapshot">
              <View style={styles.statRow}>
                <View style={styles.statTile}>
                  <Pill label="Posts" />
                  <Text style={styles.statValue}>{data.stats.totalPosts}</Text>
                </View>
                <View style={styles.statTile}>
                  <Pill label="Published" tone="teal" />
                  <Text style={styles.statValue}>{data.stats.publishedPosts}</Text>
                </View>
                <View style={styles.statTile}>
                  <Pill label="Comments" tone="clay" />
                  <Text style={styles.statValue}>{data.stats.totalComments}</Text>
                </View>
              </View>
            </Card>
            <Card title="Recent posts">
              <View style={styles.stack}>
                {data.recentPosts.map((post) => (
                  <View key={post.id} style={styles.item}>
                    <View style={styles.copy}>
                      <Text style={styles.itemTitle}>{post.title}</Text>
                      <Text style={styles.itemMeta}>{post.category}</Text>
                    </View>
                    <Pill label={post.status} tone={post.status === "published" ? "teal" : "neutral"} />
                  </View>
                ))}
              </View>
            </Card>
            <Card title="Latest comments">
              <View style={styles.stack}>
                {data.recentComments.map((comment) => (
                  <View key={comment.id} style={styles.comment}>
                    <Text style={styles.commentTitle}>
                      {comment.author} on {comment.postTitle || "Post"}
                    </Text>
                    <Text style={styles.commentText}>{comment.message}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}
      </AdminScreen>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 30,
    alignItems: "center",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    minWidth: 92,
    flexGrow: 1,
    backgroundColor: "#f7efe4",
    padding: 14,
    borderRadius: 18,
    gap: 10,
  },
  statValue: {
    color: "#19313b",
    fontSize: 26,
    fontWeight: "900",
  },
  stack: {
    gap: 12,
  },
  item: {
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: "#19313b",
    fontWeight: "800",
    fontSize: 15,
  },
  itemMeta: {
    color: "#61747d",
    fontSize: 13,
  },
  comment: {
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  commentTitle: {
    color: "#19313b",
    fontWeight: "800",
    fontSize: 14,
  },
  commentText: {
    color: "#445760",
    fontSize: 14,
    lineHeight: 20,
  },
});
