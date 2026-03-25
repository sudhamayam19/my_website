import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AdminScreen, Card, Pill } from "@/components/screen";
import { useAuth } from "@/lib/auth";

export default function ProfileScreen() {
  const { isAuthenticated, signInWithPassword, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    setFeedback("");
    try {
      await signInWithPassword(username, password);
      setPassword("");
      setFeedback("Signed in successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setFeedback("Signed out.");
  };

  return (
    <AdminScreen
      eyebrow="Profile"
      title="Admin access"
      subtitle="This tab handles sign-in for the real website backend and keeps the rest of the app unlocked."
    >
      <Card title="Session">
        <View style={styles.row}>
          <Pill label={isAuthenticated ? "Signed In" : "Signed Out"} tone={isAuthenticated ? "teal" : "neutral"} />
          <Pill label="Expo + EAS" tone="clay" />
        </View>
        {isAuthenticated ? (
          <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
              {loading ? <ActivityIndicator color="#fffef9" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
          </>
        )}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </Card>
      <Card title="API target" description="Set EXPO_PUBLIC_API_BASE_URL in the mobile app to your deployed website URL before running builds.">
        <Text style={styles.helper}>Example: https://sudhamayam.vercel.app</Text>
      </Card>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#304b57",
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#f7efe4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcc6a5",
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#19313b",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#b85c44",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fffef9",
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#1f6973",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fffef9",
    fontWeight: "900",
    fontSize: 15,
  },
  feedback: {
    color: "#42555d",
    fontSize: 14,
  },
  helper: {
    color: "#61747d",
    fontSize: 14,
    lineHeight: 20,
  },
});
