import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { PropsWithChildren } from "react";
import { Image as NativeImage, Pressable, Text, View, ViewStyle } from "react-native";
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Avatar, Badge, Button, Card as PaperCard, Chip as PaperChip, IconButton, Surface, TextInput } from "react-native-paper";
import { gradients, palette, radii, shadow } from "@/constants/theme";
import { Pet, Reminder } from "@/types/domain";
import { calculateAge, getLifeStage, getReminderStatus } from "@/utils/date";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone = "teal" | "danger" | "warning" | "navy" | "success" | "peach";

function toneColor(tone: Tone = "teal") {
  if (tone === "danger") return palette.danger;
  if (tone === "warning") return palette.warning;
  if (tone === "navy") return palette.navy;
  if (tone === "success") return palette.success;
  if (tone === "peach") return palette.peach;
  return palette.teal;
}

function toneSoft(tone: Tone = "teal") {
  if (tone === "danger") return palette.softDanger;
  if (tone === "warning") return palette.softYellow;
  if (tone === "navy") return palette.softNavy;
  if (tone === "peach") return palette.softPeach;
  return palette.softTeal;
}

export function Screen({ children }: PropsWithChildren) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      opacity.value = 0.88;
      translateY.value = 8;
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
    }, [opacity, translateY]),
  );

  const transitionStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Animated.View style={[{ flex: 1 }, transitionStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <Animated.View entering={FadeInUp.duration(220)} style={{ borderRadius: radii.lg }}>
      <PaperCard
        mode="elevated"
        style={[{ backgroundColor: palette.card, borderRadius: radii.lg, borderWidth: 1, borderColor: "#E8EEF4", boxShadow: shadow.sm }, style]}
      >
        <PaperCard.Content style={{ gap: 12, paddingVertical: 15, paddingHorizontal: 15 }}>
          {children}
        </PaperCard.Content>
      </PaperCard>
    </Animated.View>
  );
}

export function GradientCard({ children, variant = "primary", style }: PropsWithChildren<{ variant?: keyof typeof gradients; style?: ViewStyle }>) {
  return (
    <Animated.View entering={FadeInUp.duration(260)} style={[{ borderRadius: radii.xl, overflow: "hidden", borderWidth: 1, borderColor: "#DDEEEB", boxShadow: shadow.md }, style]}>
      <LinearGradient colors={gradients[variant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, gap: 12 }}>
        {children}
      </LinearGradient>
    </Animated.View>
  );
}

