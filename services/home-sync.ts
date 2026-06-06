import { AppSnapshot, HealthRecord, Pet, Reminder, Settings, SyncMetadata, Veterinarian } from "@/types/domain";
import { supabase } from "@/utils/supabase";

const ASSET_BUCKET = "petnexa-home-assets";

type HomeResult = {
  homeId: string;
  homeName?: string;
  inviteCode?: string;
};

type CloudRow<T> = {
  home_id: string;
  id: string;
  data: T;
  created_at?: string;
  updated_at: string;
  deleted_at?: string | null;
};

type LocalSyncRow = { id: string; createdAt?: string } & SyncMetadata;

const tables = {
  pets: "home_pets",
  veterinarians: "home_veterinarians",
  records: "home_health_records",
  reminders: "home_reminders",
} as const;

type SyncKind = keyof typeof tables;

function nowIso() {
  return new Date().toISOString();
}

function isRemoteUri(uri?: string) {
  return !uri || uri.startsWith("http://") || uri.startsWith("https://");
}

function markSynced<T extends LocalSyncRow>(item: T, homeId: string, userId?: string): T {
  const updatedAt = item.updatedAt ?? item.createdAt ?? nowIso();
  return {
    ...item,
    homeId,
    updatedAt,
    createdBy: item.createdBy ?? userId,
    updatedBy: userId,
    syncStatus: "synced",
  };
}

function newestById<T extends LocalSyncRow>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const current = map.get(item.id);
    if (!current || Date.parse(item.updatedAt ?? "0") >= Date.parse(current.updatedAt ?? current.createdAt ?? "0")) {
      if (!item.deletedAt) map.set(item.id, item);
      else map.delete(item.id);
    }
  }
  return Array.from(map.values()).filter((item) => !item.deletedAt);
}

