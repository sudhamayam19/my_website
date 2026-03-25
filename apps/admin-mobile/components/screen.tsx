import type { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export function AdminScreen({
  eyebrow,
  title,
  subtitle,
  children,
  aside,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
  aside?: ReactNode;
}>) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {aside}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  title,
  description,
  children,
}: PropsWithChildren<{
  title: string;
  description?: string;
}>) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {description ? <Text style={styles.cardDescription}>{description}</Text> : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "teal" | "clay" }) {
  return (
    <View
      style={[
        styles.pill,
        tone === "teal" ? styles.pillTeal : null,
        tone === "clay" ? styles.pillClay : null,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === "teal" ? styles.pillTextDark : null,
          tone === "clay" ? styles.pillTextLight : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7efe4",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 16,
  },
  headerRow: {
    gap: 14,
  },
  headerCopy: {
    gap: 6,
  },
  eyebrow: {
    color: "#1f6973",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#19313b",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#5e7178",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fffaf3",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dcc6a5",
    gap: 8,
  },
  cardTitle: {
    color: "#19313b",
    fontSize: 19,
    fontWeight: "800",
  },
  cardDescription: {
    color: "#6a7c82",
    fontSize: 14,
    lineHeight: 20,
  },
  cardBody: {
    gap: 12,
    marginTop: 4,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#efe2cf",
  },
  pillTeal: {
    backgroundColor: "#d9ece8",
  },
  pillClay: {
    backgroundColor: "#b85c44",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6f5c46",
  },
  pillTextDark: {
    color: "#1f6973",
  },
  pillTextLight: {
    color: "#fffdf8",
  },
});
