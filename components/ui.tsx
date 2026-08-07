import {
    fontFamily,
    gradients,
    lineHeights,
    palette,
    radii,
    typeScale,
} from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Pet, Reminder } from "@/types/domain";
import { calculateAge, getLifeStage, getReminderStatus } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { PropsWithChildren } from "react";

export function useAppPalette() {
  try {
    const data = useAppData();
    if (data?.themePalette) return data.themePalette;
  } catch {
    // safe fallback
  }
  return palette;
}
import {
    Image as NativeImage,
    Pressable,
    ScrollView,
    ScrollViewProps,
    StyleProp,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewStyle,
} from "react-native";
import {
    Avatar,
    Badge,
    Button,
    IconButton,
    Card as PaperCard,
    Chip as PaperChip,
    Surface,
    TextInput,
} from "react-native-paper";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone = "teal" | "danger" | "warning" | "navy" | "success" | "peach" | "indigo";

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTiny = width < 340;
  const isCompact = width < 390;
  const isWidePhone = width >= 430;
  const isMediumWeb = width >= 430 && width < 768;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const shouldStack = width < 430;
  const shouldStackRow = width < 580;
  const horizontalPadding = isTiny ? 10 : isCompact ? 12 : isTablet ? 32 : 16;
  const gap = isTiny ? 10 : isCompact ? 12 : 16;
  const cardPadding = isTiny ? 12 : isCompact ? 14 : 16;
  const contentMaxWidth = isTablet ? (width >= 1024 ? 960 : 820) : undefined;
  const bottomPadding = isTablet ? 40 : 110;

  return {
    width,
    height,
    isTiny,
    isCompact,
    isWidePhone,
    isMediumWeb,
    isTablet,
    isLandscape,
    shouldStack,
    shouldStackRow,
    horizontalPadding,
    gap,
    cardPadding,
    contentMaxWidth,
    bottomPadding,
  };
}

export function ResponsiveScrollView({
  children,
  contentContainerStyle,
  bottomPadding,
  ...props
}: PropsWithChildren<
  ScrollViewProps & {
    contentContainerStyle?: StyleProp<ViewStyle>;
    bottomPadding?: number;
  }
>) {
  const layout = useResponsiveLayout();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      {...props}
      contentContainerStyle={[
        {
          alignSelf: "center",
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          minWidth: 0,
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.gap,
          paddingBottom: bottomPadding ?? layout.bottomPadding,
          gap: layout.gap,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

function toneColor(tone: Tone = "teal", pal: any = palette) {
  if (tone === "danger") return pal.danger;
  if (tone === "warning") return pal.warning;
  if (tone === "navy") return pal.navy;
  if (tone === "success") return pal.success;
  if (tone === "peach") return pal.peach;
  if (tone === "indigo") return pal.indigo;
  return pal.teal;
}

function toneSoft(tone: Tone = "teal", pal: any = palette) {
  if (tone === "danger") return pal.dangerSoft;
  if (tone === "warning") return pal.warningSoft;
  if (tone === "navy") return pal.softNavy;
  if (tone === "peach") return pal.softPeach;
  if (tone === "success") return pal.successSoft;
  if (tone === "indigo") return pal.softIndigo;
  return pal.softTeal;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function Screen({ children }: PropsWithChildren) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const pal = useAppPalette();

  useFocusEffect(
    React.useCallback(() => {
      opacity.value = 0.9;
      translateY.value = 10;
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    }, [opacity, translateY]),
  );

  const transitionStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: pal.background,
        paddingTop: insets.top,
      }}
    >
      <Animated.View style={[{ flex: 1 }, transitionStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const layout = useResponsiveLayout();
  const pal = useAppPalette();

  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          selectable
          style={[
            styles.screenTitle,
            { color: pal.text },
            layout.isCompact ? styles.screenTitleCompact : null,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text selectable style={[styles.screenSubtitle, { color: pal.muted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            flexShrink: 0,
            gap: 8,
          }}
        >
          {right}
        </View>
      ) : null}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  contentStyle,
  noAnimation,
  onPress,
  delay = 0,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  noAnimation?: boolean;
  onPress?: () => void;
  delay?: number;
}>) {
  const layout = useResponsiveLayout();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };
  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const pal = useAppPalette();

  const inner = (
    <PaperCard mode="elevated" style={[styles.card, { backgroundColor: pal.card, borderColor: pal.borderLight }, style]}>
      <PaperCard.Content
        style={[
          styles.cardContent,
          {
            paddingHorizontal: layout.cardPadding,
            paddingVertical: layout.cardPadding,
          },
          contentStyle,
        ]}
      >
        {children}
      </PaperCard.Content>
    </PaperCard>
  );

  const isFlexCell = style && (typeof style === "object" && "flex" in style && style.flex);

  const cardNode = onPress ? (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: isFlexCell ? 1 : undefined, width: "100%", minWidth: 0 }}
    >
      {inner}
    </Pressable>
  ) : (
    inner
  );

  const containerStyle = [
    { flex: isFlexCell ? 1 : undefined, width: "100%", minWidth: 0, borderRadius: radii.xl },
    style,
    animatedStyle,
  ];

  if (noAnimation) return <Animated.View style={containerStyle}>{cardNode}</Animated.View>;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(280).springify().damping(16).stiffness(140)}
      style={containerStyle}
    >
      {cardNode}
    </Animated.View>
  );
}

