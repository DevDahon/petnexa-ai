import * as SQLite from "expo-sqlite";
import { AppSnapshot, HealthRecord, Owner, Pet, Reminder, Settings, Veterinarian, Consultation, AiCreditState } from "@/types/domain";
import { sampleData } from "@/data/sample";
import { createId, todayIso } from "@/utils/date";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("petnexa.db");
  return dbPromise;
}

async function run(sql: string, params: SQLite.SQLiteBindParams = []) {
  return (await db()).runAsync(sql, params);
}

async function all<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  return (await db()).getAllAsync<T>(sql, params);
}

async function first<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  return (await db()).getFirstAsync<T>(sql, params);
}

function normalizeSettings(value: Partial<Settings> | null | undefined): Settings {
  return {
    notificationsEnabled: value?.notificationsEnabled ?? sampleData.settings.notificationsEnabled,
    dailySummaryTime: value?.dailySummaryTime ?? sampleData.settings.dailySummaryTime,
    careMode: value?.careMode ?? sampleData.settings.careMode,
    homeId: value?.homeId,
    homeName: value?.homeName,
    homeInviteCode: value?.homeInviteCode,
    syncEnabled: value?.syncEnabled ?? sampleData.settings.syncEnabled,
    lastSyncAt: value?.lastSyncAt,
    lastSyncAttemptAt: value?.lastSyncAttemptAt,
    lastSyncError: value?.lastSyncError,
    privacyAcknowledgedAt: value?.privacyAcknowledgedAt,
    aiDisclaimerAcceptedAt: value?.aiDisclaimerAcceptedAt,
    analyticsEnabled: value?.analyticsEnabled ?? sampleData.settings.analyticsEnabled,
    diagnosticsEnabled: value?.diagnosticsEnabled ?? sampleData.settings.diagnosticsEnabled,
    adsPersonalizationConsent: value?.adsPersonalizationConsent ?? sampleData.settings.adsPersonalizationConsent,
  };
}

function normalizeOwner(value: Partial<Owner> | null | undefined): Owner {
  return {
    id: value?.id ?? sampleData.owner.id,
    fullName: value?.fullName ?? sampleData.owner.fullName,
    birthday: value?.birthday ?? sampleData.owner.birthday,
  };
}

