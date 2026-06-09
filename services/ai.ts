import NetInfo from "@react-native-community/netinfo";
import { Consultation, Pet, RiskLevel } from "@/types/domain";
import { createId, todayIso } from "@/utils/date";

export const AI_SAFETY_NOTICE =
  "This AI assistant provides informational guidance only. It does not diagnose, prescribe medication, provide dosage instructions, or replace professional veterinary care.";

const emergencyRules = [
  "difficulty breathing",
  "trouble breathing",
  "seizure",
  "seizures",
  "unconscious",
  "severe bleeding",
  "poison",
  "poisoning",
  "blood in stool",
  "blood in urine",
  "continuous vomiting",
  "severe dehydration",
];

export type ConsultationInput = {
  pet: Pet;
  preset: string;
  symptoms: string;
  appetite: string;
  waterIntake: string;
  behaviorChanges: string;
  vomiting: string;
  diarrhea: string;
  mobility: string;
  breathing: string;
  injury: string;
  notes: string;
};

export function detectEmergency(input: Omit<ConsultationInput, "pet">) {
  const text = Object.values(input).join(" ").toLowerCase();
  return emergencyRules.filter((rule) => text.includes(rule));
}

function localGuidance(input: ConsultationInput, flags: string[]) {
  if (flags.length > 0) {
    return {
      riskLevel: "Emergency" as RiskLevel,
      guidance:
        "Emergency signs were detected. Contact a veterinarian or emergency clinic immediately before continuing any home monitoring.",
    };
  }
  const joined = `${input.preset} ${input.symptoms} ${input.vomiting} ${input.diarrhea} ${input.appetite} ${input.behaviorChanges} ${input.mobility} ${input.breathing} ${input.injury} ${input.notes}`.toLowerCase();
  if (
    joined.includes("weak") ||
    joined.includes("not eating") ||
    joined.includes("cough") ||
    joined.includes("wound") ||
    joined.includes("repeated") ||
    joined.includes("abnormal breathing")
  ) {
    return {
      riskLevel: "Moderate" as RiskLevel,
      guidance:
        "Use supportive monitoring while you plan timely veterinary advice if this continues: keep your pet calm, offer fresh water, avoid sudden diet changes, track appetite, water intake, stool, breathing, energy, and symptom timing, and do not give medication unless a veterinarian already instructed it. Escalate sooner if symptoms repeat, worsen, or combine with lethargy, pain, dehydration, or breathing changes.",
    };
  }
  return {
    riskLevel: "Mild" as RiskLevel,
    guidance:
      "This sounds mild from the details provided. Monitor at home for now: keep fresh water available, offer normal food gently if your pet wants it, avoid new treats or sudden diet changes, keep activity calm, and record appetite, water intake, stool, energy, and symptom timing. Get veterinary help only if it repeats, persists beyond a short observation period, worsens, or any red flags appear.",
  };
}

function buildProviderPayload(input: ConsultationInput) {
  return {
    pet: {
      species: input.pet.species,
      breed: input.pet.breed,
      weightKg: input.pet.weightKg,
      birthday: input.pet.birthday,
    },
    symptoms: {
      preset: input.preset,
      description: input.symptoms,
      duration: input.vomiting,
      frequency: input.diarrhea,
      appetite: input.appetite,
      waterIntake: input.waterIntake,
      energyOrMobility: input.mobility,
      breathing: input.breathing,
      injuryOrWarningSigns: input.injury,
      behaviorChanges: input.behaviorChanges,
      notes: input.notes,
    },
    safety: AI_SAFETY_NOTICE,
  };
}

export async function buildConsultation(input: ConsultationInput): Promise<{ consultation: Consultation; offline: boolean }> {
  const flags = detectEmergency(input);
  const fallback = localGuidance(input, flags);
  let guidance = fallback.guidance;
  let riskLevel = fallback.riskLevel;
  let offline = false;

  if (flags.length === 0) {
    const network = await NetInfo.fetch();
    const confirmedOffline = network.isConnected === false && network.isInternetReachable === false;
    if (confirmedOffline) {
      offline = true;
    } else {
      const endpoint = process.env.EXPO_PUBLIC_AI_PROXY_URL || "/api/consultation";
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildProviderPayload(input)),
        });
        if (!response.ok) {
          offline = true;
        } else {
          const data = await response.json();
          guidance = String(data.guidance || guidance);
          riskLevel = (data.riskLevel || riskLevel) as RiskLevel;
        }
      } catch {
        offline = true;
      }
    }
  }

  return {
    offline,
    consultation: {
      id: createId("consult"),
      petId: input.pet.id,
      preset: input.preset,
      symptoms: input.symptoms,
      appetite: input.appetite,
      waterIntake: input.waterIntake,
      behaviorChanges: input.behaviorChanges,
      vomiting: input.vomiting,
      diarrhea: input.diarrhea,
      mobility: input.mobility,
      breathing: input.breathing,
      injury: input.injury,
      notes: input.notes,
      riskLevel,
      guidance,
      emergencyFlags: flags.join(", "),
      createdAt: todayIso(),
    },
  };
}