async function uploadAsset(homeId: string, kind: "pets" | "records", id: string, uri?: string, existingPath?: string) {
  if (isRemoteUri(uri)) return { uri, path: existingPath };
  try {
    if (!uri) return { uri, path: existingPath };
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = existingPath ?? `${homeId}/${kind}/${id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
    if (error) throw error;
    const { data } = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    return { uri: data?.signedUrl ?? uri, path };
  } catch {
    return { uri, path: existingPath };
  }
}

async function refreshAssetUrl(path?: string) {
  if (!path) return undefined;
  const { data } = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl;
}

async function preparePets(pets: Pet[], homeId: string, userId?: string) {
  const prepared: Pet[] = [];
  for (const pet of pets) {
    const asset = await uploadAsset(homeId, "pets", pet.id, pet.photoUri, pet.photoStoragePath);
    prepared.push(markSynced({ ...pet, photoUri: asset.uri, photoStoragePath: asset.path }, homeId, userId));
  }
  return prepared;
}

async function prepareRecords(records: HealthRecord[], homeId: string, userId?: string) {
  const prepared: HealthRecord[] = [];
  for (const record of records) {
    const asset = await uploadAsset(homeId, "records", record.id, record.attachmentUri, record.attachmentStoragePath);
    prepared.push(markSynced({ ...record, attachmentUri: asset.uri, attachmentStoragePath: asset.path }, homeId, userId));
  }
  return prepared;
}

async function upsertRows<T extends LocalSyncRow>(table: string, homeId: string, rows: T[], userId?: string) {
  if (!rows.length) return;
  const payload = rows.map((row) => ({
    home_id: homeId,
    id: row.id,
    data: { ...row, syncStatus: "synced", homeId },
    created_by: row.createdBy ?? userId,
    updated_by: userId,
    updated_at: row.updatedAt ?? nowIso(),
    deleted_at: row.deletedAt ?? null,
  }));
  const { error } = await supabase.from(table).upsert(payload, { onConflict: "home_id,id" });
  if (error) throw error;
}

async function fetchRows<T extends LocalSyncRow>(table: string, homeId: string) {
  const { data, error } = await supabase
    .from(table)
    .select("home_id,id,data,created_at,updated_at,deleted_at")
    .eq("home_id", homeId)
    .order("updated_at", { ascending: true });
  if (error) throw error;
  return Promise.all((data as CloudRow<T>[]).map(async (row) => {
    const item = {
      ...row.data,
      id: row.id,
      homeId: row.home_id,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
      syncStatus: "synced" as const,
    };
    if ("photoStoragePath" in item) {
      const petItem = item as unknown as Pet;
      const signed = await refreshAssetUrl(petItem.photoStoragePath);
      if (signed) petItem.photoUri = signed;
    }
    if ("attachmentStoragePath" in item) {
      const recordItem = item as unknown as HealthRecord;
      const signed = await refreshAssetUrl(recordItem.attachmentStoragePath);
      if (signed) recordItem.attachmentUri = signed;
    }
    return item as T;
  }));
}

export async function signInWithEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
  if (error) throw error;
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

export async function createHome(name: string, displayName: string): Promise<HomeResult> {
  const { data, error } = await supabase.rpc("create_home_with_member", {
    home_name: name,
    member_display_name: displayName,
  });
  if (error) throw error;
  return { homeId: data.homeId, inviteCode: data.inviteCode, homeName: name };
}

export async function joinHome(inviteCode: string, displayName: string): Promise<HomeResult> {
  const { data, error } = await supabase.rpc("join_home_by_invite", {
    invite_code: inviteCode.trim().toUpperCase(),
    member_display_name: displayName,
  });
  if (error) throw error;
  return { homeId: data.homeId, homeName: data.homeName };
}

export async function pushPendingChanges(snapshot: AppSnapshot) {
  const homeId = snapshot.settings.homeId;
  if (!homeId || snapshot.settings.careMode !== "home" || !snapshot.settings.syncEnabled) return snapshot;
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in required for Home sync.");

  const pets = await preparePets(snapshot.pets, homeId, userId);
  const records = await prepareRecords(snapshot.records, homeId, userId);
  const veterinarians = snapshot.veterinarians.map((item) => markSynced(item, homeId, userId));
  const reminders = snapshot.reminders.map((item) => markSynced(item, homeId, userId));

  await upsertRows(tables.pets, homeId, pets, userId);
  await upsertRows(tables.veterinarians, homeId, veterinarians, userId);
  await upsertRows(tables.records, homeId, records, userId);
  await upsertRows(tables.reminders, homeId, reminders, userId);

  return {
    ...snapshot,
    pets,
    veterinarians,
    records,
    reminders,
  };
}

export async function pullHomeSnapshot(snapshot: AppSnapshot) {
  const homeId = snapshot.settings.homeId;
  if (!homeId || snapshot.settings.careMode !== "home" || !snapshot.settings.syncEnabled) return snapshot;
  const [pets, veterinarians, records, reminders] = await Promise.all([
    fetchRows<Pet>(tables.pets, homeId),
    fetchRows<Veterinarian>(tables.veterinarians, homeId),
    fetchRows<HealthRecord>(tables.records, homeId),
    fetchRows<Reminder>(tables.reminders, homeId),
  ]);
  return {
    ...snapshot,
    pets: newestById(snapshot.pets, pets),
    veterinarians: newestById(snapshot.veterinarians, veterinarians),
    records: newestById(snapshot.records, records),
    reminders: newestById(snapshot.reminders, reminders),
    settings: { ...snapshot.settings, lastSyncAt: nowIso() } satisfies Settings,
  };
}

export async function syncNow(snapshot: AppSnapshot) {
  const pushed = await pushPendingChanges(snapshot);
  return pullHomeSnapshot(pushed);
}

export async function softDeleteCloudEntity(kind: SyncKind, homeId: string | undefined, id: string) {
  if (!homeId) return;
  const userId = await getCurrentUserId();
  if (!userId) return;
  const deletedAt = nowIso();
  await supabase
    .from(tables[kind])
    .update({
      updated_by: userId,
      updated_at: deletedAt,
      deleted_at: deletedAt,
      data: { id, homeId, deletedAt, updatedAt: deletedAt, syncStatus: "synced" },
    })
    .eq("home_id", homeId)
    .eq("id", id);
}