// ─── GradientCard ─────────────────────────────────────────────────────────────

export function GradientCard({
  children,
  variant = "primary",
  style,
  delay = 0,
}: PropsWithChildren<{ variant?: keyof typeof gradients; style?: ViewStyle; delay?: number }>) {
  const layout = useResponsiveLayout();
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(320).springify().damping(15).stiffness(130)}
      style={[styles.gradientCardWrapper, style]}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientCardInner,
          {
            padding: layout.isTiny ? 14 : layout.isCompact ? 16 : 18,
          },
        ]}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function Panel({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  const pal = useAppPalette();
  return (
    <Surface elevation={1} style={[styles.panel, { backgroundColor: pal.card, borderColor: pal.borderLight }, style]}>
      {children}
    </Surface>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
  rightNode,
}: {
  title: string;
  action?: string;
  rightNode?: React.ReactNode;
}) {
  const pal = useAppPalette();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 6,
        paddingBottom: 2,
        gap: 10,
        width: "100%",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
        <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: pal.teal }} />
        <Text selectable style={{ fontSize: typeScale.title, fontFamily: fontFamily.black, color: pal.text }}>
          {title}
        </Text>
        {action ? (
          <View style={{ borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: pal.softTeal, borderColor: pal.mintLight }}>
            <Text selectable style={{ fontSize: typeScale.caption, fontFamily: fontFamily.bold, color: pal.teal }}>
              {action}
            </Text>
          </View>
        ) : null}
      </View>
      {rightNode ? (
        <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
          {rightNode}
        </View>
      ) : null}
    </View>
  );
}

// ─── IconBubble ───────────────────────────────────────────────────────────────

export function IconBubble({
  icon,
  tone = "teal",
  size = 46,
}: {
  icon: IconName;
  tone?: Tone;
  size?: number;
}) {
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  const bg = toneSoft(tone, pal);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: `${color}30`,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        color={color}
        size={Math.round(size * 0.48)}
      />
    </View>
  );
}

// ─── HeaderAppIcon ────────────────────────────────────────────────────────────

export function HeaderAppIcon({ size = 42 }: { size?: number }) {
  const pal = useAppPalette();
  return (
    <NativeImage
      source={require("../assets/images/icon.png")}
      resizeMode="cover"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: pal.softTeal,
        borderWidth: 1.5,
        borderColor: pal.mintLight,
      }}
    />
  );
}

// ─── ScreenIntro ──────────────────────────────────────────────────────────────

