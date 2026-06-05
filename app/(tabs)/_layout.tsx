import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { palette, radii, shadow } from "@/constants/theme";

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
          headerShown: false,
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: palette.text, fontWeight: "900" },
          tabBarActiveTintColor: palette.teal,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: "transparent", height: 76, paddingTop: 9, paddingBottom: 10, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, boxShadow: shadow.md },
          tabBarItemStyle: { borderRadius: radii.lg, marginHorizontal: 2 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "900", letterSpacing: 0 },
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={icon}
              color={color}
              size={focused ? 28 : 23}
              style={focused ? { backgroundColor: palette.softTeal, borderRadius: 999, padding: 6, marginBottom: -2 } : undefined}
            />
          ),
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
