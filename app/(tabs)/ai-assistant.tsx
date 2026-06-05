import { Bot, Coins, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, PetAvatar, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { AI_SAFETY_NOTICE, buildConsultation, ConsultationInput } from "@/services/ai";

const presets = ["Vomiting", "Diarrhea", "Not Eating", "Weakness", "Coughing", "Skin Problems", "Eye Problems", "Poisoning", "Wound / Injury", "Unusual Behavior"];

export default function AiAssistantScreen() {
  const { pets, consultations, veterinarians, creditState, canUseAi, deductAiCredit, saveConsultation, watchRewardedAd } = useAppData();
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? "");
  const [preset, setPreset] = useState(presets[0]);
  const [form, setForm] = useState({
    symptoms: "Vomiting once this morning",
    appetite: "Normal",
    waterIntake: "Normal",
    behaviorChanges: "No major changes",
    vomiting: "Yes",
    diarrhea: "No",
    mobility: "Normal",
    breathing: "Normal",
    injury: "None",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const pet = pets.find((item) => item.id === selectedPetId) ?? pets[0];
  const emergencyVet = veterinarians.find((vet) => vet.emergencyHotline) ?? veterinarians[0];

  const submit = async () => {
    if (!pet) return Alert.alert("Add a pet first", "Consultations need pet context.");
    if (!canUseAi()) return Alert.alert("No AI credits", "Watch a rewarded ad if your weekly credit is available.");
    setBusy(true);
    try {
      const input: ConsultationInput = { pet, preset, ...form };
      const { consultation } = await buildConsultation(input);
      await saveConsultation(consultation);
      if (consultation.riskLevel !== "Emergency") await deductAiCredit();
      Alert.alert(consultation.riskLevel === "Emergency" ? "Emergency signs detected" : "Consultation saved", consultation.guidance);
    } catch (error) {
      Alert.alert("AI consultation unavailable", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const watchAd = async () => {
    Alert.alert("Rewarded ad", await watchRewardedAd());
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <Card style={{ backgroundColor: palette.softTeal }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Bot color={palette.navy} size={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "900" }}>AI Pet Health Assistant</Text>
              <Text selectable style={{ color: palette.muted }}>{AI_SAFETY_NOTICE}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Chip label={`${creditState.aiCredits}/3 credits`} active />
            <Chip label={`${creditState.weeklyAdWatchCount}/5 ads this week`} tone="navy" />
            <GhostButton label="Watch Mock Ad" onPress={watchAd} />
          </View>
        </Card>

        <SectionHeader title="Quick Select Presets" />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {presets.map((item) => <Chip key={item} label={item} active={preset === item} onPress={() => { setPreset(item); setForm((current) => ({ ...current, symptoms: item })); }} tone={item === "Poisoning" ? "danger" : "teal"} />)}
        </View>

        <SectionHeader title="Start Consultation" />
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {pets.map((item) => <Chip key={item.id} label={item.name} active={(pet?.id ?? "") === item.id} onPress={() => setSelectedPetId(item.id)} />)}
          </ScrollView>
          {pet ? <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><PetAvatar pet={pet} size={52} /><Text selectable style={{ color: palette.text, fontWeight: "900" }}>{pet.name} • {pet.breed}</Text></View> : null}
          <Field label="Symptoms" value={form.symptoms} multiline onChangeText={(symptoms) => setForm((current) => ({ ...current, symptoms }))} />
          <Field label="Appetite" value={form.appetite} onChangeText={(appetite) => setForm((current) => ({ ...current, appetite }))} />
          <Field label="Water Intake" value={form.waterIntake} onChangeText={(waterIntake) => setForm((current) => ({ ...current, waterIntake }))} />
          <Field label="Behavior Changes" value={form.behaviorChanges} onChangeText={(behaviorChanges) => setForm((current) => ({ ...current, behaviorChanges }))} />
          <Field label="Vomiting" value={form.vomiting} onChangeText={(vomiting) => setForm((current) => ({ ...current, vomiting }))} />
          <Field label="Diarrhea" value={form.diarrhea} onChangeText={(diarrhea) => setForm((current) => ({ ...current, diarrhea }))} />
          <Field label="Mobility" value={form.mobility} onChangeText={(mobility) => setForm((current) => ({ ...current, mobility }))} />
          <Field label="Breathing" value={form.breathing} onChangeText={(breathing) => setForm((current) => ({ ...current, breathing }))} />
          <Field label="Injury" value={form.injury} onChangeText={(injury) => setForm((current) => ({ ...current, injury }))} />
          <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
          <PrimaryButton label={busy ? "Checking..." : "Submit Consultation"} icon="heart" onPress={submit} />
        </Card>

        <Card style={{ backgroundColor: palette.softDanger }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TriangleAlert color={palette.danger} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Emergency detection is local and immediate</Text>
              <Text selectable style={{ color: palette.muted }}>If severe signs appear, contact {emergencyVet?.clinicName ?? "your veterinarian"} right away. Emergency consultations are saved without charging a credit.</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Consultation History" action={`${consultations.length} saved`} />
        {consultations.slice(0, 6).map((consultation) => {
          const historyPet = pets.find((item) => item.id === consultation.petId);
          return (
            <Card key={consultation.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Coins color={consultation.riskLevel === "Emergency" ? palette.danger : palette.teal} />
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{consultation.preset} • {consultation.riskLevel}</Text>
                  <Text selectable style={{ color: palette.muted }}>{historyPet?.name ?? "Pet"} • {consultation.createdAt}</Text>
                  <Text selectable style={{ color: palette.text }}>{consultation.guidance}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