export function ScreenIntro({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
}) {
  const layout = useResponsiveLayout();
  const pal = useAppPalette();
  return (
    <Card>
      <View
        style={{
          flexDirection: layout.shouldStack ? "column" : "row",
          alignItems: layout.shouldStack ? "flex-start" : "center",
          gap: 16,
        }}
      >
        <IconBubble icon={icon} tone="teal" size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text selectable style={[styles.screenIntroTitle, { color: pal.text }]}>
            {title}
          </Text>
          <Text selectable style={[styles.screenIntroSubtitle, { color: pal.muted }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  icon,
  tone = "teal",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: Tone;
}) {
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  const soft = toneSoft(tone, pal);
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).stiffness(140)}
      style={[styles.statCardWrapper, { backgroundColor: pal.card, borderColor: pal.border }]}
    >
      <View style={[styles.statIconBubble, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} color={color} size={20} />
      </View>
      <Text selectable style={[styles.statValue, { color }]}>
        {value}
      </Text>
      <Text selectable style={[styles.statLabel, { color: pal.text }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = "paw",
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  const pal = useAppPalette();
  return (
    <Card>
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIconRing}>
          <View style={[styles.emptyStateIconBg, { backgroundColor: pal.softTeal }]} />
          <MaterialCommunityIcons name={icon} color={pal.teal} size={44} />
          <View style={[styles.emptyStateHeartBadge, { backgroundColor: pal.yellow }]}>
            <MaterialCommunityIcons name="heart" color="#fff" size={13} />
          </View>
        </View>
        <Text selectable style={[styles.emptyStateTitle, { color: pal.text }]}>
          {title}
        </Text>
        <Text selectable style={[styles.emptyStateMessage, { color: pal.muted }]}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <PrimaryButton label={actionLabel} onPress={onAction} />
        ) : null}
      </View>
    </Card>
  );
}

// ─── StatusNotice ────────────────────────────────────────────────────────────

export function StatusNotice({
  title,
  message,
  icon,
  tone = "teal",
  right,
}: {
  title: string;
  message: string;
  icon: IconName;
  tone?: Tone;
  right?: React.ReactNode;
}) {
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  const soft = toneSoft(tone, pal);

  return (
    <View
      style={{
        backgroundColor: soft,
        borderColor: `${color}40`,
        borderRadius: radii.lg,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pal.card,
          borderWidth: 1,
          borderColor: `${color}40`,
        }}
      >
        <MaterialCommunityIcons name={icon} color={color} size={21} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text selectable numberOfLines={2} style={{ color: pal.text, fontSize: typeScale.body, fontFamily: fontFamily.black }}>
          {title}
        </Text>
        <Text selectable numberOfLines={3} style={{ color: pal.muted, fontSize: typeScale.bodySmall, lineHeight: lineHeights.bodySmall, fontFamily: fontFamily.medium }}>
          {message}
        </Text>
      </View>
      {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
    </View>
  );
}

// ─── UndoBanner ──────────────────────────────────────────────────────────────

export function UndoBanner({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const pal = useAppPalette();
  return (
    <View
      style={{
        backgroundColor: palette.softNavy,
        borderColor: "#C9D7F7",
        borderRadius: radii.lg,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
        padding: 12,
      }}
    >
      <MaterialCommunityIcons name="restore" color={palette.navy} size={22} />
      <Text selectable numberOfLines={2} style={{ flex: 1, minWidth: 0, color: pal.text, fontSize: typeScale.bodySmall, lineHeight: lineHeights.bodySmall, fontFamily: fontFamily.bold }}>
        {message}
      </Text>
      <CompactButton label="Undo" icon="undo" onPress={onUndo} />
      <IconButton
        accessibilityLabel="Dismiss undo"
        icon="close"
        iconColor={palette.muted}
        size={18}
        onPress={onDismiss}
        style={{ margin: 0, width: 36, height: 36 }}
      />
    </View>
  );
}

// ─── RowAction ────────────────────────────────────────────────────────────────

export function RowAction({
  icon,
  onPress,
  danger,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
  label?: string;
}) {
  const pal = useAppPalette();
  const actionColor = danger ? pal.danger : pal.textSecondary || pal.text;
  const bgColor = danger ? pal.dangerSoft : pal.neutralBg;
  const borderColor = danger ? `${pal.danger}40` : pal.borderLight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: radii.md,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} color={actionColor} size={18} />
    </Pressable>
  );
}

// ─── HeaderActionButton ───────────────────────────────────────────────────────

