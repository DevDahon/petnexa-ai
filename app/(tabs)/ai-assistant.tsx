import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, HeaderAppIcon, IconBubble, PetAvatar, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { AI_SAFETY_NOTICE, buildConsultation, ConsultationInput } from "@/services/ai";

const presets = ["Vomiting", "Diarrhea", "Not Eating", "Weakness", "Coughing", "Poisoning"];
const durationOptions = ["Today", "1-2 days", "3+ days"];
const frequencyOptions = ["Once", "Few times", "Repeated"];
const energyOptions = ["Normal", "Low", "Very weak"];
const breathingOptions = ["Normal", "Changed", "Trouble breathing"];

function stepMeta(step: number) {
  if (step === 1) return { title: "Pet & concern", subtitle: "Start with the pet and what you are noticing.", icon: "clipboard-pulse-outline" as const };
  if (step === 2) return { title: "Severity & urgency", subtitle: "Add timing, frequency, energy, and warning signs.", icon: "stethoscope" as const };
  return { title: "Review & submit", subtitle: "Confirm details before using an AI credit.", icon: "shield-check-outline" as const };
}

function StepHeader({ step }: { step: number }) {
  const current = stepMeta(step);
  return (
    <View style={{ backgroundColor: palette.softTeal, borderRadius: 22, borderWidth: 1, borderColor: palette.mint, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name={current.icon} color={palette.teal} size={24} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text selectable style={{ color: palette.teal, fontSize: 11, fontWeight: "900" }}>STEP {step} OF 3</Text>
          <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{current.title}</Text>
          <Text selectable style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>{current.subtitle}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 7 }}>
        {[1, 2, 3].map((item) => <View key={item} style={{ flex: 1, height: 7, borderRadius: 999, backgroundColor: item <= step ? palette.teal : "#DCEFEA" }} />)}
      </View>
    </View>
  );
}

