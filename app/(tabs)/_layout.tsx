import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { Platform, View, useWindowDimensions, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { fontFamily, palette, radii, typeScale } from "@/constants/theme";

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
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 190,
      easing: Easing.out(Easing.cubic),
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
    opacity: interpolate(progress.value, [0, 1], [0.82, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [1, -1]) },
    ],
  }));

  return (
    <View
      style={{
        width: isCompact ? 48 : 52,
        height: isCompact ? 30 : 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            width: isCompact ? 40 : 44,
            height: isCompact ? 30 : 32,
            borderRadius: radii.pill,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
          },
          pillStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          color={color}
          size={isCompact ? 20 : 21}
        />
      </Animated.View>
    </View>
  );
}

function TabLabel({
  focused,
  isCompact,
  label,
}: {
  focused: boolean;
  isCompact: boolean;
  label: string;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [palette.muted, palette.teal]),
    opacity: interpolate(progress.value, [0, 1], [0.78, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [1, 0]) }],
  }));

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        {
          fontSize: typeScale.caption,
          fontFamily: fontFamily.semiBold,
          letterSpacing: 0,
          lineHeight: 14,
          marginTop: 2,
          includeFontPadding: false,
          textAlign: "center",
        },
        labelStyle,
      ]}
    >
      {label}
    </Animated.Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isTablet = width >= 768;
  const safeBottom = Platform.OS === "ios" ? Math.max(insets.bottom, 6) : 4;
  const tabBarHeight = (isCompact ? 62 : 66) + safeBottom;

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
          tabBarLabel: ({ focused }) => (
            <TabLabel
              focused={focused}
              isCompact={isCompact}
              label={tabLabels[route.name] ?? route.name}
            />
          ),
          tabBarAccessibilityLabel: tabLabels[route.name] ?? route.name,
          tabBarAllowFontScaling: true,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: palette.borderLight,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: safeBottom,
            paddingTop: isCompact ? 7 : 8,
            paddingHorizontal: isTablet ? 96 : 0,
            boxShadow: "0 -4px 20px rgba(30, 58, 138, 0.08)",
          },
          tabBarItemStyle: {
            flex: 1,
            minWidth: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
            height: isCompact ? 56 : 60,
          },
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: -1,
          },
          tabBarLabelStyle: {
            fontSize: typeScale.caption,
            fontFamily: fontFamily.semiBold,
            letterSpacing: 0,
            lineHeight: 14,
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
