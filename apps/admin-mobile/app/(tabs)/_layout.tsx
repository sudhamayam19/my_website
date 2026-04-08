import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const colors = {
  cream: "#f7efe4",
  sand: "#dcc6a5",
  ink: "#19313b",
  teal: "#1f6973",
  clay: "#b85c44",
  slate: "#61747d",
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: {
          backgroundColor: "#fffaf3",
          borderTopColor: colors.sand,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? "home" : "home-outline",
            posts: focused ? "document-text" : "document-text-outline",
            comments: focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline",
            assistant: focused ? "sparkles" : "sparkles-outline",
            profile: focused ? "person-circle" : "person-circle-outline",
          };

          return <Ionicons name={iconMap[route.name] ?? "ellipse-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="posts" options={{ title: "Posts" }} />
      <Tabs.Screen name="comments" options={{ title: "Comments" }} />
      <Tabs.Screen name="assistant" options={{ title: "Assistant" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
