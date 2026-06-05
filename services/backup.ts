import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { AppSnapshot } from "@/types/domain";
import { todayIso } from "@/utils/date";

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

export async function exportBackup(snapshot: AppSnapshot) {
  const uri = `${FileSystem.documentDirectory}petnexa-ai-backup-${todayIso()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(snapshot, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json" });
  return uri;
}

export async function pickBackupFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled) return null;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = JSON.parse(content);
  if (!validateSnapshot(parsed)) throw new Error("Selected file is not a valid PetNexa AI backup.");
  return parsed;
}
