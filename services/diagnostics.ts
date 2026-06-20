import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { todayIso } from "@/utils/date";

const DIAGNOSTIC_EVENTS_KEY = "petnexa_diagnostic_events";
const MAX_EVENTS = 80;

export type DiagnosticEvent = {
  id: string;
  type: "app_error" | "sync_error" | "backup_error" | "restore_error" | "manual_note";
  message: string;
  createdAt: string;
  details?: string;
};

function sanitize(value: string, maxLength = 240) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function eventId() {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getDiagnosticEvents(): Promise<DiagnosticEvent[]> {
  const raw = await AsyncStorage.getItem(DIAGNOSTIC_EVENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as DiagnosticEvent[] : [];
  } catch {
    return [];
  }
}

export async function recordDiagnosticEvent(
  event: Omit<DiagnosticEvent, "id" | "createdAt">,
  enabled?: boolean,
) {
  if (!enabled) return;
  const current = await getDiagnosticEvents();
  const next: DiagnosticEvent = {
    id: eventId(),
    type: event.type,
    message: sanitize(event.message),
    details: event.details ? sanitize(event.details, 500) : undefined,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(DIAGNOSTIC_EVENTS_KEY, JSON.stringify([next, ...current].slice(0, MAX_EVENTS)));
}

export async function clearDiagnosticEvents() {
  await AsyncStorage.removeItem(DIAGNOSTIC_EVENTS_KEY);
}

export async function exportDiagnosticEvents() {
  const events = await getDiagnosticEvents();
  const uri = `${FileSystem.documentDirectory}petnexa-ai-diagnostics-${todayIso()}.json`;
  await FileSystem.writeAsStringAsync(
    uri,
    JSON.stringify({ format: "petnexa-ai-local-diagnostics", exportedAt: new Date().toISOString(), events }, null, 2),
  );
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json" });
  return uri;
}
