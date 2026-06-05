import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, PetAvatar, PrimaryButton, Screen, ScreenIntro, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { AI_PROXY_MODE_NOTICE, AI_SAFETY_NOTICE, buildConsultation, ConsultationInput } from "@/services/ai";

const presets = ["Vomiting", "Diarrhea", "Not Eating", "Weakness", "Coughing", "Poisoning"];

export default function AiAssistantScreen() {
  const { pets, consultations, veterinarians, creditState, canUseAi, deductAiCredit, saveConsultation, watchRewardedAd } = useAppData();
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? "");
  const [preset, setPreset] = useState(presets[0]);
  const [showForm, setShowForm] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState({
    symptoms: "Vomiting once this morning",
    appetite: "Normal",
    waterIntake: "Normal",
    behaviorChanges: "No major changes",
    vomiting: "No",
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
      setShowForm(false);
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
        <ScreenIntro title="AI Assistant" subtitle="Quick guidance with emergency checks first." icon="robot-happy-outline" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Credits" value={`${creditState.aiCredits}/3`} icon="ticket-confirmation-outline" />
          <StatCard label="Used" value={creditState.totalConsultationsUsed} icon="history" tone="navy" />
          <StatCard label="Ads" value={`${creditState.weeklyAdWatchCount}/5`} icon="play-circle-outline" tone="warning" />
        </View>

        <Card style={{ backgroundColor: palette.softDanger }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MaterialCommunityIcons name="alert-octagon-outline" color={palette.danger} size={24} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Emergency signs bypass AI</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Breathing trouble, seizures, poisoning, severe bleeding, or collapse should go straight to {emergencyVet?.clinicName ?? "your veterinarian"}.</Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MaterialCommunityIcons name="shield-key-outline" color={palette.navy} size={22} />
            <Text selectable style={{ color: palette.muted, flex: 1, lineHeight: 20 }}>{AI_PROXY_MODE_NOTICE}</Text>
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {!showForm ? <PrimaryButton label="Start Consultation" icon="heart" onPress={() => setShowForm(true)} /> : null}
          <GhostButton label="Watch Ad" onPress={watchAd} />
        </View>

        {showForm ? (
          <>
            <SectionHeader title="Consultation" />
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pets.map((item) => <Chip key={item.id} label={item.name} active={(pet?.id ?? "") === item.id} onPress={() => setSelectedPetId(item.id)} />)}
              </ScrollView>
              {pet ? <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><PetAvatar pet={pet} size={52} /><Text selectable style={{ color: palette.text, fontWeight: "900" }}>{pet.name} • {pet.breed}</Text></View> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {presets.map((item) => <Chip key={item} label={item} active={preset === item} onPress={() => { setPreset(item); setForm((current) => ({ ...current, symptoms: item })); }} tone={item === "Poisoning" ? "danger" : "teal"} />)}
              </ScrollView>
              <Field label="What is happening?" value={form.symptoms} multiline onChangeText={(symptoms) => setForm((current) => ({ ...current, symptoms }))} />
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {["Normal", "Low", "None"].map((appetite) => <Chip key={appetite} label={`Appetite: ${appetite}`} active={form.appetite === appetite} onPress={() => setForm((current) => ({ ...current, appetite }))} />)}
              </View>
              <GhostButton label={advanced ? "Hide Details" : "More Details"} onPress={() => setAdvanced((value) => !value)} />
              {advanced ? (
                <>
                  <Field label="Water Intake" value={form.waterIntake} onChangeText={(waterIntake) => setForm((current) => ({ ...current, waterIntake }))} />
                  <Field label="Behavior Changes" value={form.behaviorChanges} onChangeText={(behaviorChanges) => setForm((current) => ({ ...current, behaviorChanges }))} />
                  <Field label="Breathing" value={form.breathing} onChangeText={(breathing) => setForm((current) => ({ ...current, breathing }))} />
                  <Field label="Injury" value={form.injury} onChangeText={(injury) => setForm((current) => ({ ...current, injury }))} />
                  <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
                </>
              ) : null}
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>{AI_SAFETY_NOTICE}</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <PrimaryButton label={busy ? "Checking..." : "Submit"} icon="heart" onPress={submit} disabled={busy} />
                <GhostButton label="Cancel" onPress={() => setShowForm(false)} />
              </View>
            </Card>
          </>
        ) : null}

        <SectionHeader title="Recent Consultations" action={`${consultations.length} saved`} />
        {consultations.length === 0 ? (
          <EmptyState title="No consultations yet" message="Start a consultation when you need general guidance." icon="robot-outline" />
        ) : (
          consultations.slice(0, 4).map((consultation) => {
            const historyPet = pets.find((item) => item.id === consultation.petId);
            return (
              <Card key={consultation.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="history" color={consultation.riskLevel === "Emergency" ? palette.danger : palette.teal} size={24} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{consultation.preset} • {consultation.riskLevel}</Text>
                    <Text selectable style={{ color: palette.muted }}>{historyPet?.name ?? "Pet"} • {consultation.createdAt}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        <Card>
          <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Usage</Text>
          <BarChart
            data={[
              { value: consultations.length, label: "Used", frontColor: palette.teal },
              { value: creditState.aiCredits, label: "Left", frontColor: palette.navy },
            ]}
            height={96}
            barWidth={32}
            spacing={28}
            hideRules
            yAxisThickness={0}
            xAxisColor={palette.border}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
