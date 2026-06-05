import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { palette } from "@/constants/theme";

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const icons: Record<string, MaterialIconName> = {
  index: "home-outline",
  pets: "paw",
  records: "clipboard-text-outline",
  reminders: "calendar-clock",
  "ai-assistant": "robot-happy-outline",
  settings: "cog-outline",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const icon = icons[route.name] ?? "home-outline";
        return {
          headerShown: true,
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: palette.text, fontWeight: "900" },
          tabBarActiveTintColor: palette.teal,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#EAEFF5", height: 64, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icon} color={color} size={size} />,
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="pets" options={{ title: "Pets" }} />
      <Tabs.Screen name="records" options={{ title: "Records" }} />
      <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />
      <Tabs.Screen name="ai-assistant" options={{ title: "AI Assistant" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", href: null }} />
    </Tabs>
  );
}
