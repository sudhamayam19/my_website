import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthGuard } from "@/components/auth-guard";
import { PostPreview } from "@/components/post-preview";
import { AdminScreen, Card, Pill } from "@/components/screen";
import {
  deletePodcastEpisode,
  deletePost,
  deleteScheduledDose,
  fetchDailyDose,
  fetchPodcastEpisodes,
  fetchPosts,
  fetchScheduledDoses,
  saveDailyDose,
  savePodcastEpisode,
  savePost,
  saveScheduledDose,
  uploadFile,
  uploadImage,
  type MobileDailyDose,
  type MobilePodcastEpisode,
  type MobilePost,
  type ScheduledDose,
} from "@/lib/mobile-api";

const SITE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "https://sudhamayam.vercel.app").replace(/\/$/, "");

type Kind = "articles" | "podcasts";
type Filter = "all" | "published" | "draft" | "featured";

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

interface PodcastDraft {
  id?: string;
  title: string;
  excerpt: string;
  description: string;
  showTitle: string;
  publishedAt: string;
  durationMinutes: string;
  audioUrl: string;
  coverImageUrl?: string;
  status: "draft" | "published";
  featured: boolean;
  seoDescription: string;
}

interface DailyDoseDraft {
  text: string;
  author: string;
  active: boolean;
  style: "scroll" | "flash";
}

const today = () => new Date().toISOString().slice(0, 10);

const toPostDraft = (post?: MobilePost): PostDraft => ({
  id: post?.id,
  title: post?.title ?? "",
  excerpt: post?.excerpt ?? "",
  category: post?.category ?? "Voice Acting",
  publishedAt: post?.publishedAt ?? today(),
  readTimeMinutes: String(post?.readTimeMinutes ?? 5),
  status: post?.status ?? "draft",
  featured: post?.featured ?? false,
  coverGradient: post?.coverGradient ?? "from-[#1f6a6d] to-[#4ea59e]",
  coverImageUrl: post?.coverImageUrl,
  seoDescription: post?.seoDescription ?? post?.excerpt ?? "",
  contentInput: post?.content.join("\n\n") ?? "",
});

const toPodcastDraft = (episode?: MobilePodcastEpisode): PodcastDraft => ({
  id: episode?.id,
  title: episode?.title ?? "",
  excerpt: episode?.excerpt ?? "",
  description: episode?.description ?? "",
  showTitle: episode?.showTitle ?? "Sudha Devarakonda Podcast",
  publishedAt: episode?.publishedAt ?? today(),
  durationMinutes: String(episode?.durationMinutes ?? 20),
  audioUrl: episode?.audioUrl ?? "",
  coverImageUrl: episode?.coverImageUrl,
  status: episode?.status ?? "draft",
  featured: episode?.featured ?? false,
  seoDescription: episode?.seoDescription ?? episode?.excerpt ?? "",
});

const toDailyDoseDraft = (dose?: MobileDailyDose): DailyDoseDraft => ({
  text: dose?.text ?? "",
  author: dose?.author ?? "",
  active: dose?.active ?? false,
  style: dose?.style ?? "scroll",
});