export async function initDatabase() {
  const database = await db();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS owners (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pets (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS veterinarians (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS health_records (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS consultations (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_credit_state (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
  `);
  const seeded = await first<{ value: string }>("SELECT value FROM meta WHERE key = ?", ["seeded"]);
  if (!seeded) {
    await replaceSnapshot(sampleData);
    await run("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", ["seeded", "true"]);
  }
}

export async function getSnapshot(): Promise<AppSnapshot> {
  const ownerRow = await first<{ data: string }>("SELECT data FROM owners LIMIT 1");
  const settingsRow = await first<{ data: string }>("SELECT data FROM settings WHERE id = ?", ["settings"]);
  const creditRow = await first<{ data: string }>("SELECT data FROM ai_credit_state WHERE id = ?", ["credits"]);
  const parsedSettings = settingsRow ? JSON.parse(settingsRow.data) as Partial<Settings> : null;
  return {
    owner: normalizeOwner(ownerRow ? JSON.parse(ownerRow.data) : sampleData.owner),
    pets: (await all<{ data: string }>("SELECT data FROM pets")).map((row) => JSON.parse(row.data)),
    veterinarians: (await all<{ data: string }>("SELECT data FROM veterinarians")).map((row) => JSON.parse(row.data)),
    records: (await all<{ data: string }>("SELECT data FROM health_records")).map((row) => JSON.parse(row.data)),
    reminders: (await all<{ data: string }>("SELECT data FROM reminders")).map((row) => JSON.parse(row.data)),
    consultations: (await all<{ data: string }>("SELECT data FROM consultations")).map((row) => JSON.parse(row.data)),
    creditState: creditRow ? JSON.parse(creditRow.data) : sampleData.creditState,
    settings: normalizeSettings(parsedSettings),
  };
}

export async function replaceSnapshot(snapshot: AppSnapshot) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    for (const table of ["owners", "pets", "veterinarians", "health_records", "reminders", "consultations", "settings", "ai_credit_state"]) {
      await database.runAsync(`DELETE FROM ${table}`);
    }
    const owner = normalizeOwner(snapshot.owner);
    await database.runAsync("INSERT INTO owners (id, data) VALUES (?, ?)", [owner.id, JSON.stringify(owner)]);
    await database.runAsync("INSERT INTO settings (id, data) VALUES (?, ?)", ["settings", JSON.stringify(normalizeSettings(snapshot.settings))]);
    await database.runAsync("INSERT INTO ai_credit_state (id, data) VALUES (?, ?)", ["credits", JSON.stringify(snapshot.creditState)]);
    for (const pet of snapshot.pets) await database.runAsync("INSERT INTO pets (id, data) VALUES (?, ?)", [pet.id, JSON.stringify(pet)]);
    for (const vet of snapshot.veterinarians) await database.runAsync("INSERT INTO veterinarians (id, data) VALUES (?, ?)", [vet.id, JSON.stringify(vet)]);
    for (const record of snapshot.records) await database.runAsync("INSERT INTO health_records (id, data) VALUES (?, ?)", [record.id, JSON.stringify(record)]);
    for (const reminder of snapshot.reminders) await database.runAsync("INSERT INTO reminders (id, data) VALUES (?, ?)", [reminder.id, JSON.stringify(reminder)]);
    for (const consultation of snapshot.consultations) await database.runAsync("INSERT INTO consultations (id, data) VALUES (?, ?)", [consultation.id, JSON.stringify(consultation)]);
  });
}

export async function upsertOwner(owner: Owner) {
  const value = normalizeOwner(owner);
  await run("INSERT OR REPLACE INTO owners (id, data) VALUES (?, ?)", [value.id, JSON.stringify(value)]);
}

export async function upsertPet(pet: Omit<Pet, "id" | "createdAt"> & Partial<Pick<Pet, "id" | "createdAt">>) {
  const value: Pet = { ...pet, id: pet.id ?? createId("pet"), createdAt: pet.createdAt ?? todayIso() };
  await run("INSERT OR REPLACE INTO pets (id, data) VALUES (?, ?)", [value.id, JSON.stringify(value)]);
}

export async function deletePet(id: string) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM pets WHERE id = ?", [id]);
    await database.runAsync("DELETE FROM health_records WHERE json_extract(data, '$.petId') = ?", [id]);
    await database.runAsync("DELETE FROM reminders WHERE json_extract(data, '$.petId') = ?", [id]);
    await database.runAsync("DELETE FROM consultations WHERE json_extract(data, '$.petId') = ?", [id]);
  });
}

export async function upsertVet(vet: Omit<Veterinarian, "id" | "createdAt"> & Partial<Pick<Veterinarian, "id" | "createdAt">>) {
  const value: Veterinarian = { ...vet, id: vet.id ?? createId("vet"), createdAt: vet.createdAt ?? todayIso() };
  await run("INSERT OR REPLACE INTO veterinarians (id, data) VALUES (?, ?)", [value.id, JSON.stringify(value)]);
}

export async function deleteVet(id: string) {
  await run("DELETE FROM veterinarians WHERE id = ?", [id]);
}

function reminderTypeFromRecord(type: HealthRecord["type"]): Reminder["type"] {
  if (type === "Checkup") return "Appointment";
  if (type === "Surgery" || type === "Allergy" || type === "Lab Test" || type === "Other") return "Custom";
  return type;
}

export async function upsertRecord(record: Omit<HealthRecord, "id" | "createdAt"> & Partial<Pick<HealthRecord, "id" | "createdAt">>) {
  const value: HealthRecord = { ...record, id: record.id ?? createId("record"), createdAt: record.createdAt ?? todayIso() };
  const database = await db();
  let linkedReminder: Reminder | null = null;
  await database.withTransactionAsync(async () => {
    await database.runAsync("INSERT OR REPLACE INTO health_records (id, data) VALUES (?, ?)", [value.id, JSON.stringify(value)]);
    if (value.nextScheduleDate) {
      const linked = await database.getFirstAsync<{ data: string }>("SELECT data FROM reminders WHERE json_extract(data, '$.linkedRecordId') = ?", [value.id]);
      const reminder: Reminder = linked
        ? { ...JSON.parse(linked.data), petId: value.petId, type: reminderTypeFromRecord(value.type), title: value.type, dueDate: value.nextScheduleDate }
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
      linkedReminder = reminder;
      await database.runAsync("INSERT OR REPLACE INTO reminders (id, data) VALUES (?, ?)", [reminder.id, JSON.stringify(reminder)]);
    } else {
      await database.runAsync("DELETE FROM reminders WHERE json_extract(data, '$.linkedRecordId') = ?", [value.id]);
    }
  });
  return { record: value, linkedReminder };
}

export async function deleteRecord(id: string) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM health_records WHERE id = ?", [id]);
    await database.runAsync("DELETE FROM reminders WHERE json_extract(data, '$.linkedRecordId') = ?", [id]);
  });
}

export async function upsertReminder(reminder: Omit<Reminder, "id" | "createdAt"> & Partial<Pick<Reminder, "id" | "createdAt">>) {
  const value: Reminder = { ...reminder, id: reminder.id ?? createId("reminder"), createdAt: reminder.createdAt ?? todayIso() };
  await run("INSERT OR REPLACE INTO reminders (id, data) VALUES (?, ?)", [value.id, JSON.stringify(value)]);
}

export async function deleteReminder(id: string) {
  await run("DELETE FROM reminders WHERE id = ?", [id]);
}

export async function upsertConsultation(consultation: Consultation) {
  await run("INSERT OR REPLACE INTO consultations (id, data) VALUES (?, ?)", [consultation.id, JSON.stringify(consultation)]);
}

export async function upsertSettings(settings: Settings) {
  await run("INSERT OR REPLACE INTO settings (id, data) VALUES (?, ?)", ["settings", JSON.stringify(normalizeSettings(settings))]);
}

export async function upsertCreditState(creditState: AiCreditState) {
  await run("INSERT OR REPLACE INTO ai_credit_state (id, data) VALUES (?, ?)", ["credits", JSON.stringify(creditState)]);
}
