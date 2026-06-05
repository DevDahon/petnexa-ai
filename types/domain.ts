export type PetSpecies = "Dog" | "Cat" | "Other";
export type Sex = "Male" | "Female" | "Unknown";
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

export type Owner = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  preferredVetId?: string;
  notes: string;
  profilePhotoUri?: string;
};

export type Pet = {
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
  assignedVetId?: string;
  createdAt: string;
};

export type Veterinarian = {
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

export type HealthRecord = {
  id: string;
  petId: string;
  type: RecordType;
  date: string;
  veterinarian: string;
  clinic: string;
  notes: string;
  attachmentUri?: string;
  nextScheduleDate?: string;
  createdAt: string;
};

export type Reminder = {
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
  optionalCloudSyncEnabled: boolean;
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