export default function PostsScreen() {
  const [kind, setKind] = useState<Kind>("articles");
  const [editorKind, setEditorKind] = useState<Kind>("articles");
  const [posts, setPosts] = useState<MobilePost[]>([]);
  const [episodes, setEpisodes] = useState<MobilePodcastEpisode[]>([]);
  const [dailyDose, setDailyDose] = useState<DailyDoseDraft>(toDailyDoseDraft());
  const [postDraft, setPostDraft] = useState<PostDraft>(toPostDraft());
  const [podcastDraft, setPodcastDraft] = useState<PodcastDraft>(toPodcastDraft());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingDose, setSavingDose] = useState(false);
  const [doseTab, setDoseTab] = useState<"today" | "schedule">("today");
  const [schedule, setSchedule] = useState<ScheduledDose[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ text: "", author: "", style: "scroll" as "scroll" | "flash" });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const loadContent = () => {
    setLoading(true);
    setError("");
    Promise.all([fetchPosts(), fetchPodcastEpisodes(), fetchDailyDose()])
      .then(([nextPosts, nextEpisodes, nextDose]) => {
        setPosts(nextPosts);
        setEpisodes(nextEpisodes);
        setDailyDose(toDailyDoseDraft(nextDose));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load content."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContent();
  }, []);

  const filteredPosts = useMemo(() => posts.filter((item) => {
    if (filter === "published" && item.status !== "published") return false;
    if (filter === "draft" && item.status !== "draft") return false;
    if (filter === "featured" && !item.featured) return false;
    const query = search.trim().toLowerCase();
    return !query || [item.title, item.excerpt, item.category].join(" ").toLowerCase().includes(query);
  }), [filter, posts, search]);

  const filteredEpisodes = useMemo(() => episodes.filter((item) => {
    if (filter === "published" && item.status !== "published") return false;
    if (filter === "draft" && item.status !== "draft") return false;
    if (filter === "featured" && !item.featured) return false;
    const query = search.trim().toLowerCase();
    return !query || [item.title, item.excerpt, item.showTitle].join(" ").toLowerCase().includes(query);
  }), [episodes, filter, search]);

  const previewPost: MobilePost = {
    id: postDraft.id ?? "preview",
    slug: "preview",
    title: postDraft.title,
    excerpt: postDraft.excerpt,
    content: postDraft.contentInput.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
    category: postDraft.category,
    publishedAt: postDraft.publishedAt,
    readTimeMinutes: Number(postDraft.readTimeMinutes) || 5,
    coverGradient: postDraft.coverGradient,
    coverImageUrl: postDraft.coverImageUrl,
    status: postDraft.status,
    featured: postDraft.featured,
    seoDescription: postDraft.seoDescription,
  };

  const shareItem = async (title: string, path: string) => {
    const url = `${SITE_URL}${path}`;
    await Share.share({ title, message: url, url });
  };

  const openArticle = (post?: MobilePost) => {
    setEditorKind("articles");
    setPostDraft(toPostDraft(post));
    setFeedback("");
    setIsModalOpen(true);
  };

  const openPodcast = (episode?: MobilePodcastEpisode) => {
    setEditorKind("podcasts");
    setPodcastDraft(toPodcastDraft(episode));
    setFeedback("");
    setIsModalOpen(true);
  };

  const uploadCover = async () => {
    setIsUploadingCover(true);
    setFeedback("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const url = await uploadImage(asset.uri, asset.fileName ?? `cover-${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg");
      if (editorKind === "articles") {
        setPostDraft((current) => ({ ...current, coverImageUrl: url }));
      } else {
        setPodcastDraft((current) => ({ ...current, coverImageUrl: url }));
      }
      setFeedback("Cover uploaded.");
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Cover upload failed.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const uploadEpisodeAudio = async () => {
    setIsUploadingAudio(true);
    setFeedback("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const url = await uploadFile(
        asset.uri,
        asset.name ?? `episode-${Date.now()}.mp3`,
        asset.mimeType ?? "audio/mpeg",
      );
      setPodcastDraft((current) => ({ ...current, audioUrl: url }));
      setFeedback("Audio uploaded.");
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Audio upload failed.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const next10Days = (): string[] => {
    const days: string[] = [];
    for (let i = 0; i < 10; i++) {
      const ms = Date.now() + 5.5 * 60 * 60 * 1000 + i * 86400_000;
      days.push(new Date(ms).toISOString().slice(0, 10));
    }
    return days;
  };

  const todayIST = () => {
    const ms = Date.now() + 5.5 * 60 * 60 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  };

  const formatDay = (date: string) => {
    const d = new Date(date + "T00:00:00Z");
    const day = d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
    const num = d.getUTCDate();
    const mon = d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
    return { day, num, mon };
  };

  const loadSchedule = async () => {
    try {
      const doses = await fetchScheduledDoses();
      setSchedule(doses);
    } catch { /* silent */ }
    setScheduleLoaded(true);
  };

  const openEdit = (date: string, existing: ScheduledDose | undefined) => {
    setEditingDate(date);
    setScheduleDraft({
      text: existing?.text ?? "",
      author: existing?.author ?? "",
      style: existing?.style ?? "scroll",
    });
  };

  const cancelEdit = () => setEditingDate(null);

  const saveScheduleDay = async () => {
    if (!editingDate || !scheduleDraft.text.trim()) return;
    setSavingSchedule(true);
    try {
      const result = await saveScheduledDose({
        date: editingDate,
        text: scheduleDraft.text.trim(),
        author: scheduleDraft.author.trim() || undefined,
        style: scheduleDraft.style,
      });
      setSchedule((prev) => {
        const without = prev.filter((d) => d.date !== editingDate);
        return [...without, {
          id: result.id,
          date: editingDate,
          text: scheduleDraft.text.trim(),
          author: scheduleDraft.author.trim() || undefined,
          style: scheduleDraft.style,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }].sort((a, b) => a.date.localeCompare(b.date));
      });
      setEditingDate(null);
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Save failed.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const removeScheduleDay = async (date: string) => {
    setDeletingDate(date);
    try {
      await deleteScheduledDose(date);
      setSchedule((prev) => prev.filter((d) => d.date !== date));
    } catch { /* silent */ }
    setDeletingDate(null);
  };

  const saveDose = async () => {
    setSavingDose(true);
    setFeedback("");
    try {
      const saved = await saveDailyDose({
        text: dailyDose.text,
        author: dailyDose.author,
        active: dailyDose.active,
        style: dailyDose.style,
      });
      setDailyDose(toDailyDoseDraft(saved));
      setFeedback("Daily Dose updated.");
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Unable to save Daily Dose.");
    } finally {
      setSavingDose(false);
    }
  };

  const saveCurrent = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      if (editorKind === "articles") {
        await savePost({
          id: postDraft.id,
          title: postDraft.title,
          excerpt: postDraft.excerpt,
          category: postDraft.category,
          publishedAt: postDraft.publishedAt,
          readTimeMinutes: Number(postDraft.readTimeMinutes) || 5,
          status,
          featured: postDraft.featured,
          coverGradient: postDraft.coverGradient,
          coverImageUrl: postDraft.coverImageUrl,
          seoDescription: postDraft.seoDescription || postDraft.excerpt,
          content: postDraft.contentInput.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
        });
        setFeedback(status === "published" ? "Article published." : "Article draft saved.");
      } else {
        await savePodcastEpisode({
          id: podcastDraft.id,
          title: podcastDraft.title,
          excerpt: podcastDraft.excerpt,
          description: podcastDraft.description,
          showTitle: podcastDraft.showTitle,
          publishedAt: podcastDraft.publishedAt,
          durationMinutes: Number(podcastDraft.durationMinutes) || 20,
          audioUrl: podcastDraft.audioUrl,
          coverImageUrl: podcastDraft.coverImageUrl,
          status,
          featured: podcastDraft.featured,
          seoDescription: podcastDraft.seoDescription || podcastDraft.excerpt,
        });
        setFeedback(status === "published" ? "Episode published." : "Episode draft saved.");
      }
      setIsModalOpen(false);
      loadContent();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrent = () => {
    const id = editorKind === "articles" ? postDraft.id : podcastDraft.id;
    if (!id) return;
    Alert.alert("Delete item", "Delete this item permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            if (editorKind === "articles") {
              await deletePost(id);
            } else {
              await deletePodcastEpisode(id);
            }
            setIsModalOpen(false);
            setFeedback("Item deleted.");
            loadContent();
          } catch (reason) {
            setFeedback(reason instanceof Error ? reason.message : "Unable to delete item.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const filters: Filter[] = ["all", "published", "draft", "featured"];

  return (
    <AuthGuard>
      <AdminScreen
        eyebrow="Studio"
        title="Posts and podcasts"
        subtitle="Manage written articles and podcast episodes from the same tab."
        aside={<Pressable style={styles.primaryButton} onPress={() => kind === "articles" ? openArticle() : openPodcast()}><Text style={styles.primaryText}>{kind === "articles" ? "New Article" : "New Episode"}</Text></Pressable>}
      >
        <Card title="Workspace">
          <View style={styles.row}>
            <Pressable style={[styles.segment, kind === "articles" ? styles.segmentActive : null]} onPress={() => setKind("articles")}><Text style={[styles.segmentText, kind === "articles" ? styles.segmentTextActive : null]}>Articles</Text></Pressable>
            <Pressable style={[styles.segment, kind === "podcasts" ? styles.segmentActive : null]} onPress={() => setKind("podcasts")}><Text style={[styles.segmentText, kind === "podcasts" ? styles.segmentTextActive : null]}>Podcasts</Text></Pressable>
          </View>
        </Card>

        <Card title="Daily Dose">
          {/* Tab toggle */}
          <View style={styles.doseTabRow}>
            <Pressable
              style={[styles.doseTab, doseTab === "today" ? styles.doseTabActive : null]}
              onPress={() => setDoseTab("today")}
            >
              <Text style={[styles.doseTabText, doseTab === "today" ? styles.doseTabTextActive : null]}>Today</Text>
            </Pressable>
            <Pressable
              style={[styles.doseTab, doseTab === "schedule" ? styles.doseTabActive : null]}
              onPress={() => {
                setDoseTab("schedule");
                if (!scheduleLoaded) void loadSchedule();
              }}
            >
              <Text style={[styles.doseTabText, doseTab === "schedule" ? styles.doseTabTextActive : null]}>10-Day Schedule</Text>
            </Pressable>
          </View>

          {doseTab === "today" && (
            <>
              <Text style={styles.body}>Set today&apos;s quote or knowledge bite for the website banner.</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={dailyDose.text}
                onChangeText={(value) => setDailyDose((current) => ({ ...current, text: value }))}
                placeholder="Write today&apos;s Daily Dose"
                placeholderTextColor="#8a989c"
                multiline
              />
              <TextInput
                style={styles.input}
                value={dailyDose.author}
                onChangeText={(value) => setDailyDose((current) => ({ ...current, author: value }))}
                placeholder="Author or source (optional)"
                placeholderTextColor="#8a989c"
              />
              <View style={styles.row}>
                <Pressable style={[styles.chip, dailyDose.style === "scroll" ? styles.chipActive : null]} onPress={() => setDailyDose((current) => ({ ...current, style: "scroll" }))}>
                  <Text style={[styles.chipText, dailyDose.style === "scroll" ? styles.chipTextActive : null]}>Scrolling</Text>
                </Pressable>
                <Pressable style={[styles.chip, dailyDose.style === "flash" ? styles.chipActive : null]} onPress={() => setDailyDose((current) => ({ ...current, style: "flash" }))}>
                  <Text style={[styles.chipText, dailyDose.style === "flash" ? styles.chipTextActive : null]}>Flash</Text>
                </Pressable>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Show on website</Text>
                <Switch value={dailyDose.active} onValueChange={(value) => setDailyDose((current) => ({ ...current, active: value }))} />
              </View>
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Preview</Text>
                <Text style={styles.previewText}>
                  {dailyDose.text.trim() || "Your Daily Dose will appear here."}
                  {dailyDose.author.trim() ? ` — ${dailyDose.author.trim()}` : ""}
                </Text>
              </View>
              <Pressable style={styles.primaryButtonWide} onPress={() => void saveDose()} disabled={savingDose}>
                <Text style={styles.primaryText}>{savingDose ? "Saving..." : "Save Daily Dose"}</Text>
              </Pressable>
            </>
          )}

          {doseTab === "schedule" && (
            <>
              <Text style={styles.body}>Scheduled doses go live automatically at midnight IST. Tap a day to add or edit.</Text>
              {!scheduleLoaded ? (
                <View style={styles.center}><ActivityIndicator color="#1f6973" /></View>
              ) : (
                next10Days().map((date) => {
                  const existing = schedule.find((d) => d.date === date);
                  const { day, num, mon } = formatDay(date);
                  const isToday = date === todayIST();
                  const isEditing = editingDate === date;

                  return (
                    <View key={date} style={[styles.dayRow, isToday ? styles.dayRowToday : null]}>
                      {/* Date badge */}
                      <View style={styles.dateBadge}>
                        <Text style={[styles.dateBadgeDay, isToday ? styles.dateBadgeDayToday : null]}>{isToday ? "Today" : day}</Text>
                        <Text style={[styles.dateBadgeNum, isToday ? styles.dateBadgeNumToday : null]}>{num}</Text>
                        <Text style={styles.dateBadgeMon}>{mon}</Text>
                      </View>

                      <View style={styles.flex}>
                        {!isEditing ? (
                          <>
                            {existing ? (
                              <Text style={styles.dayPreview} numberOfLines={2}>{existing.text}</Text>
                            ) : (
                              <Text style={styles.dayEmpty}>No dose scheduled</Text>
                            )}
                            <View style={[styles.row, { marginTop: 6 }]}>
                              <Pressable
                                style={styles.dayEditBtn}
                                onPress={() => openEdit(date, existing)}
                              >
                                <Text style={styles.dayEditBtnText}>{existing ? "Edit" : "+ Add"}</Text>
                              </Pressable>
                              {existing && (
                                <Pressable
                                  style={styles.dayDeleteBtn}
                                  onPress={() => void removeScheduleDay(date)}
                                  disabled={deletingDate === date}
                                >
                                  {deletingDate === date
                                    ? <ActivityIndicator size="small" color="#c0a080" />
                                    : <Ionicons name="trash-outline" size={14} color="#c0a080" />
                                  }
                                </Pressable>
                              )}
                            </View>
                          </>
                        ) : (
                          <View style={{ gap: 8 }}>
                            <TextInput
                              style={[styles.input, styles.textarea, { minHeight: 72 }]}
                              value={scheduleDraft.text}
                              onChangeText={(v) => setScheduleDraft((p) => ({ ...p, text: v }))}
                              placeholder="Write the daily dose…"
                              placeholderTextColor="#8a989c"
                              multiline
                              autoFocus
                            />
                            <TextInput
                              style={styles.input}
                              value={scheduleDraft.author}
                              onChangeText={(v) => setScheduleDraft((p) => ({ ...p, author: v }))}
                              placeholder="Author (optional)"
                              placeholderTextColor="#8a989c"
                            />
                            <View style={styles.row}>
                              {(["scroll", "flash"] as const).map((s) => (
                                <Pressable
                                  key={s}
                                  style={[styles.chip, scheduleDraft.style === s ? styles.chipActive : null]}
                                  onPress={() => setScheduleDraft((p) => ({ ...p, style: s }))}
                                >
                                  <Text style={[styles.chipText, scheduleDraft.style === s ? styles.chipTextActive : null]}>
                                    {s === "scroll" ? "Scrolling" : "Flash"}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                            <View style={styles.row}>
                              <Pressable style={[styles.primaryButtonWide, { paddingVertical: 10 }]} onPress={() => void saveScheduleDay()} disabled={savingSchedule}>
                                <Text style={styles.primaryText}>{savingSchedule ? "Saving…" : "Save"}</Text>
                              </Pressable>
                              <Pressable style={[styles.secondaryButton, { paddingVertical: 10 }]} onPress={cancelEdit}>
                                <Text style={styles.secondaryText}>Cancel</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </Card>

        <Card title="Search">
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder={kind === "articles" ? "Search articles" : "Search episodes"} placeholderTextColor="#8a989c" />
          <View style={styles.row}>{filters.map((item) => <Pressable key={item} style={[styles.chip, filter === item ? styles.chipActive : null]} onPress={() => setFilter(item)}><Text style={[styles.chipText, filter === item ? styles.chipTextActive : null]}>{item}</Text></Pressable>)}</View>
        </Card>

        <Card title={kind === "articles" ? "Articles" : "Podcast Episodes"}>
          {loading ? <View style={styles.center}><ActivityIndicator color="#1f6973" /></View> : error ? <Text style={styles.error}>{error}</Text> : kind === "articles" ? filteredPosts.map((post) => (
            <Pressable key={post.id} style={styles.card} onPress={() => openArticle(post)}>
              <View style={styles.itemRow}>
                {post.coverImageUrl ? <Image source={{ uri: post.coverImageUrl }} style={styles.thumb} alt="" /> : <View style={styles.thumbPlaceholder}><Ionicons name="image-outline" size={22} color="#61747d" /></View>}
                <View style={styles.flex}><Text style={styles.title}>{post.title}</Text><Text style={styles.body} numberOfLines={2}>{post.excerpt}</Text></View>
              </View>
              <View style={styles.row}>
                <Pill label={post.category} />
                <Pill label={post.status} tone={post.status === "published" ? "teal" : "neutral"} />
                {post.featured ? <Pill label="Featured" tone="clay" /> : null}
              </View>
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); void shareItem(post.title, `/blog/${post.id}`); }}><Text style={styles.secondaryText}>Share</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); openArticle(post); }}><Text style={styles.secondaryText}>Edit</Text></Pressable>
              </View>
            </Pressable>
          )) : filteredEpisodes.map((episode) => (
            <Pressable key={episode.id} style={styles.card} onPress={() => openPodcast(episode)}>
              <View style={styles.itemRow}>
                {episode.coverImageUrl ? <Image source={{ uri: episode.coverImageUrl }} style={styles.thumb} alt="" /> : <View style={styles.thumbPlaceholder}><Ionicons name="mic-outline" size={22} color="#61747d" /></View>}
                <View style={styles.flex}><Text style={styles.title}>{episode.title}</Text><Text style={styles.body} numberOfLines={2}>{episode.excerpt}</Text></View>
              </View>
              <View style={styles.row}>
                <Pill label={episode.showTitle} />
                <Pill label={`${episode.durationMinutes} min`} tone="teal" />
                <Pill label={episode.status} tone={episode.status === "published" ? "teal" : "neutral"} />
              </View>
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); void shareItem(episode.title, `/podcasts/${episode.id}`); }}><Text style={styles.secondaryText}>Share</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={(event) => { event.stopPropagation(); openPodcast(episode); }}><Text style={styles.secondaryText}>Edit</Text></Pressable>
              </View>
            </Pressable>
          ))}
        </Card>

        <Modal visible={isModalOpen} animationType="slide">
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <View style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.heading}>{editorKind === "articles" ? "Article editor" : "Podcast editor"}</Text>
                <Text style={styles.body}>{editorKind === "articles" ? "Draft and publish blog posts." : "Upload audio and publish public listening pages."}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setIsModalOpen(false)}><Ionicons name="close" size={22} color="#19313b" /></Pressable>
            </View>

            {editorKind === "articles" ? (
              <>
                <Card title="Basics">
                  <TextInput style={styles.input} placeholder="Title" value={postDraft.title} onChangeText={(value) => setPostDraft((current) => ({ ...current, title: value }))} />
                  <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Excerpt" value={postDraft.excerpt} onChangeText={(value) => setPostDraft((current) => ({ ...current, excerpt: value }))} />
                  <TextInput style={styles.input} placeholder="Category" value={postDraft.category} onChangeText={(value) => setPostDraft((current) => ({ ...current, category: value }))} />
                  <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Content" value={postDraft.contentInput} onChangeText={(value) => setPostDraft((current) => ({ ...current, contentInput: value }))} />
                </Card>
                <Card title="Settings">
                  <View style={styles.row}>
                    <TextInput style={[styles.input, styles.flex]} placeholder="Publish date" value={postDraft.publishedAt} onChangeText={(value) => setPostDraft((current) => ({ ...current, publishedAt: value }))} />
                    <TextInput style={[styles.input, styles.flex]} placeholder="Read time" value={postDraft.readTimeMinutes} onChangeText={(value) => setPostDraft((current) => ({ ...current, readTimeMinutes: value }))} />
                  </View>
                  <TextInput style={styles.input} placeholder="SEO description" value={postDraft.seoDescription} onChangeText={(value) => setPostDraft((current) => ({ ...current, seoDescription: value }))} />
                  <View style={styles.switchRow}><Text style={styles.label}>Featured</Text><Switch value={postDraft.featured} onValueChange={(value) => setPostDraft((current) => ({ ...current, featured: value }))} /></View>
                  <View style={styles.spacer} />
                  <Text style={styles.label}>Cover Image</Text>
                  <Pressable 
                    style={[styles.uploadCard, isUploadingCover ? styles.uploadCardActive : null]} 
                    onPress={() => void uploadCover()}
                    disabled={isUploadingCover}
                  >
                    {isUploadingCover ? (
                      <ActivityIndicator color="#1f6973" />
                    ) : postDraft.coverImageUrl ? (
                      <View style={styles.uploadCardSuccess}>
                        <Ionicons name="checkmark-circle" size={24} color="#1f6973" />
                        <Text style={styles.uploadCardTextActive}>Cover ready</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadCardIdle}>
                        <Ionicons name="image-outline" size={28} color="#8a989c" />
                        <Text style={styles.uploadCardText}>Pick cover image</Text>
                      </View>
                    )}
                  </Pressable>
                </Card>
                <Card title="Preview"><PostPreview post={previewPost} /></Card>
              </>
            ) : (
              <>
                <Card title="Episode details">
                  <TextInput style={styles.input} placeholder="Title" value={podcastDraft.title} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, title: value }))} />
                  <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Excerpt" value={podcastDraft.excerpt} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, excerpt: value }))} />
                  <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Description" value={podcastDraft.description} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, description: value }))} />
                  <TextInput style={styles.input} placeholder="Show title" value={podcastDraft.showTitle} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, showTitle: value }))} />
                </Card>
                <Card title="Publishing">
                  <View style={styles.row}>
                    <TextInput style={[styles.input, styles.flex]} placeholder="Publish date" value={podcastDraft.publishedAt} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, publishedAt: value }))} />
                    <TextInput style={[styles.input, styles.flex]} placeholder="Minutes" value={podcastDraft.durationMinutes} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, durationMinutes: value }))} />
                  </View>
                  <TextInput style={styles.input} placeholder="SEO description" value={podcastDraft.seoDescription} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, seoDescription: value }))} />
                  <TextInput style={styles.input} placeholder="Audio URL" value={podcastDraft.audioUrl} onChangeText={(value) => setPodcastDraft((current) => ({ ...current, audioUrl: value }))} />
                  <View style={styles.switchRow}><Text style={styles.label}>Featured</Text><Switch value={podcastDraft.featured} onValueChange={(value) => setPodcastDraft((current) => ({ ...current, featured: value }))} /></View>
                  
                  <View style={styles.spacer} />
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Text style={styles.label}>Cover</Text>
                      <Pressable 
                        style={[styles.uploadCard, isUploadingCover ? styles.uploadCardActive : null]} 
                        onPress={() => void uploadCover()}
                        disabled={isUploadingCover}
                      >
                        {isUploadingCover ? (
                          <ActivityIndicator color="#1f6973" />
                        ) : podcastDraft.coverImageUrl ? (
                          <Ionicons name="checkmark-circle" size={24} color="#1f6973" />
                        ) : (
                          <Ionicons name="image-outline" size={28} color="#8a989c" />
                        )}
                        <Text style={[styles.uploadCardTextTiny, (isUploadingCover || podcastDraft.coverImageUrl) ? styles.uploadCardTextActive : null]}>
                          {isUploadingCover ? "Uploading..." : podcastDraft.coverImageUrl ? "Done" : "Pick Cover"}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.flex}>
                      <Text style={styles.label}>Audio</Text>
                      <Pressable 
                        style={[styles.uploadCard, isUploadingAudio ? styles.uploadCardActive : null]} 
                        onPress={() => void uploadEpisodeAudio()}
                        disabled={isUploadingAudio}
                      >
                        {isUploadingAudio ? (
                          <ActivityIndicator color="#1f6973" />
                        ) : podcastDraft.audioUrl ? (
                          <Ionicons name="checkmark-circle" size={24} color="#1f6973" />
                        ) : (
                          <Ionicons name="mic-outline" size={28} color="#8a989c" />
                        )}
                        <Text style={[styles.uploadCardTextTiny, (isUploadingAudio || podcastDraft.audioUrl) ? styles.uploadCardTextActive : null]}>
                          {isUploadingAudio ? "Uploading..." : podcastDraft.audioUrl ? "Done" : "Pick Audio"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </>
            )}

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            {(editorKind === "articles" ? postDraft.id : podcastDraft.id) ? <Pressable style={styles.deleteButton} onPress={deleteCurrent}><Text style={styles.deleteText}>Delete</Text></Pressable> : null}
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={() => void saveCurrent("draft")} disabled={saving}><Text style={styles.secondaryText}>{saving ? "Saving..." : "Save Draft"}</Text></Pressable>
              <Pressable style={styles.primaryButtonWide} onPress={() => void saveCurrent("published")} disabled={saving}><Text style={styles.primaryText}>{saving ? "Saving..." : "Publish"}</Text></Pressable>
            </View>
          </ScrollView>
        </Modal>
      </AdminScreen>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  primaryButton: { backgroundColor: "#1f6973", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonWide: { flex: 1, backgroundColor: "#1f6973", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "#fffef9", fontWeight: "800", fontSize: 13 },
  secondaryButton: { borderRadius: 16, backgroundColor: "#efe2cf", paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  secondaryText: { color: "#19313b", fontWeight: "800" },
  deleteButton: { borderRadius: 16, backgroundColor: "#f8e7e3", borderWidth: 1, borderColor: "#c98e83", paddingVertical: 14, alignItems: "center" },
  deleteText: { color: "#9a4335", fontWeight: "900" },
  modal: { flex: 1, backgroundColor: "#f7efe4" },
  modalContent: { padding: 18, paddingTop: 50, paddingBottom: 120, gap: 14 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#efe2cf" },
  center: { paddingVertical: 30, alignItems: "center" },
  error: { color: "#b42318", fontSize: 14 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  itemRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  segment: { flex: 1, borderRadius: 999, backgroundColor: "#efe2cf", paddingVertical: 12, alignItems: "center" },
  segmentActive: { backgroundColor: "#1f6973" },
  segmentText: { color: "#6f5c46", fontWeight: "800" },
  segmentTextActive: { color: "#fffef9" },
  input: { backgroundColor: "#fffaf3", borderColor: "#dcc6a5", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, color: "#19313b", fontSize: 15 },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#304b57", fontWeight: "700", fontSize: 15 },
  chip: { borderRadius: 999, backgroundColor: "#efe2cf", paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: "#1f6973" },
  chipText: { color: "#6f5c46", fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  chipTextActive: { color: "#fffef9" },
  card: { backgroundColor: "#f7efe4", borderRadius: 22, padding: 14, gap: 12 },
  previewCard: { borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: "#dcc6a5", backgroundColor: "#fffaf3", padding: 14, gap: 8 },
  previewLabel: { color: "#1f6973", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  previewText: { color: "#19313b", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  thumb: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#efe2cf" },
  thumbPlaceholder: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#efe2cf" },
  flex: { flex: 1 },
  title: { color: "#19313b", fontSize: 16, fontWeight: "800" },
  heading: { color: "#19313b", fontSize: 26, fontWeight: "900" },
  body: { color: "#61747d", fontSize: 13, lineHeight: 18, marginTop: 4 },
  feedback: { color: "#42555d", fontSize: 14, backgroundColor: "#fffaf3", borderWidth: 1, borderColor: "#dcc6a5", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  spacer: { height: 8 },
  uploadCard: {
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#dcc6a5",
    backgroundColor: "#fffaf3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  uploadCardActive: {
    backgroundColor: "#ecf4f5",
    borderColor: "#1f6973",
  },
  uploadCardIdle: {
    alignItems: "center",
  },
  uploadCardSuccess: {
    alignItems: "center",
    gap: 4,
  },
  uploadCardText: {
    color: "#5e7178",
    fontSize: 14,
    fontWeight: "700",
  },
  uploadCardTextTiny: {
    color: "#5e7178",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  uploadCardTextActive: {
    color: "#1f6973",
    fontWeight: "800",
  },
  // Daily dose schedule styles
  doseTabRow: { flexDirection: "row", backgroundColor: "#f0e9dc", borderRadius: 14, padding: 3, gap: 3 },
  doseTab: { flex: 1, borderRadius: 11, paddingVertical: 9, alignItems: "center" },
  doseTabActive: { backgroundColor: "#ffffff" },
  doseTabText: { fontSize: 12, fontWeight: "700", color: "#8a7060" },
  doseTabTextActive: { color: "#1f2d39" },
  dayRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", borderRadius: 16, borderWidth: 1, borderColor: "#e0d4c0", backgroundColor: "#fffaf3", padding: 12 },
  dayRowToday: { borderColor: "#1f6973", backgroundColor: "#f0f8f8" },
  dateBadge: { alignItems: "center", minWidth: 38 },
  dateBadgeDay: { fontSize: 10, fontWeight: "800", color: "#8fa3ad", textTransform: "uppercase" },
  dateBadgeDayToday: { color: "#1f6973" },
  dateBadgeNum: { fontSize: 22, fontWeight: "900", color: "#1f2d39", lineHeight: 26 },
  dateBadgeNumToday: { color: "#1f6973" },
  dateBadgeMon: { fontSize: 10, color: "#8fa3ad" },
  dayPreview: { fontSize: 13, color: "#1f2d39", fontWeight: "600", lineHeight: 18 },
  dayEmpty: { fontSize: 13, color: "#b0a090", fontStyle: "italic" },
  dayEditBtn: { borderRadius: 20, backgroundColor: "#1f6973", paddingHorizontal: 12, paddingVertical: 6 },
  dayEditBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  dayDeleteBtn: { borderRadius: 20, borderWidth: 1, borderColor: "#e0d4c0", backgroundColor: "#faf4eb", width: 30, height: 30, alignItems: "center", justifyContent: "center" },
});
