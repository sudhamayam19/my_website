import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthGuard } from "@/components/auth-guard";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { fetchPosts, savePost, uploadImage, type MobilePost } from "@/lib/mobile-api";

const gradientOptions = [
  "from-[#1f6a6d] to-[#4ea59e]",
  "from-[#9e3d2d] to-[#d38d59]",
  "from-[#7d6a33] to-[#bfad67]",
  "from-[#2f4f77] to-[#4f7ea8]",
];

interface PostDraft {
  id?: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: string;
  status: "draft" | "published";
  featured: boolean;
  coverGradient: string;
  coverImageUrl?: string;
  seoDescription: string;
  contentInput: string;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDraft(post?: MobilePost): PostDraft {
  return {
    id: post?.id,
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    category: post?.category ?? "Voice Acting",
    publishedAt: post?.publishedAt ?? todayString(),
    readTimeMinutes: String(post?.readTimeMinutes ?? 5),
    status: post?.status ?? "draft",
    featured: post?.featured ?? false,
    coverGradient: post?.coverGradient ?? gradientOptions[0],
    coverImageUrl: post?.coverImageUrl,
    seoDescription: post?.seoDescription ?? post?.excerpt ?? "",
    contentInput: post?.content.join("\n\n") ?? "",
  };
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(toDraft());
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadPosts = () => {
    setLoading(true);
    setError("");
    fetchPosts()
      .then((items) =>
        setPosts(
          [...items].sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          ),
        ),
      )
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const previewBlocks = useMemo(() => {
    return draft.contentInput
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 2);
  }, [draft.contentInput]);

  const openNewPost = () => {
    setDraft(toDraft());
    setFeedback("");
    setIsModalOpen(true);
  };

  const openEditPost = (post: MobilePost) => {
    setDraft(toDraft(post));
    setFeedback("");
    setIsModalOpen(true);
  };

  const handlePickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    try {
      setUploadingImage(true);
      setFeedback("Uploading cover image...");
      const url = await uploadImage(
        asset.uri,
        asset.fileName ?? `cover-${Date.now()}.jpg`,
        asset.mimeType ?? "image/jpeg",
      );
      setDraft((current) => ({ ...current, coverImageUrl: url }));
      setFeedback("Cover image uploaded.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    try {
      const content = draft.contentInput
        .split(/\n{2,}/)
        .map((value) => value.trim())
        .filter(Boolean);

      const result = await savePost({
        id: draft.id,
        title: draft.title,
        excerpt: draft.excerpt,
        category: draft.category,
        publishedAt: draft.publishedAt,
        readTimeMinutes: Number(draft.readTimeMinutes) || 5,
        status: draft.status,
        featured: draft.featured,
        coverGradient: draft.coverGradient,
        coverImageUrl: draft.coverImageUrl,
        seoDescription: draft.seoDescription || draft.excerpt,
        content,
      });

      setFeedback(draft.id ? "Post updated." : "Post created.");
      setIsModalOpen(false);
      setDraft((current) => ({ ...current, id: result.id }));
      loadPosts();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <AdminScreen
        eyebrow="Posts"
        title="Write on the go"
        subtitle="Live drafts and published posts from the website, with a simplified mobile editor."
        aside={
          <Pressable style={styles.primaryButton} onPress={openNewPost}>
            <Text style={styles.primaryButtonText}>New Post</Text>
          </Pressable>
        }
      >
        <Card title="Posts">
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#1f6973" />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.stack}>
              {posts.map((post) => (
                <Pressable key={post.id} style={styles.postItem} onPress={() => openEditPost(post)}>
                  <View style={styles.postCopy}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postMeta}>
                      {post.category} | {post.publishedAt}
                    </Text>
                  </View>
                  <Pill label={post.status} tone={post.status === "published" ? "teal" : "neutral"} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Modal visible={isModalOpen} animationType="slide">
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{draft.id ? "Edit Post" : "New Post"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={draft.title}
              onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              placeholder="Excerpt"
              value={draft.excerpt}
              onChangeText={(value) => setDraft((current) => ({ ...current, excerpt: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={draft.category}
              onChangeText={(value) => setDraft((current) => ({ ...current, category: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Published date YYYY-MM-DD"
              value={draft.publishedAt}
              onChangeText={(value) => setDraft((current) => ({ ...current, publishedAt: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Read time"
              keyboardType="number-pad"
              value={draft.readTimeMinutes}
              onChangeText={(value) => setDraft((current) => ({ ...current, readTimeMinutes: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="SEO description"
              value={draft.seoDescription}
              onChangeText={(value) => setDraft((current) => ({ ...current, seoDescription: value }))}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Published</Text>
              <Switch
                value={draft.status === "published"}
                onValueChange={(value) =>
                  setDraft((current) => ({ ...current, status: value ? "published" : "draft" }))
                }
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Featured</Text>
              <Switch
                value={draft.featured}
                onValueChange={(value) => setDraft((current) => ({ ...current, featured: value }))}
              />
            </View>
            <Pressable style={styles.secondaryButton} onPress={handlePickCover} disabled={uploadingImage}>
              <Text style={styles.secondaryButtonText}>
                {uploadingImage ? "Uploading..." : draft.coverImageUrl ? "Change Cover" : "Upload Cover"}
              </Text>
            </Pressable>
            {draft.coverImageUrl ? (
              <Image
                source={{ uri: draft.coverImageUrl }}
                style={styles.coverPreview}
                accessibilityLabel="Cover preview"
                alt="Cover preview"
              />
            ) : null}
            <TextInput
              style={[styles.input, styles.contentArea]}
              multiline
              placeholder="Article content. Separate blocks with a blank line."
              value={draft.contentInput}
              onChangeText={(value) => setDraft((current) => ({ ...current, contentInput: value }))}
            />
            <Card title="Preview blocks">
              <View style={styles.stack}>
                {previewBlocks.map((block, index) => (
                  <Text key={`${index}-${block.slice(0, 12)}`} style={styles.previewText}>
                    {block}
                  </Text>
                ))}
              </View>
            </Card>
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fffef9" /> : <Text style={styles.saveText}>Save</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </Modal>
      </AdminScreen>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1f6973",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#fffef9",
    fontSize: 13,
    fontWeight: "800",
  },
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
  postItem: {
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  postCopy: {
    flex: 1,
    gap: 4,
  },
  postTitle: {
    color: "#19313b",
    fontSize: 16,
    fontWeight: "800",
  },
  postMeta: {
    color: "#61747d",
    fontSize: 13,
  },
  modal: {
    flex: 1,
    backgroundColor: "#f7efe4",
  },
  modalContent: {
    padding: 18,
    paddingTop: 54,
    paddingBottom: 120,
    gap: 14,
  },
  modalTitle: {
    color: "#19313b",
    fontSize: 28,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#fffaf3",
    borderColor: "#dcc6a5",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#19313b",
    fontSize: 15,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  contentArea: {
    minHeight: 200,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    color: "#304b57",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#efe2cf",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#19313b",
    fontWeight: "800",
    fontSize: 14,
  },
  coverPreview: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#efe2cf",
  },
  previewText: {
    color: "#42555d",
    fontSize: 14,
    lineHeight: 20,
  },
  feedback: {
    color: "#42555d",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#efe2cf",
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#b85c44",
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelText: {
    color: "#19313b",
    fontWeight: "800",
  },
  saveText: {
    color: "#fffef9",
    fontWeight: "900",
  },
});
