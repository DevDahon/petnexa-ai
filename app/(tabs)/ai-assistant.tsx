import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, IconBubble, PetAvatar, PrimaryButton, Screen, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { AI_PROXY_MODE_NOTICE, AI_SAFETY_NOTICE, buildConsultation, ConsultationInput } from "@/services/ai";

const presets = ["Vomiting", "Diarrhea", "Not Eating", "Weakness", "Coughing", "Poisoning"];

function presetIcon(label: string) {
  if (label === "Vomiting") return "stomach" as const;
  if (label === "Diarrhea") return "water-alert-outline" as const;
  if (label === "Not Eating") return "food-off-outline" as const;
  if (label === "Weakness") return "battery-low" as const;
  if (label === "Coughing") return "lungs" as const;
  return "alert-octagon-outline" as const;
}

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
        <GradientCard variant="secondary">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text selectable style={{ color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 0 }}>PetNexa AI</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.84)", lineHeight: 22 }}>Guided pet-health support with safety checks first.</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Text selectable style={{ color: "#fff", fontWeight: "900" }}>{creditState.aiCredits}/3 credits</Text>
                </View>
                <View style={{ backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Text selectable style={{ color: "#fff", fontWeight: "900" }}>{creditState.weeklyAdWatchCount}/5 ads</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 104, height: 104, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="robot-happy-outline" color="#fff" size={56} />
              <View style={{ position: "absolute", right: 10, bottom: 10 }}>
                <IconBubble icon="heart-pulse" tone="warning" size={36} />
              </View>
            </View>
          </View>
        </GradientCard>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Credits" value={`${creditState.aiCredits}/3`} icon="ticket-confirmation-outline" />
          <StatCard label="Used" value={creditState.totalConsultationsUsed} icon="history" tone="navy" />
          <StatCard label="Ads" value={`${creditState.weeklyAdWatchCount}/5`} icon="play-circle-outline" tone="warning" />
        </View>

        <GradientCard variant="danger">
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <IconBubble icon="alert-octagon-outline" tone="danger" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>Emergency signs bypass AI</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Breathing trouble, seizures, poisoning, severe bleeding, or collapse should go straight to {emergencyVet?.clinicName ?? "your veterinarian"}.</Text>
            </View>
          </View>
          <View style={{ alignSelf: "flex-start", backgroundColor: palette.danger, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }}>
            <Text selectable style={{ color: "#fff", fontWeight: "900" }}>Emergency care first</Text>
          </View>
        </GradientCard>

        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MaterialCommunityIcons name="shield-key-outline" color={palette.navy} size={22} />
            <Text selectable style={{ color: palette.muted, flex: 1, lineHeight: 20 }}>{AI_PROXY_MODE_NOTICE}</Text>
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {!showForm ? <PrimaryButton label="Start Consultation" icon="heart-pulse" onPress={() => setShowForm(true)} /> : null}
          <GhostButton label="Watch Ad" onPress={watchAd} />
        </View>

        {showForm ? (
          <>
            <SectionHeader title="Guided Consultation" action="Step 1 of 3" />
            <GradientCard variant="calm">
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3].map((step) => <View key={step} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: step === 1 ? palette.teal : palette.border }} />)}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pets.map((item) => <Chip key={item.id} label={item.name} active={(pet?.id ?? "") === item.id} onPress={() => setSelectedPetId(item.id)} />)}
              </ScrollView>
              {pet ? <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><PetAvatar pet={pet} size={52} /><Text selectable style={{ color: palette.text, fontWeight: "900" }}>{pet.name} • {pet.breed}</Text></View> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {presets.map((item) => <Chip key={item} label={item} icon={presetIcon(item)} active={preset === item} onPress={() => { setPreset(item); setForm((current) => ({ ...current, symptoms: item })); }} tone={item === "Poisoning" ? "danger" : "teal"} />)}
              </ScrollView>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>What are you noticing?</Text>
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
                <PrimaryButton label={busy ? "Checking..." : "Submit"} icon="heart-pulse" onPress={submit} disabled={busy} />
                <GhostButton label="Cancel" onPress={() => setShowForm(false)} />
              </View>
            </GradientCard>
          </>
        ) : null}

        <SectionHeader title="Recent Consultations" action={`${consultations.length} saved`} />
        {consultations.length === 0 ? (
          <EmptyState title="No consultations yet" message="Start a consultation when you need general guidance." icon="robot-outline" />
        ) : (
          consultations.slice(0, 4).map((consultation) => {
            const historyPet = pets.find((item) => item.id === consultation.petId);
            return (
              <Card key={consultation.id} style={{ backgroundColor: consultation.riskLevel === "Emergency" ? palette.softDanger : palette.card }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconBubble icon="history" tone={consultation.riskLevel === "Emergency" ? "danger" : "teal"} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}>{consultation.preset} • {consultation.riskLevel}</Text>
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
