import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { AppSnapshot, HealthRecord, Pet } from "@/types/domain";
import { todayIso } from "@/utils/date";

type BackupMediaField = "photoUri" | "attachmentUri";

type BackupMedia = {
  entityType: "pet" | "record";
  entityId: string;
  field: BackupMediaField;
  originalUri: string;
  mimeType: string;
  data: string;
};

type PortableBackup = {
  format: "petnexa-ai-portable-backup";
  version: 2;
  exportedAt: string;
  snapshot: AppSnapshot;
  media: BackupMedia[];
};

export function validateSnapshot(value: unknown): value is AppSnapshot {
  const data = value as Partial<AppSnapshot>;
  return Boolean(
    data &&
      data.owner &&
      Array.isArray(data.pets) &&
      Array.isArray(data.veterinarians) &&
      Array.isArray(data.records) &&
      Array.isArray(data.reminders) &&
      Array.isArray(data.consultations) &&
      data.creditState &&
      data.settings,
  );
}

function validatePortableBackup(value: unknown): value is PortableBackup {
  const data = value as Partial<PortableBackup>;
  return Boolean(
    data &&
      data.format === "petnexa-ai-portable-backup" &&
      data.version === 2 &&
      validateSnapshot(data.snapshot) &&
      Array.isArray(data.media),
  );
}

function isReadableLocalUri(uri?: string): uri is string {
  return Boolean(uri && (uri.startsWith("file://") || uri.startsWith(FileSystem.documentDirectory ?? "")));
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  if (mimeType.includes("pdf")) return "pdf";
  return "jpg";
}

function inferMimeType(uri: string) {
  const value = uri.toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".webp")) return "image/webp";
  if (value.endsWith(".heic")) return "image/heic";
  if (value.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

async function readMediaItem(
  entityType: BackupMedia["entityType"],
  entityId: string,
  field: BackupMediaField,
  uri?: string,
): Promise<BackupMedia | null> {
  if (!isReadableLocalUri(uri)) return null;
  const mediaUri = uri;
  try {
    const info = await FileSystem.getInfoAsync(mediaUri);
    if (!info.exists) return null;
    const data = await FileSystem.readAsStringAsync(mediaUri, { encoding: FileSystem.EncodingType.Base64 });
    return {
      entityType,
      entityId,
      field,
      originalUri: mediaUri,
      mimeType: inferMimeType(mediaUri),
      data,
    };
  } catch {
    return null;
  }
}

async function collectMedia(snapshot: AppSnapshot) {
  const media: BackupMedia[] = [];
  for (const pet of snapshot.pets) {
    const item = await readMediaItem("pet", pet.id, "photoUri", pet.photoUri);
    if (item) media.push(item);
  }
  for (const record of snapshot.records) {
    const item = await readMediaItem("record", record.id, "attachmentUri", record.attachmentUri);
    if (item) media.push(item);
  }
  return media;
}

async function ensureMediaDirectory() {
  const directory = `${FileSystem.documentDirectory}petnexa-media/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function restoreMedia(snapshot: AppSnapshot, media: BackupMedia[]) {
  if (!media.length) return snapshot;
  const directory = await ensureMediaDirectory();
  const petsById = new Map(snapshot.pets.map((pet) => [pet.id, pet]));
  const recordsById = new Map(snapshot.records.map((record) => [record.id, record]));

  for (const item of media) {
    try {
      const uri = `${directory}${item.entityType}-${item.entityId}-${item.field}.${extensionFromMimeType(item.mimeType)}`;
      await FileSystem.writeAsStringAsync(uri, item.data, { encoding: FileSystem.EncodingType.Base64 });
      if (item.entityType === "pet" && item.field === "photoUri") {
        const pet = petsById.get(item.entityId);
        if (pet) petsById.set(item.entityId, { ...pet, photoUri: uri } satisfies Pet);
      }
      if (item.entityType === "record" && item.field === "attachmentUri") {
        const record = recordsById.get(item.entityId);
        if (record) recordsById.set(item.entityId, { ...record, attachmentUri: uri } satisfies HealthRecord);
      }
    } catch {
      // Keep restoring the rest of the backup even if one media file is unavailable.
    }
  }

  return {
    ...snapshot,
    pets: snapshot.pets.map((pet) => petsById.get(pet.id) ?? pet),
    records: snapshot.records.map((record) => recordsById.get(record.id) ?? record),
  };
}

export async function exportBackup(snapshot: AppSnapshot) {
  const uri = `${FileSystem.documentDirectory}petnexa-ai-backup-${todayIso()}.json`;
  const backup: PortableBackup = {
    format: "petnexa-ai-portable-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    snapshot,
    media: await collectMedia(snapshot),
  };
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json" });
  return uri;
}

export async function pickBackupFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled) return null;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = JSON.parse(content);
  if (validateSnapshot(parsed)) return parsed;
  if (validatePortableBackup(parsed)) return restoreMedia(parsed.snapshot, parsed.media);
  throw new Error("Selected file is not a valid PetNexa AI backup.");
}
