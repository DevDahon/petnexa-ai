import NetInfo from "@react-native-community/netinfo";
import { Consultation, Pet, RiskLevel } from "@/types/domain";
import { createId, todayIso } from "@/utils/date";

export const AI_SAFETY_NOTICE = "This AI assistant provides informational guidance only and does not replace professional veterinary care.";

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
      guidance: "Emergency signs were detected. Contact a veterinarian or emergency clinic immediately before continuing any home monitoring.",
    };
  }
  const joined = `${input.symptoms} ${input.vomiting} ${input.diarrhea} ${input.appetite} ${input.behaviorChanges}`.toLowerCase();
  if (joined.includes("weak") || joined.includes("not eating") || joined.includes("cough") || joined.includes("wound")) {
    return {
      riskLevel: "Moderate" as RiskLevel,
      guidance: "A veterinary consultation is recommended, especially if symptoms persist, worsen, or combine with lethargy, pain, dehydration, or abnormal breathing.",
    };
  }
  return {
    riskLevel: "Mild" as RiskLevel,
    guidance: "Monitor your pet closely, keep notes on appetite, water intake, stool, energy, and symptom timing, and contact a veterinarian if the issue persists or worsens.",
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
    if (!network.isConnected) {
      offline = true;
    } else {
      const endpoint = process.env.EXPO_PUBLIC_AI_PROXY_URL || "/api/consultation";
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pet: { species: input.pet.species, breed: input.pet.breed, weightKg: input.pet.weightKg, birthday: input.pet.birthday },
            symptoms: input,
            safety: AI_SAFETY_NOTICE,
          }),
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
