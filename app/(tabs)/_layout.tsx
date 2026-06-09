import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { Platform, View, useWindowDimensions, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { fontFamily, palette, radii } from "@/constants/theme";

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const icons: Record<string, { default: MaterialIconName; active: MaterialIconName }> = {
  index: { default: "home-outline", active: "home" },
  pets: { default: "paw-outline", active: "paw" },
  records: { default: "clipboard-text-outline", active: "clipboard-text" },
  reminders: { default: "calendar-clock-outline", active: "calendar-clock" },
  "ai-assistant": { default: "robot-happy-outline", active: "robot-happy" },
  settings: { default: "cog-outline", active: "cog" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  pets: "Pets",
  records: "Records",
  reminders: "Care",
  "ai-assistant": "AI",
  settings: "More",
};

function TabIcon({
  color,
  focused,
  iconName,
  isCompact,
}: {
  color: ColorValue;
  focused: boolean;
  iconName: MaterialIconName;
  isCompact: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 16,
      stiffness: 190,
      mass: 0.8,
    });
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0)", palette.softTeal],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0)", palette.mintLight],
    ),
    borderWidth: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [1, -3]) },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1.08]) },
    ],
  }));

  return (
    <View
      style={{
        width: isCompact ? 52 : 56,
        height: isCompact ? 36 : 38,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            width: isCompact ? 44 : 48,
            height: isCompact ? 36 : 38,
            borderRadius: radii.pill,
            alignItems: "center",
            justifyContent: "center",
          },
          pillStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          color={color}
          size={isCompact ? (focused ? 21 : 20) : focused ? 23 : 22}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isTablet = width >= 768;
  const tabBarHeight = (isCompact ? 70 : 74) + (Platform.OS === "ios" ? insets.bottom : 10);

  return (
    <Tabs
      screenOptions={({ route }) => {
        const iconSet = icons[route.name] ?? { default: "home-outline", active: "home" };
        return {
          headerShown: false,
          tabBarActiveTintColor: palette.teal,
          tabBarInactiveTintColor: palette.muted,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: true,
          tabBarLabel: tabLabels[route.name] ?? route.name,
          tabBarAccessibilityLabel: tabLabels[route.name] ?? route.name,
          tabBarAllowFontScaling: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: palette.borderLight,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 10,
            paddingTop: isCompact ? 8 : 10,
            paddingHorizontal: isTablet ? 96 : 0,
            boxShadow: "0 -4px 20px rgba(30, 58, 138, 0.08)",
          },
          tabBarItemStyle: {
            flex: 1,
            minWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: isCompact ? 10 : 11,
            fontFamily: fontFamily.semiBold,
            letterSpacing: 0,
            lineHeight: isCompact ? 12 : 13,
            marginTop: 2,
            marginBottom: 0,
            includeFontPadding: false,
          },
          tabBarIcon: ({ color, focused }) => {
            const iconName = focused ? iconSet.active : iconSet.default;
            return (
              <TabIcon
                color={color}
                focused={focused}
                iconName={iconName}
                isCompact={isCompact}
              />
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pets" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="reminders" />
      <Tabs.Screen name="ai-assistant" />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
