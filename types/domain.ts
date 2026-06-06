export type PetSpecies = "Dog" | "Cat" | "Other";
export type Sex = "Male" | "Female";
export type RecordType =
  | "Vaccination"
  | "Deworming"
  | "Medication"
  | "Surgery"
  | "Checkup"
  | "Grooming"
  | "Allergy"
  | "Lab Test"
  | "Other";
export type ReminderType = "Vaccination" | "Deworming" | "Medication" | "Appointment" | "Grooming" | "Custom";
export type ReminderStatus = "Upcoming" | "Due Today" | "Overdue" | "Completed";
export type RiskLevel = "Mild" | "Moderate" | "Severe" | "Emergency";
export type CareMode = "solo" | "home";
export type SyncStatus = "synced" | "pending" | "error";

export type SyncMetadata = {
  homeId?: string;
  updatedAt?: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  syncStatus?: SyncStatus;
};

export type Owner = {
  id: string;
  fullName: string;
  birthday: string;
};

export type Pet = SyncMetadata & {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: Sex;
  birthday: string;
  weightKg: number;
  color: string;
  microchipNumber?: string;
  notes: string;
  photoUri?: string;
  photoStoragePath?: string;
  assignedVetId?: string;
  createdAt: string;
};

export type Veterinarian = SyncMetadata & {
  id: string;
  clinicName: string;
  veterinarianName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  emergencyHotline: string;
  hours: string;
  notes: string;
  isPrimary: boolean;
  createdAt: string;
};

export type HealthRecord = SyncMetadata & {
  id: string;
  petId: string;
  type: RecordType;
  date: string;
  veterinarian: string;
  clinic: string;
  notes: string;
  attachmentUri?: string;
  attachmentStoragePath?: string;
  nextScheduleDate?: string;
  createdAt: string;
};

export type Reminder = SyncMetadata & {
  id: string;
  petId: string;
  type: ReminderType;
  title: string;
  dueDate: string;
  completedAt?: string;
  linkedRecordId?: string;
  notes: string;
  createdAt: string;
};

export type Consultation = {
  id: string;
  petId: string;
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
  riskLevel: RiskLevel;
  guidance: string;
  emergencyFlags: string;
  createdAt: string;
};

export type AiCreditState = {
  aiCredits: number;
  starterCreditsGranted: boolean;
  weeklyAdWatchCount: number;
  lastWeeklyResetDate: string;
  lastWeeklyCreditClaimDate?: string;
  totalConsultationsUsed: number;
};

export type Settings = {
  notificationsEnabled: boolean;
  dailySummaryTime: string;
  careMode: CareMode | null;
  homeId?: string;
  homeName?: string;
  homeInviteCode?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
};

export type AppSnapshot = {
  owner: Owner;
  pets: Pet[];
  veterinarians: Veterinarian[];
  records: HealthRecord[];
  reminders: Reminder[];
  consultations: Consultation[];
  creditState: AiCreditState;
  settings: Settings;
};
