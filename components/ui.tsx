import {
    fontFamily,
    gradients,
    lineHeights,
    palette,
    radii,
    typeScale,
} from "@/constants/theme";
import { Pet, Reminder } from "@/types/domain";
import { calculateAge, getLifeStage, getReminderStatus } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { PropsWithChildren } from "react";
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
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone = "teal" | "danger" | "warning" | "navy" | "success" | "peach";

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTiny = width < 340;
  const isCompact = width < 390;
  const isWidePhone = width >= 430;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const shouldStack = width < 430;
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
    isTablet,
    isLandscape,
    shouldStack,
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

function toneColor(tone: Tone = "teal") {
  if (tone === "danger") return palette.danger;
  if (tone === "warning") return palette.warning;
  if (tone === "navy") return palette.navy;
  if (tone === "success") return palette.success;
  if (tone === "peach") return palette.peach;
  return palette.teal;
}

function toneSoft(tone: Tone = "teal") {
  if (tone === "danger") return palette.dangerSoft;
  if (tone === "warning") return palette.warningSoft;
  if (tone === "navy") return palette.softNavy;
  if (tone === "peach") return palette.softPeach;
  if (tone === "success") return palette.successSoft;
  return palette.softTeal;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function Screen({ children }: PropsWithChildren) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const insets = useSafeAreaInsets();

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
        backgroundColor: palette.background,
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

  return (
    <View
      style={[
        styles.screenHeader,
        layout.shouldStack ? styles.screenHeaderStacked : null,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          selectable
          style={[
            styles.screenTitle,
            layout.isCompact ? styles.screenTitleCompact : null,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text selectable style={styles.screenSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: layout.shouldStack ? "flex-start" : "flex-end",
            flexWrap: "wrap",
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
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  noAnimation?: boolean;
}>) {
  const layout = useResponsiveLayout();
  const inner = (
    <PaperCard mode="elevated" style={[styles.card, style]}>
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

  if (noAnimation)
    return <View style={{ minWidth: 0, borderRadius: radii.xl }}>{inner}</View>;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      style={{ minWidth: 0, borderRadius: radii.xl }}
    >
      {inner}
    </Animated.View>
  );
}

// ─── GradientCard ─────────────────────────────────────────────────────────────

export function GradientCard({
  children,
  variant = "primary",
  style,
}: PropsWithChildren<{ variant?: keyof typeof gradients; style?: ViewStyle }>) {
  const layout = useResponsiveLayout();
  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
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
  return (
    <Surface elevation={1} style={[styles.panel, style]}>
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
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.sectionHeader,
        layout.shouldStack && rightNode ? styles.sectionHeaderStacked : null,
      ]}
    >
      <View style={[styles.sectionHeaderLeft]}>
        <View style={styles.sectionHeaderAccent} />
        <Text selectable style={styles.sectionHeaderTitle}>
          {title}
        </Text>
        {action ? (
          <View style={styles.sectionHeaderBadge}>
            <Text selectable style={styles.sectionHeaderAction}>
              {action}
            </Text>
          </View>
        ) : null}
      </View>
      {rightNode ? (
        <View
          style={[
            styles.sectionHeaderRight,
            layout.shouldStack ? styles.sectionHeaderRightStacked : null,
          ]}
        >
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
  const color = toneColor(tone);
  const bg = toneSoft(tone);
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
  return (
    <NativeImage
      source={require("../assets/images/icon.png")}
      resizeMode="cover"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: palette.softTeal,
        borderWidth: 1.5,
        borderColor: palette.mintLight,
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
  return (
    <GradientCard variant="calm">
      <View
        style={{
          flexDirection: layout.shouldStack ? "column" : "row",
          alignItems: layout.shouldStack ? "flex-start" : "center",
          gap: 14,
        }}
      >
        <IconBubble icon={icon} size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text selectable style={styles.screenIntroTitle}>
            {title}
          </Text>
          <Text selectable style={styles.screenIntroSubtitle}>
            {subtitle}
          </Text>
        </View>
      </View>
    </GradientCard>
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
  const color = toneColor(tone);
  const soft = toneSoft(tone);
  return (
    <Animated.View
      entering={FadeInUp.duration(240)}
      style={[styles.statCardWrapper, { borderColor: `${color}25` }]}
    >
      <View style={[styles.statIconBubble, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} color={color} size={20} />
      </View>
      <Text selectable style={[styles.statValue, { color }]}>
        {value}
      </Text>
      <Text selectable style={styles.statLabel}>
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
  return (
    <GradientCard variant="calm">
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIconRing}>
          <View style={styles.emptyStateIconBg} />
          <MaterialCommunityIcons name={icon} color={palette.teal} size={44} />
          <View style={styles.emptyStateHeartBadge}>
            <MaterialCommunityIcons name="heart" color="#fff" size={13} />
          </View>
        </View>
        <Text selectable style={styles.emptyStateTitle}>
          {title}
        </Text>
        <Text selectable style={styles.emptyStateMessage}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <PrimaryButton label={actionLabel} onPress={onAction} />
        ) : null}
      </View>
    </GradientCard>
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
  const actionColor = danger ? palette.danger : palette.navy;

  return (
    <IconButton
      icon={icon}
      size={20}
      iconColor={actionColor}
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        margin: 0,
        backgroundColor: "#fff",
        borderWidth: danger ? 1.5 : 1,
        borderColor: danger ? palette.danger : palette.border,
        borderRadius: radii.md,
        width: 44,
        height: 44,
        boxShadow: danger ? "0 2px 8px rgba(220, 38, 38, 0.16)" : undefined,
      }}
    />
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
  const color = danger ? palette.danger : palette.teal;
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
              ? palette.softTeal
              : danger
                ? palette.dangerSoft
                : palette.teal,
            borderColor: active
              ? palette.mint
              : danger
                ? "#FECACA"
                : palette.tealDeep,
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
  const iconColor = danger ? palette.danger : primary ? "#fff" : palette.navy;
  const buttonIcon = icon
    ? ({ size }: { color: string; size: number }) => (
        <MaterialCommunityIcons name={icon} color={iconColor} size={size} />
      )
    : undefined;

  return (
    <Button
      compact
      icon={buttonIcon}
      mode={primary ? "contained" : "text"}
      disabled={disabled}
      buttonColor={primary ? palette.teal : undefined}
      textColor={iconColor}
      onPress={onPress}
      style={{ borderRadius: radii.md }}
      contentStyle={{ minHeight: 40, paddingHorizontal: primary ? 10 : 4 }}
      labelStyle={{
        fontSize: typeScale.label,
        fontFamily: fontFamily.bold,
        letterSpacing: 0,
        marginHorizontal: 0,
      }}
    >
      {label}
    </Button>
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
        backgroundColor: "#fff",
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
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      keyboardType={keyboardType}
      style={{ backgroundColor: "#fff", minHeight: multiline ? 90 : 50 }}
      outlineStyle={{ borderRadius: radii.md, borderWidth: 1.5 }}
      outlineColor={palette.border}
      activeOutlineColor={palette.teal}
    />
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
  const color = toneColor(tone);
  const visibleIcon = icon ?? (active ? "check-circle" : undefined);
  const chipIcon = visibleIcon
    ? ({ size }: { color: string; size: number }) => (
        <MaterialCommunityIcons
          name={visibleIcon}
          color={active ? "#fff" : color}
          size={size}
        />
      )
    : undefined;
  return (
    <PaperChip
      selected={active}
      icon={chipIcon}
      onPress={onPress}
      mode={active ? "flat" : "outlined"}
      compact
      selectedColor={active ? "#fff" : color}
      showSelectedCheck={false}
      textStyle={{
        color: active ? "#fff" : color,
        fontFamily: fontFamily.bold,
        fontSize: typeScale.caption,
        letterSpacing: 0.2,
      }}
      style={{
        backgroundColor: active ? color : "#fff",
        borderColor: active ? color : `${color}40`,
        borderRadius: radii.pill,
      }}
    >
      {label}
    </PaperChip>
  );
}

// ─── PetAvatar ────────────────────────────────────────────────────────────────

export function PetAvatar({ pet, size = 62 }: { pet?: Pet; size?: number }) {
  if (pet?.photoUri) {
    return (
      <ExpoImage
        source={{ uri: pet.photoUri }}
        style={{
          width: size,
          height: size,
          borderRadius: radii.lg,
          backgroundColor: palette.softTeal,
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
      color={toneColor(tone)}
      style={{ backgroundColor: toneSoft(tone), borderRadius: radii.lg }}
    />
  );
}

// ─── PetCard ──────────────────────────────────────────────────────────────────

export function PetCard({ pet }: { pet: Pet }) {
  const layout = useResponsiveLayout();
  const isCat = pet.species === "Cat";
  return (
    <Card
      style={{
        width: layout.isTablet ? 220 : layout.isCompact ? 156 : 184,
        backgroundColor: isCat ? palette.softPeach : palette.softTeal,
        borderColor: isCat ? "#FFE1CC" : palette.mintLight,
      }}
    >
      <View style={{ gap: 12 }}>
        <PetAvatar pet={pet} size={96} />
        <View style={{ gap: 5 }}>
          <Text
            selectable
            style={{
              color: palette.text,
              fontFamily: fontFamily.black,
              fontSize: 18,
            }}
          >
            {pet.name}
          </Text>
          <Text
            selectable
            style={{
              color: palette.muted,
              fontSize: typeScale.bodySmall,
              fontFamily: fontFamily.semiBold,
            }}
          >
            {pet.breed || pet.species}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Badge style={{ backgroundColor: "#fff", color: palette.text }}>
              {pet.species}
            </Badge>
            <Badge style={{ backgroundColor: palette.teal }}>
              {getLifeStage(pet.birthday, pet.species)}
            </Badge>
          </View>
          <Text selectable style={{ color: palette.text, fontSize: typeScale.bodySmall }}>
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
  const color = toneColor(tone);
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
        backgroundColor: toneSoft(tone),
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
  const color = toneColor(tone);
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
          backgroundColor: toneSoft(tone),
          borderRadius: 2,
          marginTop: 4,
        }}
      />
    </View>
  );
}

// ─── BrandMark ────────────────────────────────────────────────────────────────

export function BrandMark({ compact }: { compact?: boolean }) {
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
          color: compact ? "#fff" : palette.text,
          fontSize: compact ? typeScale.title : isCompact ? 28 : 34,
          fontFamily: fontFamily.black,
          letterSpacing: 0,
        }}
      >
        PetNexa{" "}
        <Text style={{ color: compact ? palette.yellow : palette.teal }}>
          AI
        </Text>
      </Text>
      {!compact ? (
        <Text
          selectable
          style={{
            color: palette.muted,
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
  if (layout.shouldStack) {
    return (
      <View
        style={{
          height: 5,
          alignSelf: "stretch",
          borderRadius: 99,
          backgroundColor: toneColor(tone),
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
        backgroundColor: toneColor(tone),
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
    color: palette.text,
    fontSize: typeScale.screen,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
  },
  screenTitleCompact: {
    fontSize: 26,
  },
  screenSubtitle: {
    color: palette.muted,
    fontSize: typeScale.bodySmall,
    fontFamily: fontFamily.medium,
    marginTop: 1,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
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
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.borderLight,
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
    backgroundColor: palette.teal,
  },
  sectionHeaderTitle: {
    color: palette.text,
    fontSize: typeScale.title,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
    flexShrink: 1,
  },
  sectionHeaderBadge: {
    backgroundColor: palette.softTeal,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.mintLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderAction: {
    color: palette.teal,
    fontSize: typeScale.caption,
    fontFamily: fontFamily.bold,
  },
  screenIntroTitle: {
    color: palette.text,
    fontSize: typeScale.headline,
    fontFamily: fontFamily.black,
    letterSpacing: 0,
  },
  screenIntroSubtitle: {
    color: palette.muted,
    lineHeight: lineHeights.body,
    fontSize: typeScale.body,
    fontFamily: fontFamily.medium,
  },
  statCardWrapper: {
    flex: 1,
    minWidth: 92,
    borderRadius: radii.lg,
    backgroundColor: "#fff",
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
    color: palette.text,
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
    backgroundColor: "#fff",
    opacity: 0.95,
  },
  emptyStateHeartBadge: {
    position: "absolute",
    right: 9,
    bottom: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    color: palette.text,
    fontSize: typeScale.title,
    fontFamily: fontFamily.black,
    textAlign: "center",
  },
  emptyStateMessage: {
    color: palette.muted,
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
