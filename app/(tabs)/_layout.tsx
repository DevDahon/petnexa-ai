import { Tabs, usePathname, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { fontFamily, palette, radii, shadow, spacing, typeScale } from "@/constants/theme";

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const icons: Record<string, { default: MaterialIconName; active: MaterialIconName }> = {
  index: { default: "home-outline", active: "home" },
  pets: { default: "paw-outline", active: "paw" },
  records: { default: "clipboard-text-outline", active: "clipboard-text" },
  map: { default: "map-marker-outline", active: "map-marker" },
  reminders: { default: "calendar-clock-outline", active: "calendar-clock" },
  "ai-assistant": { default: "robot-happy-outline", active: "robot-happy" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  pets: "Pets",
  records: "Records",
  map: "Find Vet",
  reminders: "Care",
  "ai-assistant": "AI",
};

const WEB_NAV_ITEMS = [
  { key: "index", label: "Home", icon: "home-outline", path: "/" },
  { key: "pets", label: "Pets", icon: "paw-outline", path: "/pets" },
  { key: "records", label: "Records", icon: "clipboard-text-outline", path: "/records" },
  { key: "map", label: "Find Vet", icon: "map-marker-outline", path: "/map" },
  { key: "reminders", label: "Care Reminders", icon: "calendar-clock-outline", path: "/reminders" },
  { key: "ai-assistant", label: "AI Assistant", icon: "robot-happy-outline", path: "/ai-assistant" },
];

import { useAppData } from "@/context/AppContext";

function TabIcon({
  color,
  focused,
  iconName,
  isCompact,
}: {
  color: string;
  focused: boolean;
  iconName: MaterialIconName;
  isCompact: boolean;
}) {
  const { isDark, themePalette } = useAppData();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const activePillBg = isDark ? "#112D2B" : palette.softTeal;
  const activePillBorder = isDark ? "#0D9488" : palette.mintLight;

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["transparent", activePillBg]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ["transparent", activePillBorder]
    ),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.94, 1]) }],
  }));

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: isCompact ? 44 : 48,
        height: isCompact ? 30 : 32,
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
  label,
}: {
  focused: boolean;
  isCompact: boolean;
  label: string;
}) {
  const { themePalette } = useAppData();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [themePalette.muted, themePalette.teal]),
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

function TopWebHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentKey = () => {
    if (pathname === "/" || pathname === "/index") return "index";
    if (pathname.includes("pets")) return "pets";
    if (pathname.includes("records")) return "records";
    if (pathname.includes("map")) return "map";
    if (pathname.includes("reminders")) return "reminders";
    if (pathname.includes("ai-assistant")) return "ai-assistant";
    return "index";
  };

  const activeKey = getCurrentKey();

  return (
    <View style={webHeaderStyles.wrapper}>
      <View style={webHeaderStyles.container}>
        {/* Brand */}
        <Pressable onPress={() => router.push("/")} style={webHeaderStyles.brand}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={webHeaderStyles.logo}
            resizeMode="contain"
          />
          <Text style={webHeaderStyles.brandName}>PetNexa AI</Text>
        </Pressable>

        {/* Desktop Web Nav Bar */}
        <View style={webHeaderStyles.navList}>
          {WEB_NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.path as any)}
                style={[webHeaderStyles.navItem, isActive && webHeaderStyles.navItemActive]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? palette.teal : palette.muted}
                />
                <Text style={[webHeaderStyles.navText, isActive && webHeaderStyles.navTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Right Settings */}
        <View style={webHeaderStyles.rightActions}>
          <Pressable
            onPress={() => router.push("/settings")}
            style={webHeaderStyles.settingsBtn}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={palette.text} />
            <Text style={webHeaderStyles.settingsText}>Settings</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isDark, themePalette } = useAppData();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isWebDesktop = Platform.OS === "web" && width >= 768;
  const safeBottom = Platform.OS === "ios" ? Math.max(insets.bottom, 6) : 4;
  const tabBarHeight = (isCompact ? 62 : 66) + safeBottom;

  return (
    <View style={{ flex: 1, backgroundColor: themePalette.background }}>
      {isWebDesktop && <TopWebHeader />}
      <Tabs
        screenOptions={({ route }) => {
          const iconSet = icons[route.name] ?? { default: "home-outline", active: "home" };
          return {
            headerShown: false,
            tabBarActiveTintColor: themePalette.teal,
            tabBarInactiveTintColor: themePalette.muted,
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
            tabBarStyle: isWebDesktop
              ? { display: "none" }
              : {
                  backgroundColor: themePalette.card,
                  borderTopColor: themePalette.border,
                  borderTopWidth: 1,
                  height: tabBarHeight,
                  paddingBottom: safeBottom,
                  paddingTop: isCompact ? 7 : 8,
                  paddingHorizontal: 0,
                  boxShadow: isDark
                    ? "0 -4px 20px rgba(0, 0, 0, 0.4)"
                    : "0 -4px 20px rgba(30, 58, 138, 0.08)",
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
              const iconName = iconSet.default;
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
        <Tabs.Screen name="map" />
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
    </View>
  );
}

const webHeaderStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    ...shadow.xs,
    zIndex: 1000,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    height: 64,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  brandName: {
    fontFamily: fontFamily.black,
    fontSize: 18,
    color: palette.text,
    letterSpacing: -0.3,
  },
  navList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  navItemActive: {
    backgroundColor: palette.softTeal,
  },
  navText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: palette.muted,
  },
  navTextActive: {
    fontFamily: fontFamily.bold,
    color: palette.teal,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  settingsText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: palette.text,
  },
});
