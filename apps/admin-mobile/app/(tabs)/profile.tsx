import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
      eyebrow="Account"
      title="Welcome back"
      subtitle="A simple sign-in area for managing posts and checking comments comfortably from the phone."
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="person-circle-outline" size={44} color="#1f6973" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            {isAuthenticated ? "You are signed in" : "Sign in to continue"}
          </Text>
          <Text style={styles.heroText}>
            {isAuthenticated
              ? "You can now open posts, upload covers, and read fresh comments."
              : "Use your admin username and password. Once signed in, the rest of the app unlocks automatically."}
          </Text>
        </View>
      </View>

      <Card title="Account">
        <View style={styles.row}>
          <Pill
            label={isAuthenticated ? "Signed In" : "Signed Out"}
            tone={isAuthenticated ? "teal" : "neutral"}
          />
          <Pill label="Private Admin" tone="clay" />
        </View>
        {isAuthenticated ? (
          <View style={styles.signedInCard}>
            <View style={styles.signedInRow}>
              <Ionicons name="checkmark-circle" size={22} color="#1f6973" />
              <Text style={styles.signedInText}>Everything is ready. You can use the other tabs now.</Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
              <Text style={styles.secondaryButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                placeholder="Enter username"
                placeholderTextColor="#8a989c"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter password"
                placeholderTextColor="#8a989c"
              />
            </View>
            <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
              {loading ? <ActivityIndicator color="#fffef9" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
          </>
        )}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </Card>

      <Card title="Helpful notes">
        <View style={styles.noteRow}>
          <Ionicons name="create-outline" size={18} color="#1f6973" />
          <Text style={styles.noteText}>Use Posts to create or update articles quickly.</Text>
        </View>
        <View style={styles.noteRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1f6973" />
          <Text style={styles.noteText}>Use Comments to read the latest visitor messages.</Text>
        </View>
        <View style={styles.noteRow}>
          <Ionicons name="image-outline" size={18} color="#1f6973" />
          <Text style={styles.noteText}>You can upload a cover image directly from the phone.</Text>
        </View>
      </Card>

      <Card title="Need help?">
        <Text style={styles.helper}>
          If something looks wrong, just sign out and sign in again. That usually refreshes the session cleanly.
        </Text>
      </Card>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#fffaf3",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#dcc6a5",
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e5f0ee",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  heroTitle: {
    color: "#19313b",
    fontSize: 22,
    fontWeight: "900",
  },
  heroText: {
    color: "#61747d",
    fontSize: 14,
    lineHeight: 21,
  },
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
  signedInCard: {
    gap: 14,
    backgroundColor: "#f7efe4",
    borderRadius: 18,
    padding: 14,
  },
  signedInRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  signedInText: {
    flex: 1,
    color: "#304b57",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  feedback: {
    color: "#42555d",
    fontSize: 14,
    backgroundColor: "#f7efe4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  helper: {
    color: "#61747d",
    fontSize: 14,
    lineHeight: 20,
  },
  noteRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    color: "#445760",
    fontSize: 14,
    lineHeight: 20,
  },
});
