import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthGuard } from "@/components/auth-guard";
import { PostPreview } from "@/components/post-preview";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { deletePost, fetchPosts, savePost, uploadImage, type MobilePost } from "@/lib/mobile-api";

const PUBLIC_SITE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "https://sudhamayam.vercel.app").replace(/\/$/, "");

type PostFilter = "all" | "published" | "draft" | "featured";
type SelectionRange = { start: number; end: number };

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

function todayString() {
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
    coverGradient: post?.coverGradient ?? "from-[#1f6a6d] to-[#4ea59e]",
    coverImageUrl: post?.coverImageUrl,
    seoDescription: post?.seoDescription ?? post?.excerpt ?? "",
    contentInput: post?.content.join("\n\n") ?? "",
  };
}

function replaceSelection(value: string, selection: SelectionRange, replacement: string) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const text = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
  const cursor = start + replacement.length;
  return { text, selection: { start: cursor, end: cursor } };
}

function wrapSelection(value: string, selection: SelectionRange, prefix: string, suffix: string, placeholder: string) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const selected = value.slice(start, end) || placeholder;
  return replaceSelection(value, selection, `${prefix}${selected}${suffix}`);
}

function prefixLines(value: string, selection: SelectionRange, formatter: (line: string, index: number) => string, fallback: string[]) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const selected = value.slice(start, end).trim().length > 0 ? value.slice(start, end) : fallback.join("\n");
  const replacement = selected.split("\n").map((line, index) => formatter(line.trim() || fallback[index] || "Text", index)).join("\n");
  return replaceSelection(value, selection, replacement);
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searchText, setSearchText] = useState("");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(toDraft());
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contentSelection, setContentSelection] = useState<SelectionRange>({ start: 0, end: 0 });

  const loadPosts = () => {
    setLoading(true);
    fetchPosts()
      .then((items) => setPosts([...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return posts.filter((post) => {
      if (postFilter === "published" && post.status !== "published") return false;
      if (postFilter === "draft" && post.status !== "draft") return false;
      if (postFilter === "featured" && !post.featured) return false;
      if (!query) return true;
      return [post.title, post.excerpt, post.category].join(" ").toLowerCase().includes(query);
    });
  }, [posts, postFilter, searchText]);

  const previewPost = useMemo<MobilePost>(() => ({
    id: draft.id ?? "preview",
    slug: "preview",
    title: draft.title,
    excerpt: draft.excerpt,
    content: draft.contentInput.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean),
    category: draft.category,
    publishedAt: draft.publishedAt,
    readTimeMinutes: Number(draft.readTimeMinutes) || 5,
    coverGradient: draft.coverGradient,
    coverImageUrl: draft.coverImageUrl,
    status: draft.status,
    featured: draft.featured,
    seoDescription: draft.seoDescription,
  }), [draft]);

  const openPost = (post?: MobilePost) => {
    const nextDraft = toDraft(post);
    setDraft(nextDraft);
    const cursor = nextDraft.contentInput.length;
    setContentSelection({ start: cursor, end: cursor });
    setFeedback("");
    setIsModalOpen(true);
  };

  const applyEditor = (fn: (value: string, selection: SelectionRange) => { text: string; selection: SelectionRange }) => {
    const result = fn(draft.contentInput, contentSelection);
    setDraft((current) => ({ ...current, contentInput: result.text }));
    setContentSelection(result.selection);
  };

  const sharePost = async (post: MobilePost) => {
    const url = `${PUBLIC_SITE_URL}/blog/${post.id}`;
    await Share.share({ title: post.title, message: url, url });
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUploadingImage(true);
      const asset = result.assets[0];
      const url = await uploadImage(asset.uri, asset.fileName ?? `cover-${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg");
      setDraft((current) => ({ ...current, coverImageUrl: url }));
      setFeedback("Cover image uploaded.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const insertArticleImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUploadingImage(true);
      const asset = result.assets[0];
      const url = await uploadImage(asset.uri, asset.fileName ?? `article-${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg");
      applyEditor((value, selection) => replaceSelection(value, selection, `\n\n![Article image](${url})\n\n`));
      setFeedback("Article image inserted.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const runSave = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      const content = draft.contentInput.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
      const result = await savePost({
        id: draft.id,
        title: draft.title,
        excerpt: draft.excerpt,
        category: draft.category,
        publishedAt: draft.publishedAt,
        readTimeMinutes: Number(draft.readTimeMinutes) || 5,
        status,
        featured: draft.featured,
        coverGradient: draft.coverGradient,
        coverImageUrl: draft.coverImageUrl,
        seoDescription: draft.seoDescription || draft.excerpt,
        content,
      });
      setDraft((current) => ({ ...current, id: result.id, status }));
      setFeedback(status === "published" ? "Post published." : "Draft saved.");
      setIsModalOpen(false);
      loadPosts();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  };

  const confirmPublish = () => {
    Alert.alert("Publish this post?", "This will make the article live on the website.", [
      { text: "Cancel", style: "cancel" },
      { text: "Publish", onPress: () => void runSave("published") },
    ]);
  };

  const confirmDelete = () => {
    if (!draft.id) return;
    Alert.alert("Delete post", "Delete this post and its comments permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);
            await deletePost(draft.id!);
            setIsModalOpen(false);
            setFeedback("Post deleted.");
            loadPosts();
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : "Unable to delete post.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const filters: PostFilter[] = ["all", "published", "draft", "featured"];
  const toolbar = [
    { label: "B", press: () => applyEditor((v, s) => wrapSelection(v, s, "**", "**", "bold text")) },
    { label: "I", press: () => applyEditor((v, s) => wrapSelection(v, s, "*", "*", "italic text")) },
    { label: "U", press: () => applyEditor((v, s) => wrapSelection(v, s, "<u>", "</u>", "underlined text")) },
    { label: "H1", press: () => applyEditor((v, s) => prefixLines(v, s, (line) => `# ${line}`, ["Heading"])) },
    { label: "H2", press: () => applyEditor((v, s) => prefixLines(v, s, (line) => `## ${line}`, ["Subheading"])) },
    { label: "List", press: () => applyEditor((v, s) => prefixLines(v, s, (line) => `- ${line}`, ["List item"])) },
    { label: "1.", press: () => applyEditor((v, s) => prefixLines(v, s, (line, i) => `${i + 1}. ${line}`, ["First item", "Second item"])) },
    { label: "Quote", press: () => applyEditor((v, s) => prefixLines(v, s, (line) => `> ${line}`, ["Quoted text"])) },
    { label: "Link", press: () => applyEditor((v, s) => wrapSelection(v, s, "[", "](https://example.com)", "Link text")) },
  ];

  return (
    <AuthGuard>
      <AdminScreen eyebrow="Posts" title="Write on the go" subtitle="Search, edit, preview, publish, and delete posts from the phone." aside={<Pressable style={styles.primaryButton} onPress={() => openPost()}><Text style={styles.primaryButtonText}>New Post</Text></Pressable>}>
        <Card title="Find posts">
          <TextInput value={searchText} onChangeText={setSearchText} style={styles.input} placeholder="Search posts" placeholderTextColor="#8a989c" />
          <View style={styles.row}>{filters.map((filter) => <Pressable key={filter} style={[styles.chip, postFilter === filter ? styles.chipActive : null]} onPress={() => setPostFilter(filter)}><Text style={[styles.chipText, postFilter === filter ? styles.chipTextActive : null]}>{filter}</Text></Pressable>)}</View>
        </Card>

        <Card title="Posts">
          {loading ? <View style={styles.center}><ActivityIndicator color="#1f6973" /></View> : error ? <Text style={styles.error}>{error}</Text> : filteredPosts.map((post) => (
            <Pressable key={post.id} style={styles.postCard} onPress={() => openPost(post)}>
              <View style={styles.postRow}>
                {post.coverImageUrl ? <Image source={{ uri: post.coverImageUrl }} style={styles.thumb} alt={`${post.title} cover`} /> : <View style={styles.thumbPlaceholder}><Ionicons name="image-outline" size={22} color="#61747d" /></View>}
                <View style={styles.flex}>
                  <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                  <Text style={styles.postExcerpt} numberOfLines={2}>{post.excerpt}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Pill label={post.category} />
                <Pill label={post.status} tone={post.status === "published" ? "teal" : "neutral"} />
                {post.featured ? <Pill label="Featured" tone="clay" /> : null}
              </View>
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); void sharePost(post); }}><Text style={styles.secondaryText}>Share</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); openPost(post); }}><Text style={styles.secondaryText}>Edit</Text></Pressable>
              </View>
            </Pressable>
          ))}
        </Card>

        <Modal visible={isModalOpen} animationType="slide">
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <View style={styles.postRow}>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>{draft.id ? "Edit post" : "New post"}</Text>
                <Text style={styles.helperText}>Save as draft or publish when ready.</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setIsModalOpen(false)}><Ionicons name="close" size={22} color="#19313b" /></Pressable>
            </View>

            <Card title="Basics">
              <TextInput style={styles.input} placeholder="Title" value={draft.title} onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))} />
              <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Excerpt" value={draft.excerpt} onChangeText={(value) => setDraft((current) => ({ ...current, excerpt: value }))} />
              <TextInput style={styles.input} placeholder="Category" value={draft.category} onChangeText={(value) => setDraft((current) => ({ ...current, category: value }))} />
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.flex]} placeholder="YYYY-MM-DD" value={draft.publishedAt} onChangeText={(value) => setDraft((current) => ({ ...current, publishedAt: value }))} />
                <TextInput style={[styles.input, styles.flex]} placeholder="Read time" keyboardType="number-pad" value={draft.readTimeMinutes} onChangeText={(value) => setDraft((current) => ({ ...current, readTimeMinutes: value }))} />
              </View>
              <TextInput style={styles.input} placeholder="SEO description" value={draft.seoDescription} onChangeText={(value) => setDraft((current) => ({ ...current, seoDescription: value }))} />
            </Card>

            <Card title="Publish settings">
              <View style={styles.row}><Pill label={draft.status} tone={draft.status === "published" ? "teal" : "neutral"} /><Text style={styles.helperText}>Use the buttons below for a safer publish flow.</Text></View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Featured</Text>
                <Switch value={draft.featured} onValueChange={(value) => setDraft((current) => ({ ...current, featured: value }))} />
              </View>
            </Card>

            <Card title="Cover and article">
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={pickCover} disabled={uploadingImage}><Text style={styles.secondaryText}>{uploadingImage ? "Uploading..." : "Upload Cover"}</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => void insertArticleImage()} disabled={uploadingImage}><Text style={styles.secondaryText}>Insert Image</Text></Pressable>
              </View>
              {draft.coverImageUrl ? <Image source={{ uri: draft.coverImageUrl }} style={styles.coverPreview} alt="Cover preview" /> : null}
            </Card>

            <Card title="Rich editor">
              <View style={styles.row}>{toolbar.map((item) => <Pressable key={item.label} style={styles.toolButton} onPress={item.press}><Text style={styles.toolText}>{item.label}</Text></Pressable>)}</View>
              <TextInput
                style={[styles.input, styles.contentArea]}
                multiline
                placeholder="Write the article here. Leave blank lines between sections."
                value={draft.contentInput}
                onChangeText={(value) => setDraft((current) => ({ ...current, contentInput: value }))}
                selection={contentSelection}
                onSelectionChange={(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => setContentSelection(event.nativeEvent.selection)}
              />
            </Card>

            <Card title="Public preview"><PostPreview post={previewPost} /></Card>

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            {draft.id ? <Pressable style={styles.deleteButton} onPress={confirmDelete}><Text style={styles.deleteText}>Delete Post</Text></Pressable> : null}
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={() => void runSave("draft")} disabled={saving}><Text style={styles.secondaryText}>{saving ? "Saving..." : "Save Draft"}</Text></Pressable>
              <Pressable style={styles.primaryAction} onPress={confirmPublish} disabled={saving}><Text style={styles.primaryActionText}>{saving ? "Saving..." : "Publish"}</Text></Pressable>
            </View>
          </ScrollView>
        </Modal>
      </AdminScreen>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  primaryButton: { backgroundColor: "#1f6973", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: "#fffef9", fontWeight: "800", fontSize: 13 },
  primaryAction: { flex: 1, backgroundColor: "#b85c44", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  primaryActionText: { color: "#fffef9", fontWeight: "900" },
  secondaryButton: { borderRadius: 16, backgroundColor: "#efe2cf", paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  secondaryText: { color: "#19313b", fontWeight: "800" },
  deleteButton: { borderRadius: 16, backgroundColor: "#f8e7e3", borderWidth: 1, borderColor: "#c98e83", paddingVertical: 14, alignItems: "center" },
  deleteText: { color: "#9a4335", fontWeight: "900" },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#efe2cf" },
  center: { paddingVertical: 30, alignItems: "center" },
  error: { color: "#b42318", fontSize: 14 },
  modal: { flex: 1, backgroundColor: "#f7efe4" },
  modalContent: { padding: 18, paddingTop: 50, paddingBottom: 120, gap: 14 },
  sectionTitle: { color: "#19313b", fontSize: 26, fontWeight: "900" },
  helperText: { color: "#61747d", fontSize: 13, lineHeight: 18 },
  input: { backgroundColor: "#fffaf3", borderColor: "#dcc6a5", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, color: "#19313b", fontSize: 15 },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  contentArea: { minHeight: 220, textAlignVertical: "top" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#304b57", fontWeight: "700", fontSize: 15 },
  chip: { borderRadius: 999, backgroundColor: "#efe2cf", paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: "#1f6973" },
  chipText: { color: "#6f5c46", fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  chipTextActive: { color: "#fffef9" },
  postCard: { backgroundColor: "#f7efe4", borderRadius: 22, padding: 14, gap: 12 },
  postRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#efe2cf" },
  thumbPlaceholder: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#efe2cf" },
  flex: { flex: 1 },
  postTitle: { color: "#19313b", fontSize: 16, fontWeight: "800" },
  postExcerpt: { color: "#61747d", fontSize: 13, lineHeight: 18, marginTop: 4 },
  toolButton: { borderRadius: 12, backgroundColor: "#efe2cf", paddingHorizontal: 12, paddingVertical: 10, minWidth: 44, alignItems: "center" },
  toolText: { color: "#19313b", fontWeight: "800", fontSize: 12 },
  coverPreview: { width: "100%", height: 180, borderRadius: 18, backgroundColor: "#efe2cf" },
  feedback: { color: "#42555d", fontSize: 14, backgroundColor: "#fffaf3", borderWidth: 1, borderColor: "#dcc6a5", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
});