export function Panel({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <Surface elevation={1} style={[{ backgroundColor: palette.card, borderRadius: radii.lg, padding: 16, gap: 12, boxShadow: shadow.sm, borderWidth: 1, borderColor: "#E8EEF4" }, style]}>
      {children}
    </Surface>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4, gap: 10 }}>
      <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900", letterSpacing: 0, flexShrink: 1 }}>{title}</Text>
      {action ? (
        <View style={{ backgroundColor: palette.softTeal, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.mint, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text selectable style={{ color: palette.teal, fontSize: 11, fontWeight: "900" }}>{action}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function IconBubble({ icon, tone = "teal", size = 46 }: { icon: IconName; tone?: Tone; size?: number }) {
  const color = toneColor(tone);
  return (
    <View style={{ width: size, height: size, borderRadius: radii.pill, backgroundColor: toneSoft(tone), alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.78)" }}>
      <MaterialCommunityIcons name={icon} color={color} size={Math.round(size * 0.5)} />
    </View>
  );
}

export function HeaderAppIcon({ size = 42 }: { size?: number }) {
  return (
    <NativeImage
      source={require("../assets/images/icon.png")}
      resizeMode="cover"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: "#fff", borderWidth: 1, borderColor: "#DDEEEB" }}
    />
  );
}

export function ScreenIntro({ title, subtitle, icon }: { title: string; subtitle: string; icon: IconName }) {
  return (
    <GradientCard variant="calm">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <IconBubble icon={icon} size={54} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ color: palette.text, fontSize: 25, fontWeight: "900", letterSpacing: 0 }}>{title}</Text>
          <Text selectable style={{ color: palette.muted, lineHeight: 21, fontSize: 14 }}>{subtitle}</Text>
        </View>
      </View>
    </GradientCard>
  );
}

export function StatCard({ label, value, icon, tone = "teal" }: { label: string; value: string | number; icon: IconName; tone?: Tone }) {
  const color = toneColor(tone);
  return (
    <Surface elevation={1} style={{ flex: 1, minWidth: 92, borderRadius: radii.lg, backgroundColor: "#fff", borderWidth: 1, borderColor: toneSoft(tone), padding: 12, gap: 6, alignItems: "center", boxShadow: shadow.sm }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: toneSoft(tone), alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons name={icon} color={color} size={18} />
      </View>
      <Text selectable style={{ color, fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{value}</Text>
      <Text selectable style={{ color: palette.text, fontSize: 11, fontWeight: "800", textAlign: "center" }}>{label}</Text>
    </Surface>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, icon = "paw" }: { title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: IconName }) {
  return (
    <GradientCard variant="calm">
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 4 }}>
        <View style={{ width: 96, height: 76, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 82, height: 64, borderRadius: 28, backgroundColor: "#fff", opacity: 0.95 }} />
          <MaterialCommunityIcons name={icon} color={palette.teal} size={42} />
          <View style={{ position: "absolute", right: 9, bottom: 7, width: 24, height: 24, borderRadius: 12, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="heart" color="#fff" size={14} />
          </View>
        </View>
        <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>{title}</Text>
        <Text selectable style={{ color: palette.muted, textAlign: "center", lineHeight: 21, maxWidth: 280 }}>{message}</Text>
        {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
      </View>
    </GradientCard>
  );
}

export function RowAction({ icon, onPress, danger }: { icon: IconName; onPress: () => void; danger?: boolean }) {
  return (
    <IconButton
      icon={icon}
      size={20}
      iconColor={danger ? palette.danger : palette.muted}
      onPress={onPress}
      style={{ margin: 0, backgroundColor: danger ? palette.softDanger : "#F7FAFC", borderWidth: 1, borderColor: danger ? "#FED7D7" : palette.border }}
    />
  );
}

export function HeaderActionButton({ icon = "plus", label, onPress, active, danger }: { icon?: IconName; label: string; onPress: () => void; active?: boolean; danger?: boolean }) {
  const color = danger ? palette.danger : palette.teal;
  return (
    <IconButton
      accessibilityLabel={label}
      icon={icon}
      mode={active || danger ? "contained-tonal" : "contained"}
      size={22}
      iconColor={active || danger ? color : "#fff"}
      containerColor={active ? palette.softTeal : danger ? palette.softDanger : palette.teal}
      onPress={onPress}
      style={{ width: 42, height: 42, margin: 0, borderRadius: 16, borderWidth: 1, borderColor: active ? palette.mint : danger ? "#FECACA" : palette.teal }}
    />
  );
}

export function CompactButton({ label, onPress, icon, primary, danger, disabled }: { label: string; onPress: () => void; icon?: IconName; primary?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <Button
      compact
      icon={icon}
      mode={primary ? "contained" : "text"}
      disabled={disabled}
      buttonColor={primary ? palette.teal : undefined}
      textColor={danger ? palette.danger : primary ? "#fff" : palette.navy}
      onPress={onPress}
      style={{ borderRadius: radii.md }}
      contentStyle={{ minHeight: 38, paddingHorizontal: primary ? 10 : 3 }}
      labelStyle={{ fontSize: 12, fontWeight: "900", letterSpacing: 0, marginHorizontal: 0 }}
    >
      {label}
    </Button>
  );
}

export function FormActions({ submitLabel, onSubmit, onCancel, submitIcon, disabled }: { submitLabel: string; onSubmit: () => void; onCancel: () => void; submitIcon?: IconName; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6, paddingTop: 2 }}>
      <CompactButton label="Cancel" danger onPress={onCancel} />
      <CompactButton label={submitLabel} icon={submitIcon} primary disabled={disabled} onPress={onSubmit} />
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon = "plus", danger, disabled }: { label: string; onPress: () => void; icon?: IconName; danger?: boolean; disabled?: boolean }) {
  return (
    <Button
      mode="contained"
      icon={icon}
      disabled={disabled}
      buttonColor={danger ? palette.danger : palette.teal}
      textColor="#fff"
      onPress={onPress}
      style={{ borderRadius: radii.pill, boxShadow: disabled ? undefined : shadow.sm }}
      contentStyle={{ minHeight: 46, paddingHorizontal: 12 }}
      labelStyle={{ fontWeight: "900", letterSpacing: 0, fontSize: 13 }}
    >
      {label}
    </Button>
  );
}

export function GhostButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Button
      mode="outlined"
      textColor={danger ? palette.danger : palette.text}
      onPress={onPress}
      style={{ borderRadius: radii.pill, borderColor: danger ? palette.danger : palette.border, backgroundColor: "#fff" }}
      contentStyle={{ minHeight: 44, paddingHorizontal: 10 }}
      labelStyle={{ fontWeight: "900", letterSpacing: 0, fontSize: 13 }}
    >
      {label}
    </Button>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" }) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      keyboardType={keyboardType}
      style={{ backgroundColor: "#fff", minHeight: multiline ? 88 : 48 }}
      outlineStyle={{ borderRadius: radii.md }}
      outlineColor={palette.border}
      activeOutlineColor={palette.teal}
    />
  );
}

export function Chip({ label, active, onPress, tone = "teal", icon }: { label: string; active?: boolean; onPress?: () => void; tone?: Tone; icon?: IconName }) {
  const color = toneColor(tone);
  const chipIcon = icon ? ({ size }: { color: string; size: number }) => <MaterialCommunityIcons name={icon} color={active ? "#fff" : color} size={size} /> : undefined;
  return (
    <PaperChip
      selected={active}
      icon={chipIcon}
      onPress={onPress}
      mode={active ? "flat" : "outlined"}
      compact
      textStyle={{ color: active ? "#fff" : color, fontWeight: "900", fontSize: 11 }}
      style={{ backgroundColor: active ? color : "#fff", borderColor: active ? color : toneSoft(tone), borderRadius: radii.pill }}
    >
      {label}
    </PaperChip>
  );
}

export function PetAvatar({ pet, size = 62 }: { pet?: Pet; size?: number }) {
  if (pet?.photoUri) {
    return <ExpoImage source={{ uri: pet.photoUri }} style={{ width: size, height: size, borderRadius: radii.lg, backgroundColor: palette.softTeal }} contentFit="cover" />;
  }
  const icon = pet?.species === "Cat" ? "cat" : pet?.species === "Dog" ? "dog" : "paw";
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

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Card style={{ width: 184, backgroundColor: pet.species === "Cat" ? palette.softPeach : palette.softTeal }}>
      <View style={{ gap: 12 }}>
        <PetAvatar pet={pet} size={96} />
        <View style={{ gap: 5 }}>
          <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 18 }}>{pet.name}</Text>
          <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{pet.breed || pet.species}</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Badge style={{ backgroundColor: "#fff", color: palette.text }}>{pet.species}</Badge>
            <Badge style={{ backgroundColor: palette.teal }}>{getLifeStage(pet.birthday, pet.species)}</Badge>
          </View>
          <Text selectable style={{ color: palette.text, fontSize: 13 }}>{calculateAge(pet.birthday)}</Text>
        </View>
      </View>
    </Card>
  );
}

