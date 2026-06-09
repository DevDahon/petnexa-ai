import {
  Card,
  Chip,
  EmptyState,
  Field,
  GhostButton,
  GradientCard,
  HeaderActionButton,
  IconBubble,
  PetAvatar,
  ResponsiveScrollView,
  Screen,
  ScreenHeader,
  SectionHeader,
  useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette, radii } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import {
  AI_SAFETY_NOTICE,
  buildConsultation,
  ConsultationInput,
} from "@/services/ai";
import { Consultation } from "@/types/domain";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

const presets = [
  "Vomiting",
  "Diarrhea",
  "Not Eating",
  "Weakness",
  "Coughing",
  "Poisoning",
];
const durationOptions = ["Today", "1-2 days", "3+ days"];
const frequencyOptions = ["Once", "Few times", "Repeated"];
const energyOptions = ["Normal", "Low", "Very weak"];
const breathingOptions = ["Normal", "Changed", "Trouble breathing"];

function stepMeta(step: number) {
  if (step === 1)
    return {
      title: "Pet & concern",
      subtitle: "Start with the pet and what you are noticing.",
      icon: "clipboard-pulse-outline" as const,
    };
  if (step === 2)
    return {
      title: "Severity & urgency",
      subtitle: "Add timing, frequency, energy, and warning signs.",
      icon: "stethoscope" as const,
    };
  return {
    title: "Review & submit",
    subtitle: "Confirm details before using an AI credit.",
    icon: "shield-check-outline" as const,
  };
}

