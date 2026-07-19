export type LegalSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export const PRIVACY_POLICY_URL = "https://devdahon.github.io/petnexa-ai-privacy/";
export const SUPPORT_EMAIL = "leaves0819@gmail.com";

export const supportFaqSections: LegalSection[] = [
  {
    title: "Before contacting support",
    body: "Export diagnostics only when support asks for them. Diagnostic logs are stored locally and are not uploaded automatically.",
    bullets: [
      "Include your app version, device platform, and whether you use Solo or Home mode.",
      "Do not send backup files unless support specifically requests them, because backups can contain pet health data and images.",
      "For urgent symptoms, contact a veterinarian or emergency clinic before waiting for app support.",
    ],
  },
  {
    title: "Data requests",
    body: "For privacy or data questions, email support with the subject PetNexa AI data request.",
    bullets: [
      "Local-only Solo data stays on your device and can be exported, deleted locally, or removed by uninstalling the app.",
      "Home Furparent cloud data may require Home account details so the request can be reviewed accurately.",
      "AI provider, ad, authentication, and abuse-prevention logs may follow provider retention rules outside local device controls.",
    ],
  },
  {
    title: "Common troubleshooting",
    body: "Most issues can be narrowed down from Settings before sending support details.",
    bullets: [
      "Use Data > Sync Now when Home sync shows pending or failed changes.",
      "Check Preferences when care reminders are visible in the app but device notifications are not appearing.",
      "Use Backup & Restore before major device changes so local records are not lost.",
    ],
  },
];

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
