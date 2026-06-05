import AsyncStorage from "@react-native-async-storage/async-storage";
import { AiCreditState, AppSnapshot, Consultation, HealthRecord, Owner, Pet, Reminder, Settings, Veterinarian } from "@/types/domain";
import { sampleData } from "@/data/sample";
import { createId, todayIso } from "@/utils/date";

const STORAGE_KEY = "petnexa_web_snapshot";

async function readSnapshot(): Promise<AppSnapshot> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return sampleData;
  return JSON.parse(raw) as AppSnapshot;
}

async function writeSnapshot(snapshot: AppSnapshot) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export async function initDatabase() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) await writeSnapshot(sampleData);
}

export async function getSnapshot(): Promise<AppSnapshot> {
  return readSnapshot();
}

export async function replaceSnapshot(snapshot: AppSnapshot) {
  await writeSnapshot(snapshot);
}

export async function upsertOwner(owner: Owner) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, owner });
}

export async function upsertPet(pet: Omit<Pet, "id" | "createdAt"> & Partial<Pick<Pet, "id" | "createdAt">>) {
  const snapshot = await readSnapshot();
  const value: Pet = { ...pet, id: pet.id ?? createId("pet"), createdAt: pet.createdAt ?? todayIso() };
  await writeSnapshot({ ...snapshot, pets: [...snapshot.pets.filter((item) => item.id !== value.id), value] });
}

export async function deletePet(id: string) {
  const snapshot = await readSnapshot();
  await writeSnapshot({
    ...snapshot,
    pets: snapshot.pets.filter((item) => item.id !== id),
    records: snapshot.records.filter((item) => item.petId !== id),
    reminders: snapshot.reminders.filter((item) => item.petId !== id),
    consultations: snapshot.consultations.filter((item) => item.petId !== id),
  });
}

export async function upsertVet(vet: Omit<Veterinarian, "id" | "createdAt"> & Partial<Pick<Veterinarian, "id" | "createdAt">>) {
  const snapshot = await readSnapshot();
  const value: Veterinarian = { ...vet, id: vet.id ?? createId("vet"), createdAt: vet.createdAt ?? todayIso() };
  await writeSnapshot({ ...snapshot, veterinarians: [...snapshot.veterinarians.filter((item) => item.id !== value.id), value] });
}

export async function deleteVet(id: string) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, veterinarians: snapshot.veterinarians.filter((item) => item.id !== id) });
}

function reminderTypeFromRecord(type: HealthRecord["type"]): Reminder["type"] {
  if (type === "Checkup") return "Appointment";
  if (type === "Surgery" || type === "Allergy" || type === "Lab Test" || type === "Other") return "Custom";
  return type;
}

export async function upsertRecord(record: Omit<HealthRecord, "id" | "createdAt"> & Partial<Pick<HealthRecord, "id" | "createdAt">>) {
  const snapshot = await readSnapshot();
  const value: HealthRecord = { ...record, id: record.id ?? createId("record"), createdAt: record.createdAt ?? todayIso() };
  let reminders = snapshot.reminders;
  let linkedReminder: Reminder | null = null;
  if (value.nextScheduleDate) {
    const existing = reminders.find((item) => item.linkedRecordId === value.id);
    linkedReminder = existing
      ? { ...existing, petId: value.petId, type: reminderTypeFromRecord(value.type), title: value.type, dueDate: value.nextScheduleDate }
      : {
          id: createId("reminder"),
          petId: value.petId,
          type: reminderTypeFromRecord(value.type),
          title: value.type,
          dueDate: value.nextScheduleDate,
          linkedRecordId: value.id,
          notes: "Auto-created from health record next schedule.",
          createdAt: todayIso(),
        };
    const reminderToSave = linkedReminder;
    reminders = [...reminders.filter((item) => item.id !== reminderToSave.id), reminderToSave];
  } else {
    reminders = reminders.filter((item) => item.linkedRecordId !== value.id);
  }
  await writeSnapshot({ ...snapshot, records: [...snapshot.records.filter((item) => item.id !== value.id), value], reminders });
  return { record: value, linkedReminder };
}

export async function deleteRecord(id: string) {
  const snapshot = await readSnapshot();
  await writeSnapshot({
    ...snapshot,
    records: snapshot.records.filter((item) => item.id !== id),
    reminders: snapshot.reminders.filter((item) => item.linkedRecordId !== id),
  });
}

export async function upsertReminder(reminder: Omit<Reminder, "id" | "createdAt"> & Partial<Pick<Reminder, "id" | "createdAt">>) {
  const snapshot = await readSnapshot();
  const value: Reminder = { ...reminder, id: reminder.id ?? createId("reminder"), createdAt: reminder.createdAt ?? todayIso() };
  await writeSnapshot({ ...snapshot, reminders: [...snapshot.reminders.filter((item) => item.id !== value.id), value] });
}

export async function deleteReminder(id: string) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, reminders: snapshot.reminders.filter((item) => item.id !== id) });
}

export async function upsertConsultation(consultation: Consultation) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, consultations: [consultation, ...snapshot.consultations.filter((item) => item.id !== consultation.id)] });
}

export async function upsertSettings(settings: Settings) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, settings });
}

export async function upsertCreditState(creditState: AiCreditState) {
  const snapshot = await readSnapshot();
  await writeSnapshot({ ...snapshot, creditState });
}