export function HeaderActionButton({
  icon = "plus",
  label,
  onPress,
  active,
  danger,
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const pal = useAppPalette();
  const color = danger ? palette.danger : pal.teal;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityLabel={label}
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        onPress={onPress}
        style={[
          styles.headerActionBtn,
          {
            backgroundColor: active
              ? pal.softTeal
              : danger
                ? palette.dangerSoft
                : pal.teal,
            borderColor: active
              ? pal.mint
              : danger
                ? "#FECACA"
                : pal.tealDeep,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={active || danger ? color : "#fff"}
        />
      </Pressable>
    </Animated.View>
  );
}

// ─── CompactButton ────────────────────────────────────────────────────────────

export function CompactButton({
  label,
  onPress,
  icon,
  primary,
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const pal = useAppPalette();
  const bgColor = primary
    ? pal.teal
    : danger
      ? pal.dangerSoft
      : pal.backgroundAlt || pal.card;
  const textColor = primary
    ? "#FFFFFF"
    : danger
      ? pal.danger
      : pal.textSecondary || pal.muted;
  const borderColor = primary
    ? pal.teal
    : danger
      ? "#FECACA"
      : pal.border;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: radii.sm,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
        opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? <MaterialCommunityIcons name={icon} color={textColor} size={16} /> : null}
      <Text style={{ color: textColor, fontSize: 13, fontFamily: fontFamily.bold, letterSpacing: 0.1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── FormActions ──────────────────────────────────────────────────────────────

export function FormActions({
  submitLabel,
  onSubmit,
  onCancel,
  submitIcon,
  disabled,
}: {
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  submitIcon?: IconName;
  disabled?: boolean;
}) {
  return (
    <View style={styles.formActions}>
      <CompactButton label="Cancel" danger onPress={onCancel} />
      <CompactButton
        label={submitLabel}
        icon={submitIcon}
        primary
        disabled={disabled}
        onPress={onSubmit}
      />
    </View>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

export function PrimaryButton({
  label,
  onPress,
  icon = "plus",
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Button
        mode="contained"
        icon={icon}
        disabled={disabled}
        buttonColor={danger ? palette.danger : palette.teal}
        textColor="#fff"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[
          styles.primaryBtn,
          disabled
            ? undefined
            : { boxShadow: "0 4px 14px rgba(34,193,168,0.35)" },
        ]}
        contentStyle={{ minHeight: 50, paddingHorizontal: 14 }}
        labelStyle={{
          fontFamily: fontFamily.bold,
          letterSpacing: 0.3,
          fontSize: typeScale.action,
        }}
      >
        {label}
      </Button>
    </Animated.View>
  );
}

// ─── GhostButton ──────────────────────────────────────────────────────────────

export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Button
      mode="outlined"
      textColor={danger ? palette.danger : palette.text}
      onPress={onPress}
      style={{
        borderRadius: radii.pill,
        borderColor: danger ? palette.danger : palette.border,
        backgroundColor: palette.card,
      }}
      contentStyle={{ minHeight: 46, paddingHorizontal: 10 }}
      labelStyle={{
        fontFamily: fontFamily.bold,
        letterSpacing: 0.2,
        fontSize: typeScale.action,
      }}
    >
      {label}
    </Button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  icon,
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  icon?: IconName;
  error?: boolean;
  helperText?: string;
}) {
  const pal = useAppPalette();
  return (
    <View style={{ gap: 4, width: "100%" }}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={pal.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        error={error}
        left={icon ? <TextInput.Icon icon={icon} color={error ? pal.danger : pal.teal} /> : undefined}
        style={{ backgroundColor: pal.card, minHeight: multiline ? 90 : 52 }}
        textColor={pal.text}
        outlineStyle={{ borderRadius: radii.lg, borderWidth: 1.5 }}
        outlineColor={error ? pal.danger : pal.border}
        activeOutlineColor={error ? pal.danger : pal.teal}
      />
      {helperText ? (
        <Text style={{ color: error ? pal.danger : pal.muted, fontSize: 12, fontFamily: fontFamily.medium, paddingLeft: 4 }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

// ─── QuickActionButton ────────────────────────────────────────────────────────

export function QuickActionButton({
  title,
  subtitle,
  icon,
  tone = "teal",
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  tone?: Tone;
  onPress: () => void;
}) {
  const pal = useAppPalette();
  const layout = useResponsiveLayout();
  const color = toneColor(tone, pal);
  const softBg = toneSoft(tone, pal);

  return (
    <Card
      onPress={onPress}
      style={{ flex: 1, minWidth: 0 }}
      contentStyle={{
        paddingHorizontal: layout.isTiny ? 2 : layout.isCompact ? 3 : 6,
        paddingVertical: layout.isTiny ? 6 : layout.isCompact ? 8 : 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ gap: layout.isCompact ? 4 : 6, alignItems: "center", width: "100%" }}>
        <View
          style={{
            width: layout.isTiny ? 28 : layout.isCompact ? 32 : 36,
            height: layout.isTiny ? 28 : layout.isCompact ? 32 : 36,
            borderRadius: radii.md,
            backgroundColor: softBg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: `${color}30`,
          }}
        >
          <MaterialCommunityIcons
            name={icon}
            color={color}
            size={layout.isTiny ? 15 : layout.isCompact ? 17 : 19}
          />
        </View>
        <View style={{ gap: 0, alignItems: "center", width: "100%" }}>
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              color: pal.text,
              fontSize: layout.isTiny ? 10 : layout.isCompact ? 11 : 12,
              fontFamily: fontFamily.black,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              color: pal.muted,
              fontSize: layout.isTiny ? 8 : layout.isCompact ? 9 : 10,
              fontFamily: fontFamily.medium,
              textAlign: "center",
              marginTop: 1,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── SelectDropdown ────────────────────────────────────────────────────────────

export type DropdownOption<T extends string = string> = {
  label: string;
  value: T;
  subtitle?: string;
  icon?: IconName;
};

export function SelectDropdown<T extends string = string>({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  icon = "clock-outline",
}: {
  label?: string;
  value: T;
  options: DropdownOption<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: IconName;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const pal = useAppPalette();

  return (
    <View style={{ gap: 6, marginVertical: 4 }}>
      {label ? (
        <Text style={{ color: pal.textSecondary, fontSize: 13, fontFamily: fontFamily.bold, letterSpacing: 0.2 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        disabled={disabled}
        onPress={() => setIsOpen((prev) => !prev)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: isOpen ? pal.softTeal : pal.card,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: isOpen ? pal.teal : pal.borderLight,
          shadowColor: isOpen ? pal.teal : "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isOpen ? 0.08 : 0.03,
          shadowRadius: 6,
          elevation: isOpen ? 2 : 1,
          opacity: disabled ? 0.6 : pressed ? 0.88 : 1,
        })}
      >
        <IconBubble icon={selectedOption?.icon ?? icon} tone={isOpen ? "teal" : "navy"} size={36} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={{ color: selectedOption ? pal.text : pal.muted, fontSize: 15, fontFamily: fontFamily.bold }}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          {selectedOption?.subtitle ? (
            <Text numberOfLines={1} style={{ color: pal.muted, fontSize: 12, fontFamily: fontFamily.medium }}>
              {selectedOption.subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={isOpen ? "chevron-up" : "chevron-down"}
          color={isOpen ? pal.teal : pal.muted}
          size={22}
        />
      </Pressable>

      {isOpen ? (
        <View
          style={{
            backgroundColor: pal.card,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: pal.mintLight,
            padding: 6,
            gap: 4,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 5,
            marginTop: 4,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                onPress={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: radii.sm,
                  backgroundColor: isSelected ? pal.softTeal : pressed ? pal.neutralBg : "transparent",
                  borderLeftWidth: isSelected ? 3 : 0,
                  borderLeftColor: isSelected ? pal.teal : "transparent",
                })}
              >
                {opt.icon ? (
                  <MaterialCommunityIcons
                    name={opt.icon}
                    color={isSelected ? pal.teal : pal.muted}
                    size={20}
                  />
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: isSelected ? pal.teal : pal.text, fontSize: 14, fontFamily: isSelected ? fontFamily.black : fontFamily.medium }}>
                    {opt.label}
                  </Text>
                  {opt.subtitle ? (
                    <Text style={{ color: pal.muted, fontSize: 12, fontFamily: fontFamily.regular }}>
                      {opt.subtitle}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <MaterialCommunityIcons name="check-circle" color={pal.teal} size={20} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  label,
  active,
  onPress,
  tone = "teal",
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: Tone;
  icon?: IconName;
}) {
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  const visibleIcon = icon ?? (active ? "check-circle" : undefined);
  const bg = active ? color : pal.card;
  const border = active ? color : `${color}40`;
  const textColor = active ? "#FFFFFF" : color;

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: radii.pill,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 11,
        paddingVertical: 5,
        minHeight: 28,
        flexShrink: 0,
      }}
    >
      {visibleIcon ? (
        <MaterialCommunityIcons
          name={visibleIcon}
          color={textColor}
          size={14}
        />
      ) : null}
      <Text
        selectable={false}
        style={{
          color: textColor,
          fontFamily: fontFamily.bold,
          fontSize: typeScale.caption,
          letterSpacing: 0.2,
          lineHeight: 16,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── PetAvatar ────────────────────────────────────────────────────────────────

export function PetAvatar({ pet, size = 62 }: { pet?: Pet; size?: number }) {
  const pal = useAppPalette();
  if (pet?.photoUri) {
    return (
      <ExpoImage
        source={{ uri: pet.photoUri }}
        style={{
          width: size,
          height: size,
          borderRadius: radii.lg,
          backgroundColor: pal.softTeal,
        }}
        contentFit="cover"
      />
    );
  }
  const icon =
    pet?.species === "Cat" ? "cat" : pet?.species === "Dog" ? "dog" : "paw";
  const tone: Tone = pet?.species === "Cat" ? "warning" : "teal";
  return (
    <Avatar.Icon
      size={size}
      icon={icon}
      color={toneColor(tone, pal)}
      style={{ backgroundColor: toneSoft(tone, pal), borderRadius: radii.lg }}
    />
  );
}

// ─── PetCard ──────────────────────────────────────────────────────────────────

export function PetCard({ pet }: { pet: Pet }) {
  const layout = useResponsiveLayout();
  const pal = useAppPalette();
  const isCat = pet.species === "Cat";
  return (
    <Card
      style={{
        flex: 1,
        minWidth: layout.isCompact ? 144 : 160,
        maxWidth: layout.isTablet ? 240 : 200,
        backgroundColor: isCat ? pal.softPeach : pal.softTeal,
        borderColor: isCat ? "#FFE1CC" : pal.border,
      }}
    >
      <View style={{ gap: 12 }}>
        <PetAvatar pet={pet} size={96} />
        <View style={{ gap: 5 }}>
          <Text
            selectable
            style={{
              color: pal.text,
              fontFamily: fontFamily.black,
              fontSize: 18,
            }}
          >
            {pet.name}
          </Text>
          <Text
            selectable
            style={{
              color: pal.muted,
              fontSize: typeScale.bodySmall,
              fontFamily: fontFamily.semiBold,
            }}
          >
            {pet.breed || pet.species}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Badge style={{ backgroundColor: pal.card, color: pal.text }}>
              {pet.species}
            </Badge>
            <Badge style={{ backgroundColor: pal.teal }}>
              {getLifeStage(pet.birthday, pet.species)}
            </Badge>
          </View>
          <Text selectable style={{ color: pal.text, fontSize: typeScale.bodySmall }}>
            {calculateAge(pet.birthday)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── ReminderPill ─────────────────────────────────────────────────────────────

export function ReminderPill({ reminder }: { reminder: Reminder }) {
  const status = getReminderStatus(reminder);
  const tone: Tone =
    status === "Overdue"
      ? "danger"
      : status === "Due Today"
        ? "warning"
        : status === "Completed"
          ? "success"
          : "teal";
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  const icon: IconName =
    status === "Overdue"
      ? "alert-circle-outline"
      : status === "Due Today"
        ? "clock-alert-outline"
        : status === "Completed"
          ? "check-circle-outline"
          : "calendar-clock";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: toneSoft(tone, pal),
        borderRadius: radii.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: `${color}35`,
      }}
    >
      <MaterialCommunityIcons name={icon} color={color} size={13} />
      <Text
        selectable
        style={{ color, fontSize: typeScale.caption, fontFamily: fontFamily.bold }}
      >
        {status}
      </Text>
    </View>
  );
}

// ─── TimelineRail ─────────────────────────────────────────────────────────────

export function TimelineRail({ tone = "teal" }: { tone?: Tone }) {
  const pal = useAppPalette();
  const color = toneColor(tone, pal);
  return (
    <View style={{ width: 28, alignItems: "center", alignSelf: "stretch" }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          marginTop: 5,
        }}
      />
      <View
        style={{
          width: 3,
          flex: 1,
          backgroundColor: toneSoft(tone, pal),
          borderRadius: 2,
          marginTop: 4,
        }}
      />
    </View>
  );
}

// ─── BrandMark ────────────────────────────────────────────────────────────────

export function BrandMark({ compact }: { compact?: boolean }) {
  const pal = useAppPalette();
  const { isCompact } = useResponsiveLayout();
  const size = compact ? 64 : isCompact ? 92 : 116;
  return (
    <View style={{ alignItems: "center", gap: compact ? 4 : 10 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: compact ? 3 : 5,
          borderColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.95)",
          boxShadow: "0 8px 32px rgba(34,193,168,0.25)",
        }}
      >
        <MaterialCommunityIcons
          name="paw"
          color={palette.navy}
          size={compact ? 30 : 54}
        />
        <View
          style={{
            position: "absolute",
            right: compact ? 2 : 10,
            bottom: compact ? 2 : 10,
            backgroundColor: palette.teal,
            borderRadius: radii.pill,
            padding: compact ? 4 : 8,
            borderWidth: 2,
            borderColor: "#fff",
          }}
        >
          <MaterialCommunityIcons
            name="shield-plus-outline"
            color="#fff"
            size={compact ? 15 : 24}
          />
        </View>
      </View>
      <Text
        selectable
        style={{
          color: pal.text,
          fontSize: compact ? 26 : 38,
          fontFamily: fontFamily.black,
          letterSpacing: -1,
        }}
      >
        PetNexa{" "}
        <Text style={{ color: compact ? pal.yellow : pal.teal }}>
          AI
        </Text>
      </Text>
      {!compact ? (
        <Text
          selectable
          style={{
            color: pal.muted,
            fontSize: typeScale.body,
            fontFamily: fontFamily.medium,
          }}
        >
          Smart Pet Health, Connected Care.
        </Text>
      ) : null}
    </View>
  );
}

// ─── StatusRail ───────────────────────────────────────────────────────────────

export function StatusRail({ tone = "teal" }: { tone?: Tone }) {
  const layout = useResponsiveLayout();
  const pal = useAppPalette();
  if (layout.shouldStack) {
    return (
      <View
        style={{
          height: 5,
          alignSelf: "stretch",
          borderRadius: 99,
          backgroundColor: toneColor(tone, pal),
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: 5,
        alignSelf: "stretch",
        borderRadius: 99,
        backgroundColor: toneColor(tone, pal),
        marginRight: 4,
      }}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 4,
    gap: 12,
  },
  screenHeaderStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  screenTitle: {
    fontSize: typeScale.screen,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
  },
  screenTitleCompact: {
    fontSize: 26,
  },
  screenSubtitle: {
    fontSize: typeScale.bodySmall,
    fontFamily: fontFamily.medium,
    marginTop: 1,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    boxShadow: "0 2px 12px rgba(30, 58, 138, 0.06)",
    width: "100%",
    minWidth: 0,
  },
  cardContent: {
    gap: 12,
  },
  gradientCardWrapper: {
    width: "100%",
    minWidth: 0,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    boxShadow: "0 8px 24px rgba(30, 58, 138, 0.10)",
  },
  gradientCardInner: {
    padding: 18,
    gap: 12,
  },
  panel: {
    borderRadius: radii.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    boxShadow: "0 2px 12px rgba(30, 58, 138, 0.06)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    paddingTop: 6,
    paddingBottom: 2,
    gap: 10,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flexShrink: 1,
    flexWrap: "wrap",
    minWidth: 0,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 6,
  },
  sectionHeaderStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  sectionHeaderRightStacked: {
    justifyContent: "flex-start",
    alignSelf: "stretch",
  },
  sectionHeaderAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionHeaderTitle: {
    fontSize: typeScale.title,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
    flexShrink: 1,
  },
  sectionHeaderBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderAction: {
    fontSize: typeScale.caption,
    fontFamily: fontFamily.bold,
  },
  screenIntroTitle: {
    fontSize: typeScale.headline,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
  },
  screenIntroSubtitle: {
    lineHeight: lineHeights.body,
    fontSize: typeScale.body,
    fontFamily: fontFamily.medium,
  },
  statCardWrapper: {
    flex: 1,
    minWidth: 92,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 14,
    gap: 7,
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(30, 58, 138, 0.06)",
  },
  statIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: fontFamily.black,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
  },
  statLabel: {
    fontSize: typeScale.caption,
    fontFamily: fontFamily.bold,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  emptyStateContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  emptyStateIconRing: {
    width: 96,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateIconBg: {
    position: "absolute",
    width: 82,
    height: 64,
    borderRadius: 28,
    opacity: 0.95,
  },
  emptyStateHeartBadge: {
    position: "absolute",
    right: 9,
    bottom: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: typeScale.title,
    fontFamily: fontFamily.black,
    textAlign: "center",
  },
  emptyStateMessage: {
    textAlign: "center",
    lineHeight: lineHeights.body,
    maxWidth: 280,
    fontFamily: fontFamily.medium,
    fontSize: typeScale.body,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 4,
  },
  primaryBtn: {
    borderRadius: radii.pill,
  },
  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
