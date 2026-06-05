import { Tabs } from "expo-router";
import { Bot, Calendar, ClipboardList, Home, PawPrint, Settings } from "lucide-react-native";
import { palette } from "@/constants/theme";

const icons = {
  index: Home,
  pets: PawPrint,
  records: ClipboardList,
  reminders: Calendar,
  "ai-assistant": Bot,
  settings: Settings,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name as keyof typeof icons] ?? Home;
        return {
          headerShown: true,
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: palette.text, fontWeight: "900" },
          tabBarActiveTintColor: palette.teal,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#EAEFF5", height: 64, paddingTop: 8 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
          tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="pets" options={{ title: "Pets" }} />
      <Tabs.Screen name="records" options={{ title: "Records" }} />
      <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />
      <Tabs.Screen name="ai-assistant" options={{ title: "AI Assistant" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