function StepHeader({ step }: { step: number }) {
  const current = stepMeta(step);
  return (
    <View
      style={{
        backgroundColor: palette.softTeal,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.mintLight,
        padding: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: palette.mintLight,
          }}
        >
          <MaterialCommunityIcons
            name={current.icon}
            color={palette.teal}
            size={21}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            selectable
            style={{
              color: palette.teal,
              fontSize: 10,
              fontFamily: fontFamily.bold,
              letterSpacing: 0.7,
            }}
          >
            STEP {step} OF 3
          </Text>
          <Text
            selectable
            style={{
              color: palette.text,
              fontSize: 16,
              fontFamily: fontFamily.black,
            }}
          >
            {current.title}
          </Text>
          <Text
            selectable
            style={{
              color: palette.muted,
              fontSize: 11,
              fontFamily: fontFamily.medium,
              lineHeight: 16,
            }}
          >
            {current.subtitle}
          </Text>
        </View>
      </View>
      {/* Progress bar */}
      <View style={{ flexDirection: "row", gap: 5 }}>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: item <= step ? palette.teal : palette.mintLight,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function OptionButton({
  label,
  active,
  onPress,
  tone = "teal",
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  tone?: "teal" | "warning" | "danger" | "navy";
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  const color =
    tone === "danger"
      ? palette.danger
      : tone === "warning"
        ? palette.warning
        : tone === "navy"
          ? palette.navy
          : palette.teal;
  const soft =
    tone === "danger"
      ? palette.dangerSoft
      : tone === "warning"
        ? palette.warningSoft
        : tone === "navy"
          ? palette.softNavy
          : palette.softTeal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      hitSlop={5}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.78 : 1,
        flexGrow: 0,
        flexShrink: 1,
      })}
    >
      <View
        style={{
          minHeight: 34,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: active ? color : `${color}35`,
          backgroundColor: active ? color : soft,
          paddingHorizontal: 10,
          paddingVertical: 6,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 5,
        }}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            color={active ? "#fff" : color}
            size={14}
          />
        ) : null}
        <Text
          selectable
          style={{
            color: active ? "#fff" : color,
            fontSize: 11,
            fontFamily: fontFamily.bold,
            textAlign: "center",
            lineHeight: 14,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function GuideActionButton({
  label,
  icon,
  onPress,
  primary,
  danger,
  disabled,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const color = danger ? palette.danger : palette.teal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={5}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.48 : pressed ? 0.78 : 1,
      })}
    >
      <View
        style={{
          minHeight: 34,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: primary ? palette.teal : danger ? "#FECACA" : palette.border,
          backgroundColor: primary ? palette.teal : danger ? palette.dangerSoft : "#fff",
          paddingHorizontal: 11,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          color={primary ? "#fff" : color}
          size={14}
        />
        <Text
          selectable={false}
          style={{
            color: primary ? "#fff" : color,
            fontSize: 11,
            lineHeight: 14,
            fontFamily: fontFamily.bold,
          }}
        >
          {label}
        </Text>
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
  const {
    pets,
    consultations,
    veterinarians,
    creditState,
    canUseAi,
    deductAiCredit,
    saveConsultation,
    watchRewardedAd,
  } = useAppData();
  const layout = useResponsiveLayout();
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? "");
  const [preset, setPreset] = useState(presets[0]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [latestResult, setLatestResult] = useState<{
    consultation: Consultation;
    offline: boolean;
  } | null>(null);
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
  const emergencyVet =
    veterinarians.find((vet) => vet.emergencyHotline) ?? veterinarians[0];

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
    if (!pet)
      return Alert.alert("Add a pet first", "Consultations need pet context.");
    if (!form.symptoms.trim())
      return Alert.alert(
        "Symptoms required",
        "Tell PetNexa AI what you are noticing before continuing.",
      );
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async () => {
    if (!pet)
      return Alert.alert("Add a pet first", "Consultations need pet context.");
    if (!canUseAi())
      return Alert.alert(
        "No AI credits",
        "Watch a rewarded ad if your weekly credit is available.",
      );
    setBusy(true);
    try {
      const input: ConsultationInput = { pet, preset, ...form };
      const { consultation, offline } = await buildConsultation(input);
      await saveConsultation(consultation);
      if (!offline && consultation.riskLevel !== "Emergency")
        await deductAiCredit();
      setLatestResult({ consultation, offline });
      closeConsultation();
      Alert.alert(
        consultation.riskLevel === "Emergency"
          ? "Emergency signs detected"
          : "Consultation saved",
        offline
          ? `${consultation.guidance}\n\nNo AI credit was deducted for this saved guidance.`
          : consultation.guidance,
      );
    } catch (error) {
      Alert.alert(
        "AI consultation unavailable",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const watchAd = async () => {
    Alert.alert("Rewarded ad", await watchRewardedAd());
  };

  return (
    <Screen>
      <ResponsiveScrollView>
        {/* ── Header ── */}
        <ScreenHeader
          title="AI Assistant"
          subtitle="Guided pet-care consultations"
          right={
            <HeaderActionButton
              icon="cog-outline"
              label="Open settings"
              active
              onPress={() => router.push("/settings")}
            />
          }
        />

        {/* ── Hero ── */}
        <GradientCard variant="calm">
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: palette.softNavy,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <MaterialCommunityIcons
                name="star-four-points"
                color={palette.navy}
                size={14}
              />
              <Text
                selectable
                style={{
                  color: palette.navy,
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                }}
              >
                {creditState.aiCredits}/3
              </Text>
            </View>
            <View style={{ width: "100%", gap: 6 }}>
              <Text
                selectable
                style={{
                  color: palette.teal,
                  fontSize: 10,
                  fontFamily: fontFamily.bold,
                  letterSpacing: 1.2,
                }}
              >
                AI CONSULTATION
              </Text>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontSize: 18,
                  lineHeight: 24,
                  fontFamily: fontFamily.black,
                }}
              >
                Get personalized pet health guidance from AI
              </Text>
            </View>
            <Pressable
              onPress={startConsultation}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                alignSelf: "flex-start",
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  backgroundColor: palette.teal,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialCommunityIcons
                    name="arrow-right"
                    color="#fff"
                    size={20}
                  />
                  <Text
                    selectable
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontFamily: fontFamily.bold,
                      letterSpacing: 0.2,
                    }}
                  >
                    Start Consultation
                  </Text>
                </View>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    color="#fff"
                    size={22}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        </GradientCard>

        {/* ── Emergency Notice ── */}
        <Card
          style={{
            backgroundColor: palette.dangerSoft,
            borderColor: "#FECACA",
          }}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <IconBubble icon="alert-octagon-outline" tone="danger" size={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontSize: 16,
                  fontFamily: fontFamily.bold,
                }}
              >
                Emergency signs bypass AI
              </Text>
              <Text
                selectable
                style={{
                  color: palette.muted,
                  lineHeight: 20,
                  fontFamily: fontFamily.medium,
                  fontSize: 13,
                }}
              >
                Breathing trouble, seizures, poisoning, severe bleeding, or
                collapse — go straight to{" "}
                {emergencyVet?.clinicName ?? "your veterinarian"}.
              </Text>
            </View>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: palette.danger,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text
              selectable
              style={{
                color: "#fff",
                fontFamily: fontFamily.bold,
                fontSize: 13,
              }}
            >
              Emergency care first
            </Text>
          </View>
        </Card>

        {/* ── Presets ── */}
        <SectionHeader title="Quick Presets" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {presets.map((item) => (
            <View
              key={item}
              style={{
                width: layout.isCompact
                  ? "100%"
                  : layout.isTablet
                    ? "31%"
                    : "47%",
              }}
            >
              <Chip
                label={item}
                icon={presetIcon(item)}
                active={preset === item}
                onPress={() => {
                  setPreset(item);
                  setForm((current) => ({ ...current, symptoms: item }));
                }}
                tone={item === "Poisoning" ? "danger" : "teal"}
              />
            </View>
          ))}
        </View>

        <GhostButton label="Watch Ad for Credit" onPress={watchAd} />

        {/* ── Consultation Form ── */}
        {showForm ? (
          <>
            <SectionHeader title="Guided Consultation" />
            <Card style={{ borderColor: palette.mintLight }}>
              <StepHeader step={step} />

              {step === 1 ? (
                <>
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontSize: 14,
                      fontFamily: fontFamily.bold,
                    }}
                  >
                    Choose pet
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {pets.map((item) => (
                      <OptionButton
                        key={item.id}
                        label={item.name}
                        active={(pet?.id ?? "") === item.id}
                        onPress={() => setSelectedPetId(item.id)}
                        icon={
                          item.species === "Cat"
                            ? "cat"
                            : item.species === "Dog"
                              ? "dog"
                              : "paw"
                        }
                      />
                    ))}
                  </ScrollView>
                  {pet ? (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                        backgroundColor: palette.softTeal,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: palette.mintLight,
                        padding: 12,
                      }}
                    >
                      <PetAvatar pet={pet} size={54} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          selectable
                          style={{
                            color: palette.text,
                            fontFamily: fontFamily.bold,
                            fontSize: 16,
                          }}
                        >
                          {pet.name}
                        </Text>
                        <Text
                          selectable
                          style={{
                            color: palette.muted,
                            fontSize: 12,
                            fontFamily: fontFamily.medium,
                          }}
                        >
                          {pet.breed || pet.species}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="check-circle"
                        color={palette.teal}
                        size={24}
                      />
                    </View>
                  ) : null}
                  <Field
                    label="What is happening?"
                    value={form.symptoms}
                    multiline
                    onChangeText={(symptoms) =>
                      setForm((current) => ({ ...current, symptoms }))
                    }
                  />
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontSize: 14,
                      fontFamily: fontFamily.bold,
                    }}
                  >
                    Appetite
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                  >
                    {["Normal", "Low", "None"].map((appetite) => (
                      <OptionButton
                        key={appetite}
                        label={appetite}
                        active={form.appetite === appetite}
                        onPress={() =>
                          setForm((current) => ({ ...current, appetite }))
                        }
                        tone={appetite === "None" ? "warning" : "teal"}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontSize: 15,
                      fontFamily: fontFamily.bold,
                    }}
                  >
                    How serious does it look?
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: palette.muted,
                      lineHeight: 18,
                      fontFamily: fontFamily.medium,
                      fontSize: 12,
                    }}
                  >
                    The preset already tells us the symptom. These answers add
                    context for urgency.
                  </Text>
                  <View style={{ gap: 10 }}>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                        fontSize: 13,
                      }}
                    >
                      How long has this been happening?
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {durationOptions.map((duration) => (
                        <OptionButton
                          key={duration}
                          label={duration}
                          active={form.vomiting === duration}
                          onPress={() =>
                            setForm((current) => ({
                              ...current,
                              vomiting: duration,
                            }))
                          }
                          tone={duration === "3+ days" ? "warning" : "teal"}
                        />
                      ))}
                    </View>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                        fontSize: 13,
                      }}
                    >
                      How often is it happening?
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {frequencyOptions.map((frequency) => (
                        <OptionButton
                          key={frequency}
                          label={frequency}
                          active={form.diarrhea === frequency}
                          onPress={() =>
                            setForm((current) => ({
                              ...current,
                              diarrhea: frequency,
                            }))
                          }
                          tone={frequency === "Repeated" ? "warning" : "teal"}
                        />
                      ))}
                    </View>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                        fontSize: 13,
                      }}
                    >
                      Energy level
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {energyOptions.map((energy) => (
                        <OptionButton
                          key={energy}
                          label={energy}
                          active={form.mobility === energy}
                          onPress={() =>
                            setForm((current) => ({
                              ...current,
                              mobility: energy,
                            }))
                          }
                          tone={
                            energy === "Very weak"
                              ? "danger"
                              : energy === "Low"
                                ? "warning"
                                : "teal"
                          }
                        />
                      ))}
                    </View>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                        fontSize: 13,
                      }}
                    >
                      Breathing
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {breathingOptions.map((breathing) => (
                        <OptionButton
                          key={breathing}
                          label={breathing}
                          active={form.breathing === breathing}
                          onPress={() =>
                            setForm((current) => ({ ...current, breathing }))
                          }
                          tone={
                            breathing === "Trouble breathing"
                              ? "danger"
                              : breathing === "Changed"
                                ? "warning"
                                : "teal"
                          }
                        />
                      ))}
                    </View>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                        fontSize: 13,
                      }}
                    >
                      Any injury, poisoning, collapse, or bleeding?
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {["None", "Possible", "Yes"].map((injury) => (
                        <OptionButton
                          key={injury}
                          label={injury}
                          active={form.injury === injury}
                          onPress={() =>
                            setForm((current) => ({ ...current, injury }))
                          }
                          tone={
                            injury === "Yes"
                              ? "danger"
                              : injury === "Possible"
                                ? "warning"
                                : "teal"
                          }
                        />
                      ))}
                    </View>
                  </View>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontSize: 15,
                      fontFamily: fontFamily.bold,
                    }}
                  >
                    Final notes & review
                  </Text>
                  <Field
                    label="Water Intake"
                    value={form.waterIntake}
                    onChangeText={(waterIntake) =>
                      setForm((current) => ({ ...current, waterIntake }))
                    }
                  />
                  <Field
                    label="Behavior Changes"
                    value={form.behaviorChanges}
                    onChangeText={(behaviorChanges) =>
                      setForm((current) => ({ ...current, behaviorChanges }))
                    }
                  />
                  <Field
                    label="Notes"
                    value={form.notes}
                    multiline
                    onChangeText={(notes) =>
                      setForm((current) => ({ ...current, notes }))
                    }
                  />
                  <View
                    style={{
                      backgroundColor: palette.softTeal,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: palette.mintLight,
                      padding: 14,
                      gap: 5,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontFamily: fontFamily.bold,
                      }}
                    >
                      Review
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        lineHeight: 20,
                        fontFamily: fontFamily.medium,
                      }}
                    >
                      {pet?.name ?? "Pet"} • {preset} • Appetite:{" "}
                      {form.appetite}
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        lineHeight: 20,
                        fontFamily: fontFamily.medium,
                      }}
                    >
                      Duration: {form.vomiting} • Frequency: {form.diarrhea} •
                      Energy: {form.mobility}
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        lineHeight: 20,
                        fontFamily: fontFamily.medium,
                      }}
                    >
                      Breathing: {form.breathing} • Warning signs: {form.injury}
                    </Text>
                  </View>
                </>
              ) : null}

              <Text
                selectable
                style={{
                  color: palette.muted,
                  lineHeight: 20,
                  fontFamily: fontFamily.medium,
                  fontSize: 12,
                }}
              >
                {AI_SAFETY_NOTICE}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 7,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  paddingTop: 2,
                }}
              >
                {step > 1 ? (
                  <GuideActionButton
                    label="Back"
                    icon="arrow-left"
                    onPress={() =>
                      setStep((current) => Math.max(1, current - 1))
                    }
                  />
                ) : null}
                {step < 3 ? (
                  <GuideActionButton
                    label="Continue"
                    icon="arrow-right"
                    primary
                    onPress={goNext}
                  />
                ) : (
                  <GuideActionButton
                    label={busy ? "Checking..." : "Submit"}
                    icon="heart-pulse"
                    primary
                    disabled={busy}
                    onPress={submit}
                  />
                )}
                <GuideActionButton
                  label="Cancel"
                  icon="close"
                  danger
                  onPress={closeConsultation}
                />
              </View>
            </Card>
          </>
        ) : null}

        {/* ── Latest Result ── */}
        {latestResult ? (
          <>
            <SectionHeader
              title="AI Guidance"
              action={latestResult.offline ? "Saved guidance" : "AI response"}
            />
            <Card
              style={{
                backgroundColor:
                  latestResult.consultation.riskLevel === "Emergency"
                    ? palette.dangerSoft
                    : palette.softTeal,
                borderColor:
                  latestResult.consultation.riskLevel === "Emergency"
                    ? "#FECACA"
                    : palette.mintLight,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <IconBubble
                  icon={
                    latestResult.consultation.riskLevel === "Emergency"
                      ? "alert-octagon-outline"
                      : "robot-happy-outline"
                  }
                  tone={
                    latestResult.consultation.riskLevel === "Emergency"
                      ? "danger"
                      : "teal"
                  }
                  size={48}
                />
                <View style={{ flex: 1, gap: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontSize: 18,
                        fontFamily: fontFamily.black,
                      }}
                    >
                      {latestResult.consultation.preset}
                    </Text>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor:
                          latestResult.consultation.riskLevel === "Emergency"
                            ? palette.danger
                            : "#fff",
                        borderWidth: 1,
                        borderColor:
                          latestResult.consultation.riskLevel === "Emergency"
                            ? palette.danger
                            : palette.mintLight,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          color:
                            latestResult.consultation.riskLevel === "Emergency"
                              ? "#fff"
                              : palette.teal,
                          fontSize: 11,
                          fontFamily: fontFamily.bold,
                        }}
                      >
                        {latestResult.consultation.riskLevel}
                      </Text>
                    </View>
                  </View>
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontSize: 14,
                      fontFamily: fontFamily.medium,
                      lineHeight: 22,
                    }}
                  >
                    {latestResult.consultation.guidance}
                  </Text>
                  {latestResult.offline ? (
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        fontSize: 12,
                        fontFamily: fontFamily.medium,
                        lineHeight: 18,
                      }}
                    >
                      No AI credit was deducted for this saved guidance.
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </>
        ) : null}

        {/* ── History ── */}
        <SectionHeader
          title="Recent Consultations"
          action={`${consultations.length} saved`}
        />
        {consultations.length === 0 ? (
          <EmptyState
            title="No consultations yet"
            message="Start a consultation when you need general guidance."
            icon="robot-outline"
          />
        ) : (
          consultations.slice(0, 4).map((consultation) => {
            const historyPet = pets.find(
              (item) => item.id === consultation.petId,
            );
            const isEmergency = consultation.riskLevel === "Emergency";
            return (
              <Card
                key={consultation.id}
                style={{
                  backgroundColor: isEmergency
                    ? palette.dangerSoft
                    : palette.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <IconBubble
                    icon="history"
                    tone={isEmergency ? "danger" : "teal"}
                    size={44}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      selectable
                      style={{
                        color: palette.text,
                        fontSize: 15,
                        fontFamily: fontFamily.bold,
                      }}
                    >
                      {consultation.preset}{" "}
                      <Text
                        style={{
                          color: isEmergency ? palette.danger : palette.teal,
                        }}
                      >
                        • {consultation.riskLevel}
                      </Text>
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        fontSize: 12,
                        fontFamily: fontFamily.medium,
                      }}
                    >
                      {historyPet?.name ?? "Pet"} • {consultation.createdAt}
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: palette.muted,
                        fontSize: 13,
                        fontFamily: fontFamily.medium,
                        lineHeight: 19,
                      }}
                    >
                      {consultation.guidance}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ResponsiveScrollView>
    </Screen>
  );
}