export function ReminderPill({ reminder }: { reminder: Reminder }) {
  const status = getReminderStatus(reminder);
  const tone: Tone = status === "Overdue" ? "danger" : status === "Due Today" ? "warning" : status === "Completed" ? "success" : "teal";
  return (
    <View style={{ alignItems: "flex-end", gap: 4 }}>
      <Badge style={{ backgroundColor: toneColor(tone), color: "#fff", fontWeight: "900" }}>{status}</Badge>
    </View>
  );
}

export function TimelineRail({ tone = "teal" }: { tone?: Tone }) {
  const color = toneColor(tone);
  return (
    <View style={{ width: 28, alignItems: "center", alignSelf: "stretch" }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color, marginTop: 5 }} />
      <View style={{ width: 3, flex: 1, backgroundColor: toneSoft(tone), borderRadius: 2, marginTop: 4 }} />
    </View>
  );
}

export function BrandMark({ compact }: { compact?: boolean }) {
  const size = compact ? 58 : 108;
  return (
    <View style={{ alignItems: "center", gap: compact ? 2 : 8 }}>
      <Pressable disabled style={{ width: size, height: size, borderRadius: size / 2, borderWidth: compact ? 3 : 5, borderColor: "#fff", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.92)" }}>
        <MaterialCommunityIcons name="paw" color={palette.navy} size={compact ? 28 : 50} />
        <View style={{ position: "absolute", right: compact ? 2 : 10, bottom: compact ? 2 : 10, backgroundColor: palette.teal, borderRadius: radii.pill, padding: compact ? 4 : 7, borderWidth: 2, borderColor: "#fff" }}>
          <MaterialCommunityIcons name="shield-plus-outline" color="#fff" size={compact ? 15 : 24} />
        </View>
      </Pressable>
      <Text selectable style={{ color: compact ? "#fff" : palette.text, fontSize: compact ? 16 : 31, fontWeight: "900", letterSpacing: 0 }}>PetNexa <Text style={{ color: compact ? palette.yellow : palette.teal }}>AI</Text></Text>
      {!compact ? <Text selectable style={{ color: palette.muted, fontSize: 14 }}>Smart Pet Health, Connected Care.</Text> : null}
    </View>
  );
}
