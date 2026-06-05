import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { PropsWithChildren } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { Avatar, Button, Card as PaperCard, Chip as PaperChip, TextInput, Badge, Surface, IconButton } from "react-native-paper";
import { palette, radii } from "@/constants/theme";
import { Pet, Reminder } from "@/types/domain";
import { calculateAge, getLifeStage, getReminderStatus } from "@/utils/date";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {children}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <PaperCard mode="elevated" style={[{ backgroundColor: palette.card, borderRadius: radii.md }, style]}>
      <PaperCard.Content style={{ gap: 10 }}>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
}

export function Panel({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <Surface elevation={1} style={[{ backgroundColor: palette.card, borderRadius: radii.md, padding: 14, gap: 10 }, style]}>
      {children}
    </Surface>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>{title}</Text>
      {action ? <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "700" }}>{action}</Text> : null}
    </View>
  );
}

export function ScreenIntro({ title, subtitle, icon }: { title: string; subtitle: string; icon: IconName }) {
  return (
    <Card style={{ backgroundColor: palette.softTeal }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar.Icon size={48} icon={icon} color={palette.teal} style={{ backgroundColor: "#fff" }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "900" }}>{title}</Text>
          <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>{subtitle}</Text>
        </View>
      </View>
    </Card>
  );
}

export function StatCard({ label, value, icon, tone = "teal" }: { label: string; value: string | number; icon: IconName; tone?: "teal" | "danger" | "warning" | "navy" }) {
  const color = tone === "danger" ? palette.danger : tone === "warning" ? palette.warning : tone === "navy" ? palette.navy : palette.teal;
  return (
    <Surface elevation={1} style={{ flex: 1, minWidth: 96, borderRadius: radii.md, backgroundColor: "#fff", padding: 12, gap: 6 }}>
      <MaterialCommunityIcons name={icon} color={color} size={22} />
      <Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "900" }}>{value}</Text>
      <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{label}</Text>
    </Surface>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, icon = "paw" }: { title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: IconName }) {
  return (
    <Card>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <Avatar.Icon size={58} icon={icon} color={palette.teal} style={{ backgroundColor: palette.softTeal }} />
        <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900", textAlign: "center" }}>{title}</Text>
        <Text selectable style={{ color: palette.muted, textAlign: "center", lineHeight: 20 }}>{message}</Text>
        {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
      </View>
    </Card>
  );
}

export function RowAction({ icon, onPress, danger }: { icon: IconName; onPress: () => void; danger?: boolean }) {
  return <IconButton icon={icon} size={20} iconColor={danger ? palette.danger : palette.muted} onPress={onPress} style={{ margin: 0 }} />;
}

export function PrimaryButton({ label, onPress, icon = "plus", danger, disabled }: { label: string; onPress: () => void; icon?: "plus" | "heart" | "shield"; danger?: boolean; disabled?: boolean }) {
  const iconName: IconName = icon === "heart" ? "heart-pulse" : icon === "shield" ? "shield-plus-outline" : "plus";
  return (
    <Button
      mode="contained"
      icon={iconName}
      disabled={disabled}
      buttonColor={danger ? palette.danger : palette.teal}
      textColor="#fff"
      onPress={onPress}
      style={{ borderRadius: radii.pill }}
      contentStyle={{ minHeight: 46 }}
      labelStyle={{ fontWeight: "800" }}
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
      style={{ borderRadius: radii.pill, borderColor: danger ? palette.danger : palette.border }}
      labelStyle={{ fontWeight: "800" }}
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
      style={{ backgroundColor: "#fff", minHeight: multiline ? 82 : undefined }}
      outlineColor={palette.border}
      activeOutlineColor={palette.teal}
    />
  );
}

export function Chip({ label, active, onPress, tone = "teal" }: { label: string; active?: boolean; onPress?: () => void; tone?: "teal" | "danger" | "warning" | "navy" }) {
  const color = tone === "danger" ? palette.danger : tone === "warning" ? palette.warning : tone === "navy" ? palette.navy : palette.teal;
  return (
    <PaperChip
      selected={active}
      onPress={onPress}
      mode={active ? "flat" : "outlined"}
      compact
      textStyle={{ color: active ? "#fff" : color, fontWeight: "800", fontSize: 12 }}
      style={{ backgroundColor: active ? color : "#fff", borderColor: color }}
    >
      {label}
    </PaperChip>
  );
}

export function PetAvatar({ pet, size = 62 }: { pet?: Pet; size?: number }) {
  if (pet?.photoUri) {
    return <Image source={{ uri: pet.photoUri }} style={{ width: size, height: size, borderRadius: radii.md, backgroundColor: palette.softTeal }} contentFit="cover" />;
  }
  const icon = pet?.species === "Cat" ? "cat" : pet?.species === "Dog" ? "dog" : "paw";
  return (
    <Avatar.Icon
      size={size}
      icon={icon}
      color={pet?.species === "Cat" ? palette.warning : palette.teal}
      style={{ backgroundColor: pet?.species === "Cat" ? palette.softPeach : palette.softTeal, borderRadius: radii.md }}
    />
  );
}

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Card style={{ width: 148 }}>
      <PetAvatar pet={pet} size={72} />
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{pet.name}</Text>
        <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet.breed}</Text>
        <Text selectable style={{ color: palette.text, fontSize: 12 }}>{calculateAge(pet.birthday)}</Text>
        <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "800" }}>{getLifeStage(pet.birthday, pet.species)}</Text>
      </View>
    </Card>
  );
}

export function ReminderPill({ reminder }: { reminder: Reminder }) {
  const status = getReminderStatus(reminder);
  const color = status === "Overdue" ? palette.danger : status === "Due Today" ? palette.warning : status === "Completed" ? palette.success : palette.teal;
  return (
    <View style={{ alignItems: "flex-end", gap: 4 }}>
      <Badge style={{ backgroundColor: color }}>{status}</Badge>
    </View>
  );
}

export function BrandMark({ compact }: { compact?: boolean }) {
  const size = compact ? 64 : 108;
  return (
    <View style={{ alignItems: "center", gap: compact ? 2 : 8 }}>
      <Pressable disabled style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: palette.teal, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <MaterialCommunityIcons name="paw" color={palette.navy} size={compact ? 30 : 50} />
        <View style={{ position: "absolute", right: compact ? 5 : 12, bottom: compact ? 5 : 12, backgroundColor: palette.teal, borderRadius: radii.pill, padding: compact ? 4 : 7 }}>
          <MaterialCommunityIcons name="shield-plus-outline" color="#fff" size={compact ? 16 : 24} />
        </View>
      </Pressable>
      <Text selectable style={{ color: palette.text, fontSize: compact ? 18 : 31, fontWeight: "900" }}>PetNexa <Text style={{ color: palette.teal }}>AI</Text></Text>
      {!compact ? <Text selectable style={{ color: palette.muted, fontSize: 14 }}>Smart Pet Health, Connected Care.</Text> : null}
    </View>
  );
}
