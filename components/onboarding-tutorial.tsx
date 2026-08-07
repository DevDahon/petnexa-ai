import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInRight,
} from "react-native-reanimated";
import { BrandMark, useResponsiveLayout } from "@/components/ui";
import { fontFamily, radii } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import type { ThemeMode } from "@/types/domain";

interface OnboardingTutorialProps {
  onComplete?: () => void;
}

type Stage = "theme" | "tutorial";

const STEPS = [
  {
    id: "pets",
    title: "Pet Profiles & Digital Passport",
    subtitle: "Store your pets' health details, weight history, breed, and microchip number in a clean digital profile.",
    icon: "paw" as const,
    badgeText: "Digital Passport",
    accentColor: "#0D9488",
    preview: {
      petName: "Buddy",
      species: "Golden Retriever • Dog",
      weight: "12.5 kg",
      chip: "CHIP #985141000000001",
      status: "Up to date",
    },
  },
  {
    id: "reminders",
    title: "Smart Reminders & Schedule",
    subtitle: "Get timely notifications for vaccinations, deworming, medication doses, and grooming appointments.",
    icon: "bell-ring-outline" as const,
    badgeText: "Care Alerts",
    accentColor: "#6366F1",
    preview: {
      item1: "Rabies Vaccine Booster",
      date1: "Due in 3 days",
      item2: "Flea & Tick Prevention",
      date2: "Scheduled for next week",
    },
  },
  {
    id: "ai",
    title: "AI Symptom Checker & Triage",
    subtitle: "Check symptoms anytime with intelligent triage risk assessments, symptom presets, and care guidance.",
    icon: "robot-excited-outline" as const,
    badgeText: "AI Assistant",
    accentColor: "#10B981",
    preview: {
      query: "My pet is eating less today",
      riskLevel: "Mild Risk • Monitor",
      recommendation: "Ensure fresh water access & observe next meal.",
    },
  },
  {
    id: "vets",
    title: "Vet Directory & Hotline",
    subtitle: "Store clinic information, primary veterinarian contacts, and 1-tap direct emergency phone calling.",
    icon: "hospital-building" as const,
    badgeText: "Vet Contacts",
    accentColor: "#EF4444",
    preview: {
      clinic: "Central Animal Hospital",
      vet: "Dr. Sarah Jenkins",
      phone: "+1 (555) 019-2831",
      emergency: "24/7 Hotline Available",
    },
  },
  {
    id: "sync",
    title: "Household Sync & Data Care",
    subtitle: "Share care duties with family in Home Furparent mode, or keep everything offline & private on device in Solo mode.",
    icon: "shield-sync-outline" as const,
    badgeText: "Private & Synced",
    accentColor: "#F59E0B",
    preview: {
      mode: "Care Mode Active",
      storage: "Encrypted & Secure",
      syncStatus: "Ready for your household",
    },
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { settings, setThemeMode, completeTutorial } = useAppData();
  const layout = useResponsiveLayout();

  const [stage, setStage] = useState<Stage>("theme");
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(settings.themeMode || "light");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Animations
  const pulseAnim = useSharedValue(1);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      true
    );
    floatAnim.value = withRepeat(
      withSequence(withTiming(-6, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const handleSelectTheme = async (mode: ThemeMode) => {
    setSelectedTheme(mode);
    await setThemeMode(mode);
  };

  const handleNextStage = () => {
    setStage("tutorial");
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setStage("theme");
    }
  };

  const handleFinish = async () => {
    await completeTutorial();
    if (onComplete) onComplete();
  };

  const isDark = selectedTheme === "dark";
  const bgColor = isDark ? "#0F172A" : "#F8FAFC";
  const cardColor = isDark ? "#1E293B" : "#FFFFFF";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const mutedColor = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "#334155" : "#E2E8F0";

  const activeStep = STEPS[currentStepIndex];

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <LinearGradient
        colors={isDark ? ["#0F172A", "#1E293B"] : ["#F8FAFC", "#EEF2FF"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: layout.isTiny ? 14 : layout.isCompact ? 20 : 28,
              paddingVertical: 36,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: "100%", maxWidth: 520, gap: 20 }}>
              {/* Header */}
              <View style={{ alignItems: "center", gap: 8 }}>
                <BrandMark />
                <Text
                  style={{
                    color: textColor,
                    fontSize: layout.isCompact ? 20 : 24,
                    fontFamily: fontFamily.black,
                    textAlign: "center",
                  }}
                >
                  {stage === "theme" ? "Choose Your Theme" : activeStep.title}
                </Text>
                <Text
                  style={{
                    color: mutedColor,
                    fontSize: 14,
                    fontFamily: fontFamily.medium,
                    textAlign: "center",
                    lineHeight: 21,
                    maxWidth: 420,
                  }}
                >
                  {stage === "theme"
                    ? "Select light or dark mode to personalize your PetNexa AI care experience."
                    : activeStep.subtitle}
                </Text>
              </View>

              {/* STAGE 1: THEME SELECTION */}
              {stage === "theme" ? (
                <Animated.View entering={FadeIn.duration(400)} style={{ gap: 16 }}>
                  {/* Theme Cards Grid */}
                  <View style={{ gap: 12 }}>
                    {/* Light Mode Option */}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleSelectTheme("light")}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        backgroundColor: "#FFFFFF",
                        borderRadius: radii.xl,
                        borderWidth: selectedTheme === "light" ? 2.5 : 1.5,
                        borderColor: selectedTheme === "light" ? "#0D9488" : "#E2E8F0",
                        padding: 16,
                        gap: 12,
                      })}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: radii.pill,
                              backgroundColor: "#F0FDFA",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MaterialCommunityIcons name="white-balance-sunny" color="#0D9488" size={22} />
                          </View>
                          <View>
                            <Text style={{ color: "#0F172A", fontSize: 16, fontFamily: fontFamily.black }}>
                              Light Mode
                            </Text>
                            <Text style={{ color: "#64748B", fontSize: 12, fontFamily: fontFamily.medium }}>
                              Crisp slate & bright clean UI
                            </Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name={selectedTheme === "light" ? "check-circle" : "checkbox-blank-circle-outline"}
                          color={selectedTheme === "light" ? "#0D9488" : "#CBD5E1"}
                          size={24}
                        />
                      </View>

                      {/* Mini Live Preview */}
                      <View
                        style={{
                          backgroundColor: "#F8FAFC",
                          borderRadius: radii.md,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#0D9488" }} />
                          <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: "#CBD5E1" }} />
                        </View>
                        <View style={{ width: "60%", height: 6, borderRadius: 3, backgroundColor: "#E2E8F0" }} />
                      </View>
                    </Pressable>

                    {/* Dark Mode Option */}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleSelectTheme("dark")}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        backgroundColor: "#1E293B",
                        borderRadius: radii.xl,
                        borderWidth: selectedTheme === "dark" ? 2.5 : 1.5,
                        borderColor: selectedTheme === "dark" ? "#0D9488" : "#334155",
                        padding: 16,
                        gap: 12,
                      })}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: radii.pill,
                              backgroundColor: "#112D2B",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MaterialCommunityIcons name="moon-waning-crescent" color="#10B981" size={22} />
                          </View>
                          <View>
                            <Text style={{ color: "#F8FAFC", fontSize: 16, fontFamily: fontFamily.black }}>
                              Dark Mode
                            </Text>
                            <Text style={{ color: "#94A3B8", fontSize: 12, fontFamily: fontFamily.medium }}>
                              Sleek midnight & glowing contrast
                            </Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name={selectedTheme === "dark" ? "check-circle" : "checkbox-blank-circle-outline"}
                          color={selectedTheme === "dark" ? "#10B981" : "#64748B"}
                          size={24}
                        />
                      </View>

                      {/* Mini Live Preview */}
                      <View
                        style={{
                          backgroundColor: "#0F172A",
                          borderRadius: radii.md,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: "#334155",
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" }} />
                          <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: "#475569" }} />
                        </View>
                        <View style={{ width: "60%", height: 6, borderRadius: 3, backgroundColor: "#334155" }} />
                      </View>
                    </Pressable>
                  </View>

                  {/* Primary Next Action */}
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleNextStage}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: "#0D9488",
                      minHeight: 52,
                      borderRadius: radii.pill,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 8,
                    })}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: fontFamily.black }}>
                      Continue to Feature Tour
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" color="#FFFFFF" size={20} />
                  </Pressable>
                </Animated.View>
              ) : null}

              {/* STAGE 2: STEP BY STEP FEATURE TUTORIAL */}
              {stage === "tutorial" ? (
                <Animated.View entering={FadeInRight.duration(350)} style={{ gap: 20 }}>
                  {/* Progress Indicator */}
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: mutedColor, fontSize: 12, fontFamily: fontFamily.bold }}>
                        STEP {currentStepIndex + 1} OF {STEPS.length}
                      </Text>
                      <Pressable onPress={handleFinish}>
                        <Text style={{ color: "#0D9488", fontSize: 13, fontFamily: fontFamily.bold }}>
                          Skip Tour
                        </Text>
                      </Pressable>
                    </View>

                    {/* Progress Bar Track */}
                    <View
                      style={{
                        height: 6,
                        backgroundColor: isDark ? "#334155" : "#E2E8F0",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                          backgroundColor: activeStep.accentColor,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>

                  {/* Feature Interactive Showcase Card */}
                  <View
                    style={{
                      backgroundColor: cardColor,
                      borderRadius: radii.xxl,
                      borderWidth: 1.5,
                      borderColor: borderColor,
                      padding: layout.isCompact ? 18 : 22,
                      gap: 16,
                    }}
                  >
                    {/* Top Feature Badge */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor: isDark ? "#112D2B" : "#F0FDFA",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: radii.pill,
                          borderWidth: 1,
                          borderColor: isDark ? "#0D9488" : "#CCFBF1",
                        }}
                      >
                        <MaterialCommunityIcons name={activeStep.icon} color={activeStep.accentColor} size={18} />
                        <Text style={{ color: activeStep.accentColor, fontSize: 12, fontFamily: fontFamily.black }}>
                          {activeStep.badgeText}
                        </Text>
                      </View>

                      {/* Animated Floating Pulse Tag */}
                      <Animated.View style={[pulseStyle, floatStyle]}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: activeStep.accentColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialCommunityIcons name="creation" color="#FFFFFF" size={16} />
                        </View>
                      </Animated.View>
                    </View>

                    {/* Feature Specific Live Demo Preview */}
                    <View
                      style={{
                        backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                        borderRadius: radii.xl,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#E2E8F0",
                        gap: 12,
                      }}
                    >
                      {activeStep.id === "pets" ? (
                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: radii.pill,
                                backgroundColor: "#0D9488",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MaterialCommunityIcons name="dog" color="#FFFFFF" size={26} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: textColor, fontSize: 16, fontFamily: fontFamily.black }}>
                                {activeStep.preview.petName}
                              </Text>
                              <Text style={{ color: mutedColor, fontSize: 12, fontFamily: fontFamily.medium }}>
                                {activeStep.preview.species}
                              </Text>
                            </View>
                            <View
                              style={{
                                backgroundColor: "#D1FAE5",
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: radii.pill,
                              }}
                            >
                              <Text style={{ color: "#047857", fontSize: 11, fontFamily: fontFamily.bold }}>
                                {activeStep.preview.status}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: cardColor,
                                padding: 10,
                                borderRadius: radii.md,
                                borderWidth: 1,
                                borderColor: borderColor,
                              }}
                            >
                              <Text style={{ color: mutedColor, fontSize: 11, fontFamily: fontFamily.medium }}>Weight</Text>
                              <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamily.black }}>
                                {activeStep.preview.weight}
                              </Text>
                            </View>
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: cardColor,
                                padding: 10,
                                borderRadius: radii.md,
                                borderWidth: 1,
                                borderColor: borderColor,
                              }}
                            >
                              <Text style={{ color: mutedColor, fontSize: 11, fontFamily: fontFamily.medium }}>Microchip</Text>
                              <Text style={{ color: textColor, fontSize: 11, fontFamily: fontFamily.bold }} numberOfLines={1}>
                                {activeStep.preview.chip}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {activeStep.id === "reminders" ? (
                        <View style={{ gap: 8 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: cardColor,
                              padding: 12,
                              borderRadius: radii.lg,
                              borderWidth: 1,
                              borderColor: borderColor,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                              <MaterialCommunityIcons name="needle" color="#6366F1" size={20} />
                              <View>
                                <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamily.black }}>
                                  {activeStep.preview.item1}
                                </Text>
                                <Text style={{ color: "#6366F1", fontSize: 12, fontFamily: fontFamily.bold }}>
                                  {activeStep.preview.date1}
                                </Text>
                              </View>
                            </View>
                            <MaterialCommunityIcons name="clock-outline" color="#6366F1" size={20} />
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: cardColor,
                              padding: 12,
                              borderRadius: radii.lg,
                              borderWidth: 1,
                              borderColor: borderColor,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                              <MaterialCommunityIcons name="pill" color="#10B981" size={20} />
                              <View>
                                <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamily.black }}>
                                  {activeStep.preview.item2}
                                </Text>
                                <Text style={{ color: mutedColor, fontSize: 12, fontFamily: fontFamily.medium }}>
                                  {activeStep.preview.date2}
                                </Text>
                              </View>
                            </View>
                            <MaterialCommunityIcons name="check-circle-outline" color="#10B981" size={20} />
                          </View>
                        </View>
                      ) : null}

                      {activeStep.id === "ai" ? (
                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <MaterialCommunityIcons name="brain" color="#10B981" size={20} />
                            <Text style={{ color: textColor, fontSize: 13, fontFamily: fontFamily.bold }}>
                              "{activeStep.preview.query}"
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: isDark ? "#064E3B" : "#ECFDF5",
                              padding: 10,
                              borderRadius: radii.md,
                              borderWidth: 1,
                              borderColor: isDark ? "#059669" : "#A7F3D0",
                              gap: 4,
                            }}
                          >
                            <Text style={{ color: isDark ? "#34D399" : "#047857", fontSize: 12, fontFamily: fontFamily.black }}>
                              {activeStep.preview.riskLevel}
                            </Text>
                            <Text style={{ color: isDark ? "#A7F3D0" : "#065F46", fontSize: 12, fontFamily: fontFamily.medium }}>
                              {activeStep.preview.recommendation}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {activeStep.id === "vets" ? (
                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: radii.pill,
                                backgroundColor: "#FEF2F2",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MaterialCommunityIcons name="doctor" color="#EF4444" size={22} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamily.black }}>
                                {activeStep.preview.clinic}
                              </Text>
                              <Text style={{ color: mutedColor, fontSize: 12, fontFamily: fontFamily.medium }}>
                                {activeStep.preview.vet}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={{
                              backgroundColor: "#EF4444",
                              borderRadius: radii.pill,
                              paddingVertical: 10,
                              paddingHorizontal: 14,
                              alignItems: "center",
                              flexDirection: "row",
                              justifyContent: "center",
                              gap: 8,
                            }}
                          >
                            <MaterialCommunityIcons name="phone-in-talk" color="#FFFFFF" size={18} />
                            <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: fontFamily.black }}>
                              {activeStep.preview.phone} ({activeStep.preview.emergency})
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {activeStep.id === "sync" ? (
                        <View style={{ gap: 10, alignItems: "center", paddingVertical: 6 }}>
                          <View
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 26,
                              backgroundColor: isDark ? "#322A14" : "#FEFCE8",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1.5,
                              borderColor: "#F59E0B",
                            }}
                          >
                            <MaterialCommunityIcons name="lock-check" color="#F59E0B" size={28} />
                          </View>

                          <View style={{ alignItems: "center", gap: 2 }}>
                            <Text style={{ color: textColor, fontSize: 15, fontFamily: fontFamily.black }}>
                              {activeStep.preview.mode}
                            </Text>
                            <Text style={{ color: mutedColor, fontSize: 12, fontFamily: fontFamily.medium }}>
                              {activeStep.preview.storage} • {activeStep.preview.syncStatus}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Navigation Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handlePrevStep}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.75 : 1,
                        flex: 1,
                        minHeight: 52,
                        borderRadius: radii.pill,
                        backgroundColor: cardColor,
                        borderWidth: 1.5,
                        borderColor: borderColor,
                        alignItems: "center",
                        justifyContent: "center",
                      })}
                    >
                      <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamily.bold }}>
                        Back
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={handleNextStep}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                        flex: 2,
                        minHeight: 52,
                        borderRadius: radii.pill,
                        backgroundColor: activeStep.accentColor,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                      })}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: fontFamily.black }}>
                        {currentStepIndex === STEPS.length - 1 ? "Get Started" : "Next Feature"}
                      </Text>
                      <MaterialCommunityIcons
                        name={currentStepIndex === STEPS.length - 1 ? "check-bold" : "arrow-right"}
                        color="#FFFFFF"
                        size={20}
                      />
                    </Pressable>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
