import { Image } from "expo-image";
import { HeartPulse, PawPrint, Plus, ShieldPlus } from "lucide-react-native";
import React, { PropsWithChildren } from "react";
import { Pressable, Text, TextInput, View, ViewStyle } from "react-native";
import { palette, radii, shadow } from "@/constants/theme";
import { Pet, Reminder } from "@/types/domain";
import { calculateAge, getLifeStage, getReminderStatus } from "@/utils/date";

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {children}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View style={[{ backgroundColor: palette.card, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: "#EEF2F6", gap: 10 }, shadow, style]}>
      {children}
    </View>
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

export function PrimaryButton({ label, onPress, icon = "plus", danger }: { label: string; onPress: () => void; icon?: "plus" | "heart" | "shield"; danger?: boolean }) {
  const Icon = icon === "heart" ? HeartPulse : icon === "shield" ? ShieldPlus : Plus;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ backgroundColor: danger ? palette.danger : palette.teal, borderRadius: radii.pill, minHeight: 46, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: pressed ? 0.78 : 1 }]}>
      <Icon color="#fff" size={18} />
      <Text selectable style={{ color: "#fff", fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ borderColor: danger ? palette.danger : palette.border, borderWidth: 1, backgroundColor: "#fff", borderRadius: radii.pill, minHeight: 40, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 }]}>
      <Text selectable style={{ color: danger ? palette.danger : palette.text, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" }) {
  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: palette.text, fontWeight: "700", fontSize: 12 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        multiline={multiline}
        keyboardType={keyboardType}
        style={{ minHeight: multiline ? 82 : 44, textAlignVertical: multiline ? "top" : "center", backgroundColor: "#fff", borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 10, color: palette.text }}
      />
    </View>
  );
}

export function Chip({ label, active, onPress, tone = "teal" }: { label: string; active?: boolean; onPress?: () => void; tone?: "teal" | "danger" | "warning" | "navy" }) {
  const color = tone === "danger" ? palette.danger : tone === "warning" ? palette.warning : tone === "navy" ? palette.navy : palette.teal;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: active ? color : "#fff", borderWidth: 1, borderColor: active ? color : palette.border }}>
      <Text selectable style={{ color: active ? "#fff" : color, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

export function PetAvatar({ pet, size = 62 }: { pet?: Pet; size?: number }) {
  if (pet?.photoUri) {
    return <Image source={{ uri: pet.photoUri }} style={{ width: size, height: size, borderRadius: radii.md, backgroundColor: palette.softTeal }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radii.md, backgroundColor: pet?.species === "Cat" ? palette.softPeach : palette.softTeal, alignItems: "center", justifyContent: "center" }}>
      <PawPrint color={pet?.species === "Cat" ? palette.warning : palette.teal} size={Math.round(size * 0.45)} />
    </View>
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
    <View style={{ backgroundColor: `${color}18`, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text selectable style={{ color, fontSize: 11, fontWeight: "900" }}>{status}</Text>
    </View>
  );
}

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: compact ? 2 : 8 }}>
      <View style={{ width: compact ? 64 : 108, height: compact ? 64 : 108, borderRadius: 32, borderWidth: 4, borderColor: palette.teal, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <PawPrint color={palette.navy} size={compact ? 28 : 48} />
        <View style={{ position: "absolute", right: compact ? 6 : 12, bottom: compact ? 6 : 12, backgroundColor: palette.teal, borderRadius: radii.pill, padding: compact ? 4 : 7 }}>
          <ShieldPlus color="#fff" size={compact ? 16 : 24} />
        </View>
      </View>
      <Text selectable style={{ color: palette.text, fontSize: compact ? 18 : 31, fontWeight: "900" }}>PetNexa <Text style={{ color: palette.teal }}>AI</Text></Text>
      {!compact ? <Text selectable style={{ color: palette.muted, fontSize: 14 }}>Smart Pet Health, Connected Care.</Text> : null}
    </View>
  );
}
