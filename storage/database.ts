import { Platform } from "react-native";
import { AiCreditState, AppSnapshot, Consultation, HealthRecord, Owner, Pet, Reminder, Settings, Veterinarian } from "@/types/domain";

type DatabaseModule = typeof import("./database.web");

let modulePromise: Promise<DatabaseModule> | null = null;

function database(): Promise<DatabaseModule> {
  if (!modulePromise) {
    modulePromise = Platform.OS === "web"
      ? import("./database.web")
      : import("./database.native");
  }
  return modulePromise;
}

export async function initDatabase() {
  return (await database()).initDatabase();
}

export async function getSnapshot(): Promise<AppSnapshot> {
  return (await database()).getSnapshot();
}

export async function replaceSnapshot(snapshot: AppSnapshot) {
  return (await database()).replaceSnapshot(snapshot);
}

export async function upsertOwner(owner: Owner) {
  return (await database()).upsertOwner(owner);
}

export async function upsertPet(pet: Omit<Pet, "id" | "createdAt"> & Partial<Pick<Pet, "id" | "createdAt">>) {
  return (await database()).upsertPet(pet);
}

export async function deletePet(id: string) {
  return (await database()).deletePet(id);
}

export async function upsertVet(vet: Omit<Veterinarian, "id" | "createdAt"> & Partial<Pick<Veterinarian, "id" | "createdAt">>) {
  return (await database()).upsertVet(vet);
}

export async function deleteVet(id: string) {
  return (await database()).deleteVet(id);
}

export async function upsertRecord(record: Omit<HealthRecord, "id" | "createdAt"> & Partial<Pick<HealthRecord, "id" | "createdAt">>) {
  return (await database()).upsertRecord(record);
}

export async function deleteRecord(id: string) {
  return (await database()).deleteRecord(id);
}

export async function upsertReminder(reminder: Omit<Reminder, "id" | "createdAt"> & Partial<Pick<Reminder, "id" | "createdAt">>) {
  return (await database()).upsertReminder(reminder);
}

export async function deleteReminder(id: string) {
  return (await database()).deleteReminder(id);
}

export async function upsertConsultation(consultation: Consultation) {
  return (await database()).upsertConsultation(consultation);
}

export async function upsertSettings(settings: Settings) {
  return (await database()).upsertSettings(settings);
}

export async function upsertCreditState(creditState: AiCreditState) {
  return (await database()).upsertCreditState(creditState);
}
