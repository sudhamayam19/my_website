import type { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";

export function AuthGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f6973" />
        <Text style={styles.text}>Loading mobile admin...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in from the Profile tab</Text>
        <Text style={styles.text}>
          Once signed in, your mother can use the other tabs with the live website backend.
        </Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
    backgroundColor: "#f7efe4",
  },
  title: {
    color: "#19313b",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  text: {
    color: "#61747d",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});