function OptionButton({ label, active, onPress, tone = "teal", icon }: { label: string; active?: boolean; onPress: () => void; tone?: "teal" | "warning" | "danger" | "navy"; icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  const color = tone === "danger" ? palette.danger : tone === "warning" ? palette.warning : tone === "navy" ? palette.navy : palette.teal;
  const backgroundColor = active ? color : "#fff";
  const borderColor = active ? color : tone === "danger" ? "#FECACA" : tone === "warning" ? "#FDE68A" : palette.mint;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, flexGrow: 1, flexBasis: "30%" })}>
      <View style={{ minHeight: 46, borderRadius: 999, borderWidth: 1.5, borderColor, backgroundColor, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }}>
        {icon ? <MaterialCommunityIcons name={icon} color={active ? "#fff" : color} size={17} /> : null}
        <Text selectable style={{ color: active ? "#fff" : color, fontSize: 12, fontWeight: "900", textAlign: "center" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function FooterButton({ label, onPress, primary, danger, disabled, icon }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  const color = danger ? palette.danger : primary ? palette.teal : palette.navy;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => ({ opacity: disabled ? 0.48 : pressed ? 0.75 : 1, flex: primary ? 1.35 : 1, minWidth: 118 })}>
      <View style={{ minHeight: 50, borderRadius: 18, backgroundColor: primary ? color : "#fff", borderWidth: 1.5, borderColor: primary ? color : danger ? "#FECACA" : palette.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 12 }}>
        {icon ? <MaterialCommunityIcons name={icon} color={primary ? "#fff" : color} size={18} /> : null}
        <Text selectable style={{ color: primary ? "#fff" : color, fontSize: 13, fontWeight: "900", textAlign: "center" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    symptoms: "Vomiting once this morning",
    appetite: "Normal",
    waterIntake: "Normal",
    behaviorChanges: "No major changes",
    vomiting: "Today",
    diarrhea: "Once",
    mobility: "Normal",
    breathing: "Normal",
    injury: "None",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const pet = pets.find((item) => item.id === selectedPetId) ?? pets[0];
  const emergencyVet = veterinarians.find((vet) => vet.emergencyHotline) ?? veterinarians[0];

  const startConsultation = () => {
    setSelectedPetId((current) => current || pets[0]?.id || "");
    setStep(1);
    setShowForm(true);
  };

  const closeConsultation = () => {
    setShowForm(false);
    setStep(1);
  };

  const goNext = () => {
    if (!pet) return Alert.alert("Add a pet first", "Consultations need pet context.");
    if (!form.symptoms.trim()) return Alert.alert("Symptoms required", "Tell PetNexa AI what you are noticing before continuing.");
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async () => {
    if (!pet) return Alert.alert("Add a pet first", "Consultations need pet context.");
    if (!canUseAi()) return Alert.alert("No AI credits", "Watch a rewarded ad if your weekly credit is available.");
    setBusy(true);
    try {
      const input: ConsultationInput = { pet, preset, ...form };
      const { consultation } = await buildConsultation(input);
      await saveConsultation(consultation);
      if (consultation.riskLevel !== "Emergency") await deductAiCredit();
      closeConsultation();
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text selectable style={{ color: palette.text, fontSize: 27, fontWeight: "900" }}>AI Assistant</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: palette.mint, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#fff" }}>
            <HeaderAppIcon size={34} />
            <Text selectable style={{ color: palette.navy, fontSize: 11, fontWeight: "900" }}>Credits{"\n"}{creditState.aiCredits}/3</Text>
          </View>
        </View>

        <GradientCard variant="calm">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ flex: 1, gap: 7 }}>
              <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>Guided pet-care notes</Text>
              <Text selectable style={{ color: palette.text, fontSize: 20, lineHeight: 26, fontWeight: "900" }}>Ask AI about your pet's health and get organized guidance.</Text>
              <PrimaryButton label="Start Consultation" icon="arrow-right" onPress={startConsultation} />
            </View>
            <View style={{ width: 112, height: 112, borderRadius: 30, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#DDEEEB" }}>
              <MaterialCommunityIcons name="robot-happy-outline" color={palette.navy} size={58} />
            </View>
          </View>
        </GradientCard>

        <Card style={{ backgroundColor: palette.softDanger }}>
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
        </Card>

        <SectionHeader title="Quick Select (Presets)" action="View all" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {presets.map((item) => (
            <View key={item} style={{ width: "48%" }}>
              <Chip label={item} icon={presetIcon(item)} active={preset === item} onPress={() => { setPreset(item); setForm((current) => ({ ...current, symptoms: item })); }} tone={item === "Poisoning" ? "danger" : "teal"} />
            </View>
          ))}
        </View>
        <GhostButton label="Watch Ad" onPress={watchAd} />

        {showForm ? (
          <>
            <SectionHeader title="Guided Consultation" />
            <Card style={{ borderColor: palette.mint }}>
              <StepHeader step={step} />
              {step === 1 ? (
                <>
                  <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}>Choose pet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {pets.map((item) => <OptionButton key={item.id} label={item.name} active={(pet?.id ?? "") === item.id} onPress={() => setSelectedPetId(item.id)} icon={item.species === "Cat" ? "cat" : item.species === "Dog" ? "dog" : "paw"} />)}
                  </ScrollView>
                  {pet ? (
                    <View style={{ flexDirection: "row", gap: 11, alignItems: "center", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: palette.border, padding: 10 }}>
                      <PetAvatar pet={pet} size={54} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 16 }}>{pet.name}</Text>
                        <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet.breed || pet.species}</Text>
                      </View>
                      <MaterialCommunityIcons name="check-circle" color={palette.teal} size={22} />
                    </View>
                  ) : null}
                  <Field label="What is happening?" value={form.symptoms} multiline onChangeText={(symptoms) => setForm((current) => ({ ...current, symptoms }))} />
                  <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}>Appetite</Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {["Normal", "Low", "None"].map((appetite) => <OptionButton key={appetite} label={appetite} active={form.appetite === appetite} onPress={() => setForm((current) => ({ ...current, appetite }))} tone={appetite === "None" ? "warning" : "teal"} />)}
                  </View>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>How serious does it look?</Text>
                  <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>The preset already tells us the symptom. These answers add context for urgency.</Text>
                  <View style={{ gap: 10 }}>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>How long has this been happening?</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {durationOptions.map((duration) => <OptionButton key={duration} label={duration} active={form.vomiting === duration} onPress={() => setForm((current) => ({ ...current, vomiting: duration }))} tone={duration === "3+ days" ? "warning" : "teal"} />)}
                    </View>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>How often is it happening?</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {frequencyOptions.map((frequency) => <OptionButton key={frequency} label={frequency} active={form.diarrhea === frequency} onPress={() => setForm((current) => ({ ...current, diarrhea: frequency }))} tone={frequency === "Repeated" ? "warning" : "teal"} />)}
                    </View>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Energy level</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {energyOptions.map((energy) => <OptionButton key={energy} label={energy} active={form.mobility === energy} onPress={() => setForm((current) => ({ ...current, mobility: energy }))} tone={energy === "Very weak" ? "danger" : energy === "Low" ? "warning" : "teal"} />)}
                    </View>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Breathing</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {breathingOptions.map((breathing) => <OptionButton key={breathing} label={breathing} active={form.breathing === breathing} onPress={() => setForm((current) => ({ ...current, breathing }))} tone={breathing === "Trouble breathing" ? "danger" : breathing === "Changed" ? "warning" : "teal"} />)}
                    </View>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Any injury, poisoning, collapse, or bleeding?</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {["None", "Possible", "Yes"].map((injury) => <OptionButton key={injury} label={injury} active={form.injury === injury} onPress={() => setForm((current) => ({ ...current, injury }))} tone={injury === "Yes" ? "danger" : injury === "Possible" ? "warning" : "teal"} />)}
                    </View>
                  </View>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Final notes and review</Text>
                  <Field label="Water Intake" value={form.waterIntake} onChangeText={(waterIntake) => setForm((current) => ({ ...current, waterIntake }))} />
                  <Field label="Behavior Changes" value={form.behaviorChanges} onChangeText={(behaviorChanges) => setForm((current) => ({ ...current, behaviorChanges }))} />
                  <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
                  <View style={{ backgroundColor: palette.softTeal, borderRadius: 18, borderWidth: 1, borderColor: palette.mint, padding: 13, gap: 5 }}>
                    <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Review</Text>
                    <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>{pet?.name ?? "Pet"} • {preset} • Appetite: {form.appetite}</Text>
                    <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Duration: {form.vomiting} • Frequency: {form.diarrhea} • Energy: {form.mobility}</Text>
                    <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Breathing: {form.breathing} • Warning signs: {form.injury}</Text>
                  </View>
                </>
              ) : null}

              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>{AI_SAFETY_NOTICE}</Text>
              <View style={{ backgroundColor: "#F8FBFD", borderRadius: 22, borderWidth: 1, borderColor: palette.border, padding: 10, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 9, flexWrap: "wrap" }}>
                  {step > 1 ? <FooterButton label="Back" icon="arrow-left" onPress={() => setStep((current) => Math.max(1, current - 1))} /> : null}
                  {step < 3 ? <FooterButton label="Continue" icon="arrow-right" primary onPress={goNext} /> : <FooterButton label={busy ? "Checking..." : "Submit"} icon="heart-pulse" primary onPress={submit} disabled={busy} />}
                  <FooterButton label="Cancel" icon="close" danger onPress={closeConsultation} />
                </View>
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
      </ScrollView>
    </Screen>
  );
}
