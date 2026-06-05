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
          headerShown: false,
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: palette.text, fontWeight: "900" },
          tabBarActiveTintColor: palette.teal,
          tabBarInactiveTintColor: palette.muted,
          tabBarHideOnKeyboard: false,
          tabBarLabelPosition: "below-icon",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#E4E7EC",
            borderTopWidth: 1,
            height: 72,
            paddingTop: 6,
            paddingBottom: 8,
          },
          tabBarItemStyle: {
            flex: 1,
            minWidth: 0,
            paddingHorizontal: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: "800",
            letterSpacing: 0,
          },
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={icon}
              color={color}
              size={focused ? 24 : 22}
            />
          ),
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="pets" options={{ title: "Pets" }} />
      <Tabs.Screen name="records" options={{ title: "Records" }} />
      <Tabs.Screen name="reminders" options={{ title: "Care" }} />
      <Tabs.Screen name="ai-assistant" options={{ title: "AI" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
