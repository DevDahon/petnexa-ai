export type LegalSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export const PRIVACY_POLICY_URL = "https://dahon19.github.io/petnexa-ai-privacy/";
export const SUPPORT_EMAIL = "leaves0819@gmail.com";

export const privacyPolicySections: LegalSection[] = [
  {
    title: "Data Storage",
    body: "PetNexa AI stores owner profiles, pet profiles, health records, reminders, and AI consultation history on the device by default.",
    bullets: [
      "Home Furparent sync sends selected pet, record, reminder, and veterinarian data to Supabase only after the user connects a Home account.",
      "AI consultations send the submitted symptoms and care context to the configured AI service so guidance can be generated.",
      "Portable backups are user-created files and may include local images when available.",
    ],
  },
  {
    title: "User Control",
    body: "The app keeps privacy-sensitive actions visible in Settings so users can export, import, sync, or delete local data intentionally.",
    bullets: [
      "Diagnostics and analytics are off by default.",
      "Ad personalization consent is separate from general app usage.",
      "Deleting local data does not silently delete a Home account or cloud data.",
    ],
  },
  {
    title: "Security",
    body: "Authentication tokens and installation identifiers use Expo secure storage on supported native devices. The app avoids sending diagnostics unless the user enables and exports them.",
  },
];

export const termsSections: LegalSection[] = [
  {
    title: "Care Guidance",
    body: "PetNexa AI supports care tracking and informational guidance. It does not diagnose, prescribe, or replace licensed veterinary care.",
  },
  {
    title: "User Responsibility",
    body: "Users are responsible for reviewing records before importing backups, sharing backup files only with trusted people, and contacting a veterinarian for urgent or worsening symptoms.",
  },
  {
    title: "Connectivity",
    body: "Cloud sync, AI consultation, ads, and sharing features require compatible device services and network connectivity.",
  },
];

export const aiSafetySections: LegalSection[] = [
  {
    title: "Emergency Cases",
    body: "The app should direct severe symptoms, breathing issues, injury, poisoning, seizures, and rapidly worsening conditions to urgent veterinary care.",
  },
  {
    title: "Limitations",
    body: "AI output can miss context. Users should treat it as informational and verify decisions with a veterinarian.",
  },
];
