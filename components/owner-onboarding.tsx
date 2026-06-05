import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { Card, Field, PrimaryButton, BrandMark } from "@/components/ui";
import { MIN_OWNER_AGE } from "@/constants/owner";
import { gradients, palette, radii, shadow } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { getAgeYears, isValidIsoDate } from "@/utils/date";
import { LinearGradient } from "expo-linear-gradient";

function validateOwnerProfile(fullName: string, birthday: string) {
  const name = fullName.trim();
  const birthDate = birthday.trim();
  if (!name) return "Enter your full name so PetNexa AI can greet you properly.";
  if (!isValidIsoDate(birthDate)) return "Enter a valid birthday using YYYY-MM-DD.";
  if (getAgeYears(birthDate) < MIN_OWNER_AGE) return `You must be at least ${MIN_OWNER_AGE} years old to use PetNexa AI.`;
  return "";
}

export function OwnerOnboarding() {
  const { owner, saveOwner } = useAppData();
  const [fullName, setFullName] = useState(owner.fullName);
  const [birthday, setBirthday] = useState(owner.birthday);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const continueToApp = async () => {
    const validation = validateOwnerProfile(fullName, birthday);
    if (validation) {
      setMessage(validation);
      return;
    }
    setSaving(true);
    try {
      await saveOwner({ id: owner.id, fullName: fullName.trim(), birthday: birthday.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <LinearGradient colors={gradients.calm} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 22, gap: 20 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <BrandMark />
              <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>Set up your owner profile</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 330 }}>
                PetNexa AI needs your name for greetings and your birthday to confirm age eligibility.
              </Text>
            </View>

            <Card style={{ borderRadius: 24, boxShadow: shadow.md }}>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: radii.pill, backgroundColor: palette.softTeal, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="account-heart-outline" color={palette.teal} size={25} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Owner Details</Text>
                    <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Required before entering the app</Text>
                  </View>
                </View>

                <Field label="Full Name" value={fullName} onChangeText={(text) => { setFullName(text); setMessage(""); }} />
                <Field label="Birthday" value={birthday} placeholder="YYYY-MM-DD" onChangeText={(text) => { setBirthday(text); setMessage(""); }} />

                {message ? (
                  <View style={{ backgroundColor: palette.softDanger, borderRadius: radii.md, padding: 12 }}>
                    <Text selectable style={{ color: palette.danger, fontSize: 13, fontWeight: "800", lineHeight: 19 }}>{message}</Text>
                  </View>
                ) : null}

                <PrimaryButton label={saving ? "Saving..." : "Continue"} icon="arrow-right" disabled={saving} onPress={continueToApp} />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
