import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { MobilePost } from "@/lib/mobile-api";

interface PostPreviewProps {
  post: Pick<
    MobilePost,
    | "title"
    | "excerpt"
    | "category"
    | "publishedAt"
    | "readTimeMinutes"
    | "coverImageUrl"
    | "content"
  >;
}

function renderInlineText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRegex =
    /(<u>([\s\S]+?)<\/u>)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let matchIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const start = match.index;
    const end = tokenRegex.lastIndex;

    if (start > lastIndex) {
      nodes.push(
        <Text key={`${keyPrefix}-text-${matchIndex}`}>{text.slice(lastIndex, start)}</Text>,
      );
    }

    if (match[1]) {
      nodes.push(
        <Text key={`${keyPrefix}-underline-${matchIndex}`} style={styles.inlineUnderline}>
          {renderInlineText(match[2], `${keyPrefix}-u-${matchIndex}`)}
        </Text>,
      );
    } else if (match[3]) {
      nodes.push(
        <Text key={`${keyPrefix}-link-${matchIndex}`} style={styles.inlineLink}>
          {match[4]}
        </Text>,
      );
    } else if (match[6]) {
      nodes.push(
        <Text key={`${keyPrefix}-bold-${matchIndex}`} style={styles.inlineBold}>
          {renderInlineText(match[7], `${keyPrefix}-b-${matchIndex}`)}
        </Text>,
      );
    } else if (match[8]) {
      nodes.push(
        <Text key={`${keyPrefix}-italic-${matchIndex}`} style={styles.inlineItalic}>
          {renderInlineText(match[9], `${keyPrefix}-i-${matchIndex}`)}
        </Text>,
      );
    } else if (match[10]) {
      nodes.push(
        <Text key={`${keyPrefix}-code-${matchIndex}`} style={styles.inlineCode}>
          {match[11]}
        </Text>,
      );
    }

    lastIndex = end;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(<Text key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</Text>);
  }

  return nodes;
}

function renderParagraphLines(block: string, keyPrefix: string) {
  return block.split("\n").map((line, index) => (
    <Text key={`${keyPrefix}-line-${index}`} style={styles.bodyText}>
      {index > 0 ? "\n" : ""}
      {renderInlineText(line, `${keyPrefix}-${index}`)}
    </Text>
  ));
}

function renderBlock(block: string, index: number) {
  const trimmed = block.trim();
  if (!trimmed) {
    return null;
  }

  const key = `preview-block-${index}`;
  const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
  if (imageMatch) {
    return (
      <View key={key} style={styles.imageBlock}>
        <Image source={{ uri: imageMatch[2].trim() }} style={styles.bodyImage} alt={imageMatch[1].trim() || "Article image"} />
        {imageMatch[1].trim() ? <Text style={styles.caption}>{imageMatch[1].trim()}</Text> : null}
      </View>
    );
  }

  const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const headingStyle =
      level === 1 ? styles.headingLarge : level === 2 ? styles.headingMedium : styles.headingSmall;
    return (
      <Text key={key} style={headingStyle}>
        {renderInlineText(headingMatch[2], `${key}-heading`)}
      </Text>
    );
  }

  if (trimmed.startsWith("> ")) {
    return (
      <View key={key} style={styles.quoteBlock}>
        <Text style={styles.quoteText}>{renderInlineText(trimmed.slice(2), `${key}-quote`)}</Text>
      </View>
    );
  }

  const lines = trimmed.split("\n").map((line) => line.trim());
  const isBulleted = lines.every((line) => line.startsWith("- "));
  if (isBulleted) {
    return (
      <View key={key} style={styles.listBlock}>
        {lines.map((line, lineIndex) => (
          <View key={`${key}-bullet-${lineIndex}`} style={styles.listRow}>
            <Text style={styles.listMarker}>•</Text>
            <Text style={styles.bodyText}>
              {renderInlineText(line.slice(2), `${key}-bullet-text-${lineIndex}`)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  const orderedPattern = /^\d+\.\s+/;
  const isOrdered = lines.every((line) => orderedPattern.test(line));
  if (isOrdered) {
    return (
      <View key={key} style={styles.listBlock}>
        {lines.map((line, lineIndex) => (
          <View key={`${key}-ordered-${lineIndex}`} style={styles.listRow}>
            <Text style={styles.listMarker}>{`${lineIndex + 1}.`}</Text>
            <Text style={styles.bodyText}>
              {renderInlineText(line.replace(orderedPattern, ""), `${key}-ordered-text-${lineIndex}`)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View key={key} style={styles.paragraphBlock}>
      {renderParagraphLines(trimmed, key)}
    </View>
  );
}

export function PostPreview({ post }: PostPreviewProps) {
  return (
    <View style={styles.wrapper}>
      {post.coverImageUrl ? <Image source={{ uri: post.coverImageUrl }} style={styles.coverImage} alt="Post cover preview" /> : null}
      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{post.category}</Text>
        <Text style={styles.metaText}>{post.publishedAt}</Text>
        <Text style={styles.metaText}>{post.readTimeMinutes} min read</Text>
      </View>
      <Text style={styles.title}>{post.title || "Untitled post"}</Text>
      <Text style={styles.excerpt}>{post.excerpt || "Add a short excerpt to preview it here."}</Text>
      <View style={styles.contentStack}>
        {post.content.length ? (
          post.content.slice(0, 6).map((block, index) => renderBlock(block, index))
        ) : (
          <Text style={styles.emptyText}>Start writing to see a richer article preview.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  coverImage: {
    width: "100%",
    height: 190,
    borderRadius: 20,
    backgroundColor: "#efe2cf",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  metaChip: {
    color: "#1f6973",
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "#d9ece8",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  metaText: {
    color: "#6a7c82",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#19313b",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  excerpt: {
    color: "#55666d",
    fontSize: 15,
    lineHeight: 22,
  },
  contentStack: {
    gap: 12,
  },
  headingLarge: {
    color: "#19313b",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  headingMedium: {
    color: "#19313b",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 28,
  },
  headingSmall: {
    color: "#19313b",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  paragraphBlock: {
    gap: 6,
  },
  bodyText: {
    color: "#42555f",
    fontSize: 15,
    lineHeight: 22,
  },
  quoteBlock: {
    borderLeftWidth: 4,
    borderLeftColor: "#c8ad86",
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quoteText: {
    color: "#4a5b64",
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  listBlock: {
    gap: 8,
  },
  listRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  listMarker: {
    color: "#19313b",
    fontSize: 15,
    fontWeight: "800",
    width: 18,
  },
  imageBlock: {
    gap: 8,
  },
  bodyImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#efe2cf",
  },
  caption: {
    color: "#6a7c82",
    fontSize: 12,
    fontStyle: "italic",
  },
  inlineBold: {
    fontWeight: "800",
    color: "#19313b",
  },
  inlineItalic: {
    fontStyle: "italic",
  },
  inlineUnderline: {
    textDecorationLine: "underline",
  },
  inlineCode: {
    backgroundColor: "#efe3d2",
    color: "#42555f",
    fontSize: 14,
  },
  inlineLink: {
    color: "#1f5f76",
    textDecorationLine: "underline",
  },
  emptyText: {
    color: "#75888e",
    fontSize: 14,
    lineHeight: 20,
  },
});
