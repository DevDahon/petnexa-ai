import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import { AppSnapshot, Consultation, HealthRecord, Owner, Pet, Reminder, Settings, SyncMetadata, Veterinarian } from "@/types/domain";
import { initDatabase, getSnapshot, replaceSnapshot, upsertConsultation, upsertCreditState, upsertOwner, upsertPet, upsertRecord, upsertReminder, upsertSettings, upsertVet, deletePet, deleteRecord, deleteReminder, deleteVet } from "@/storage/database";
import { createId, currentWeekKey, todayIso } from "@/utils/date";
import { exportBackup, pickBackupFile } from "@/services/backup";
import { clearDiagnosticEvents, exportDiagnosticEvents, recordDiagnosticEvent } from "@/services/diagnostics";
import { cancelReminderNotification, scheduleReminderNotification, syncReminderNotifications } from "@/services/notifications";
import { createHome, deleteHome, handleAuthCallbackUrl, hasHomeAuthSession, joinHome, listUserHomes, signInWithEmailOtp, signInWithGoogle, signOutHome, softDeleteCloudEntity, syncNow, verifyOtp } from "@/services/home-sync";
import type { HomeAccount } from "@/services/home-sync";
import { showRewardedAd } from "@/services/rewarded-ads";
import { supabase } from "@/utils/supabase";

type AppContextValue = AppSnapshot & {
  ready: boolean;
  refresh: () => Promise<void>;
  saveOwner: (owner: Owner) => Promise<void>;
  savePet: (pet: Omit<Pet, "id" | "createdAt"> & Partial<Pick<Pet, "id" | "createdAt">>) => Promise<void>;
  removePet: (id: string) => Promise<void>;
  saveVet: (vet: Omit<Veterinarian, "id" | "createdAt"> & Partial<Pick<Veterinarian, "id" | "createdAt">>) => Promise<void>;
  removeVet: (id: string) => Promise<void>;
  saveRecord: (record: Omit<HealthRecord, "id" | "createdAt"> & Partial<Pick<HealthRecord, "id" | "createdAt">>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  saveReminder: (reminder: Omit<Reminder, "id" | "createdAt"> & Partial<Pick<Reminder, "id" | "createdAt">>) => Promise<void>;
  completeReminder: (reminder: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  saveConsultation: (consultation: Consultation) => Promise<void>;
  canUseAi: () => boolean;
  deductAiCredit: () => Promise<void>;
  watchRewardedAd: () => Promise<string>;
  updateSettings: (settings: Settings) => Promise<void>;
  chooseSoloMode: () => Promise<void>;
  sendHomeOtp: (email: string) => Promise<void>;
  verifyHomeOtp: (email: string, token: string) => Promise<void>;
  signInHomeWithGoogle: () => Promise<void>;
  hasHomeAuthSession: () => Promise<boolean>;
  listHomeAccounts: () => Promise<HomeAccount[]>;
  selectHomeAccount: (home: HomeAccount) => Promise<void>;
  deleteHomeAccount: (home: HomeAccount) => Promise<void>;
  createHomeAccount: (name: string) => Promise<string>;
  joinHomeAccount: (inviteCode: string) => Promise<void>;
  logoutHomeAccount: () => Promise<void>;
  syncHomeNow: () => Promise<void>;
  exportData: () => Promise<string>;
  restoreDataReplaceMode: () => Promise<void>;
  exportDiagnostics: () => Promise<string>;
  clearDiagnostics: () => Promise<void>;
  resetLocalData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function createEmptySnapshot(settings?: Partial<Settings>): AppSnapshot {
  return {
    owner: { id: "owner_1", fullName: "", birthday: "" },
    pets: [],
    veterinarians: [],
    records: [],
    reminders: [],
    consultations: [],
    creditState: { aiCredits: 3, starterCreditsGranted: true, weeklyAdWatchCount: 0, lastWeeklyResetDate: todayIso(), totalConsultationsUsed: 0 },
    settings: {
      notificationsEnabled: settings?.notificationsEnabled ?? true,
      dailySummaryTime: settings?.dailySummaryTime ?? "08:00",
      careMode: null,
      syncEnabled: false,
      privacyAcknowledgedAt: settings?.privacyAcknowledgedAt,
      aiDisclaimerAcceptedAt: settings?.aiDisclaimerAcceptedAt,
      analyticsEnabled: settings?.analyticsEnabled ?? false,
      diagnosticsEnabled: settings?.diagnosticsEnabled ?? false,
      adsPersonalizationConsent: settings?.adsPersonalizationConsent ?? false,
    },
  };
}

const emptySnapshot: AppSnapshot = createEmptySnapshot();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function getInstallationId() {
  const key = "petnexa_installation_id";
  if (process.env.EXPO_OS === "web") {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
    const next = createId("install");
    await AsyncStorage.setItem(key, next);
    return next;
  }

  const value = await SecureStore.getItemAsync(key);
  if (value) return value;
  const next = createId("install");
  await SecureStore.setItemAsync(key, next);
  return next;
}

async function getInitialAuthUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.href;
  return Linking.getInitialURL();
}

export function AppProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [authSessionVersion, setAuthSessionVersion] = useState(0);

  const refresh = useCallback(async () => {
    setSnapshot(await getSnapshot());
  }, []);

  const syncIfEnabled = useCallback(async (base?: AppSnapshot) => {
    const current = base ?? await getSnapshot();
    if (current.settings.careMode !== "home" || !current.settings.syncEnabled || !current.settings.homeId) return current;
    const lastSyncAttemptAt = new Date().toISOString();
    try {
      const synced = await syncNow({
        ...current,
        settings: { ...current.settings, lastSyncAttemptAt, lastSyncError: undefined },
      });
      const next = {
        ...synced,
        settings: { ...synced.settings, lastSyncAttemptAt, lastSyncError: undefined },
      };
      await replaceSnapshot(next);
      setSnapshot(next);
      return next;
    } catch (error) {
      const nextSettings = {
        ...current.settings,
        lastSyncAttemptAt,
        lastSyncError: errorMessage(error),
      };
      await upsertSettings(nextSettings);
      setSnapshot((value) => ({ ...value, settings: nextSettings }));
      await recordDiagnosticEvent(
        { type: "sync_error", message: "Home sync failed", details: errorMessage(error) },
        current.settings.diagnosticsEnabled,
      );
      throw error;
    }
  }, []);

  const markPending = useCallback(<T extends SyncMetadata>(value: T): T => {
    if (snapshot.settings.careMode !== "home" || !snapshot.settings.homeId) return value;
    return {
      ...value,
      homeId: snapshot.settings.homeId,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    };
  }, [snapshot.settings.careMode, snapshot.settings.homeId]);

  const processAuthCallback = useCallback(async (url?: string | null) => {
    const handled = await handleAuthCallbackUrl(url).catch(() => false);
    if (handled) setAuthSessionVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    async function boot() {
      await processAuthCallback(await getInitialAuthUrl());
      await initDatabase();
      await getInstallationId();
      await AsyncStorage.setItem("petnexa_last_opened", new Date().toISOString());
      const current = await getSnapshot();
      setSnapshot(current);
      if (current.settings.notificationsEnabled) await syncReminderNotifications(current.reminders);
      try {
        await syncIfEnabled(current);
      } catch (error) {
        await recordDiagnosticEvent(
          { type: "sync_error", message: "Startup sync failed", details: errorMessage(error) },
          current.settings.diagnosticsEnabled,
        );
        // Home sync should never block local app startup.
      }
      setReady(true);
    }
    boot();
  }, [processAuthCallback, syncIfEnabled]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      setAuthSessionVersion((value) => value + 1);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      processAuthCallback(url).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [processAuthCallback]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncIfEnabled().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [syncIfEnabled]);

  const value = useMemo<AppContextValue>(() => ({
    ...snapshot,
    ready,
    refresh,
    saveOwner: async (owner) => {
      await upsertOwner(owner);
      await refresh();
    },
    savePet: async (pet) => {
      await upsertPet(markPending(pet));
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    removePet: async (id) => {
      if (snapshot.settings.careMode === "home") {
        await softDeleteCloudEntity("pets", snapshot.settings.homeId, id).catch(() => undefined);
        await Promise.all(snapshot.records.filter((item) => item.petId === id).map((item) => softDeleteCloudEntity("records", snapshot.settings.homeId, item.id))).catch(() => undefined);
        await Promise.all(snapshot.reminders.filter((item) => item.petId === id).map((item) => softDeleteCloudEntity("reminders", snapshot.settings.homeId, item.id))).catch(() => undefined);
      }
      await deletePet(id);
      await refresh();
    },
    saveVet: async (vet) => {
      await upsertVet(markPending(vet));
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    removeVet: async (id) => {
      if (snapshot.settings.careMode === "home") await softDeleteCloudEntity("veterinarians", snapshot.settings.homeId, id).catch(() => undefined);
      await deleteVet(id);
      await refresh();
    },
    saveRecord: async (record) => {
      const recordId = record.id;
      const previousLinkedReminders = recordId ? snapshot.reminders.filter((item) => item.linkedRecordId === recordId) : [];
      const result = await upsertRecord(markPending(record));
      if (snapshot.settings.notificationsEnabled && result?.linkedReminder) await scheduleReminderNotification(result.linkedReminder);
      if (snapshot.settings.notificationsEnabled && !result?.linkedReminder) {
        await Promise.all(previousLinkedReminders.map((item) => cancelReminderNotification(item.id)));
      }
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    removeRecord: async (id) => {
      const linkedReminders = snapshot.reminders.filter((item) => item.linkedRecordId === id);
      if (snapshot.settings.careMode === "home") {
        await softDeleteCloudEntity("records", snapshot.settings.homeId, id).catch(() => undefined);
        await Promise.all(snapshot.reminders.filter((item) => item.linkedRecordId === id).map((item) => softDeleteCloudEntity("reminders", snapshot.settings.homeId, item.id))).catch(() => undefined);
      }
      await deleteRecord(id);
      if (snapshot.settings.notificationsEnabled) await Promise.all(linkedReminders.map((item) => cancelReminderNotification(item.id)));
      await refresh();
    },
    saveReminder: async (reminder) => {
      const saved = markPending({ ...reminder, id: reminder.id ?? createId("reminder"), createdAt: reminder.createdAt ?? todayIso() });
      await upsertReminder(saved);
      if (snapshot.settings.notificationsEnabled) await scheduleReminderNotification(saved);
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    completeReminder: async (reminder) => {
      await upsertReminder(markPending({ ...reminder, completedAt: new Date().toISOString() }));
      if (snapshot.settings.notificationsEnabled) await cancelReminderNotification(reminder.id);
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    removeReminder: async (id) => {
      if (snapshot.settings.careMode === "home") await softDeleteCloudEntity("reminders", snapshot.settings.homeId, id).catch(() => undefined);
      await deleteReminder(id);
      if (snapshot.settings.notificationsEnabled) await cancelReminderNotification(id);
      await refresh();
    },
    saveConsultation: async (consultation) => {
      await upsertConsultation(consultation);
      await refresh();
    },
    canUseAi: () => snapshot.creditState.aiCredits > 0,
    deductAiCredit: async () => {
      if (snapshot.creditState.aiCredits <= 0) throw new Error("No AI credits available.");
      await upsertCreditState({
        ...snapshot.creditState,
        aiCredits: Math.max(0, snapshot.creditState.aiCredits - 1),
        totalConsultationsUsed: snapshot.creditState.totalConsultationsUsed + 1,
      });
      await refresh();
    },
    watchRewardedAd: async () => {
      const week = currentWeekKey();
      const state = snapshot.creditState.lastWeeklyResetDate === week
        ? snapshot.creditState
        : { ...snapshot.creditState, weeklyAdWatchCount: 0, lastWeeklyResetDate: week, lastWeeklyCreditClaimDate: undefined };
      if (state.weeklyAdWatchCount >= 5) return "Weekly ad watch limit reached.";

      const adResult = await showRewardedAd();
      if (!adResult.earned) return adResult.message;

      const next = { ...state, weeklyAdWatchCount: state.weeklyAdWatchCount + 1 };
      if (next.lastWeeklyCreditClaimDate === week) {
        await upsertCreditState(next);
        await refresh();
        return "Ad watched. Weekly AI credit was already claimed.";
      }
      if (next.aiCredits >= 3) {
        await upsertCreditState(next);
        await refresh();
        return "Ad watched. Credits are already full.";
      }
      await upsertCreditState({ ...next, aiCredits: Math.min(3, next.aiCredits + 1), lastWeeklyCreditClaimDate: week });
      await refresh();
      return "Ad watched. 1 weekly AI credit added.";
    },
    updateSettings: async (settings) => {
      await upsertSettings(settings);
      await syncReminderNotifications(settings.notificationsEnabled ? snapshot.reminders : []);
      await refresh();
    },
    chooseSoloMode: async () => {
      await upsertSettings({ ...snapshot.settings, careMode: "solo", syncEnabled: false });
      await refresh();
    },
    sendHomeOtp: async (email) => signInWithEmailOtp(email),
    verifyHomeOtp: async (email, token) => verifyOtp(email, token),
    signInHomeWithGoogle: async () => signInWithGoogle(),
    hasHomeAuthSession: async () => hasHomeAuthSession(),
    listHomeAccounts: async () => listUserHomes(),
    deleteHomeAccount: async (home) => {
      await deleteHome(home.homeId);
      const current = await getSnapshot();
      if (current.settings.homeId !== home.homeId) return;
      const next: AppSnapshot = {
        ...current,
        settings: {
          ...current.settings,
          careMode: null,
          syncEnabled: false,
          homeId: undefined,
          homeName: undefined,
          homeInviteCode: undefined,
          lastSyncAt: undefined,
        },
      };
      await replaceSnapshot(next);
      setSnapshot(next);
      await refresh();
    },
    selectHomeAccount: async (home) => {
      const current = await getSnapshot();
      const emptyHomeSnapshot: AppSnapshot = {
        ...current,
        pets: [],
        veterinarians: [],
        records: [],
        reminders: [],
        settings: {
          ...current.settings,
          careMode: "home",
          syncEnabled: true,
          homeId: home.homeId,
          homeName: home.homeName,
          homeInviteCode: home.inviteCode,
        },
      };
      const synced = await syncNow(emptyHomeSnapshot);
      await replaceSnapshot(synced);
      setSnapshot(synced);
      await refresh();
    },
    createHomeAccount: async (name) => {
      const current = await getSnapshot();
      const safeHomeName = name || `${current.owner.fullName.split(" ")[0] || "PetNexa"} Home`;
      const home = await createHome(safeHomeName, current.owner.fullName);
      const nextSettings = { ...current.settings, careMode: "home" as const, syncEnabled: true, homeId: home.homeId, homeName: home.homeName ?? safeHomeName, homeInviteCode: home.inviteCode };
      const next: AppSnapshot = {
        ...current,
        settings: nextSettings,
      };
      await replaceSnapshot(next);
      setSnapshot(next);
      await refresh();
      await syncIfEnabled(next).catch(() => undefined);
      return nextSettings.homeName ?? safeHomeName;
    },
    joinHomeAccount: async (inviteCode) => {
      const home = await joinHome(inviteCode, snapshot.owner.fullName);
      const current = await getSnapshot();
      const emptyHomeSnapshot: AppSnapshot = {
        ...current,
        pets: [],
        veterinarians: [],
        records: [],
        reminders: [],
        settings: { ...current.settings, careMode: "home", syncEnabled: true, homeId: home.homeId, homeName: home.homeName },
      };
      const synced = await syncNow(emptyHomeSnapshot);
      await replaceSnapshot(synced);
      setSnapshot(synced);
    },
    logoutHomeAccount: async () => {
      await signOutHome().catch(() => undefined);
      const current = await getSnapshot();
      const next: AppSnapshot = {
        ...current,
        settings: {
          ...current.settings,
          careMode: null,
          syncEnabled: false,
          homeId: undefined,
          homeName: undefined,
          homeInviteCode: undefined,
          lastSyncAt: undefined,
        },
      };
      await replaceSnapshot(next);
      setSnapshot(next);
      await refresh();
    },
    syncHomeNow: async () => {
      const synced = await syncIfEnabled();
      await replaceSnapshot(synced);
      setSnapshot(synced);
    },
    exportData: async () => exportBackup(await getSnapshot()),
    restoreDataReplaceMode: async () => {
      let backup: AppSnapshot | null = null;
      try {
        backup = await pickBackupFile();
      } catch (error) {
        await recordDiagnosticEvent(
          { type: "restore_error", message: "Backup import failed", details: errorMessage(error) },
          snapshot.settings.diagnosticsEnabled,
        );
        throw error;
      }
      if (!backup) return;
      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          "Replace local data?",
          "Importing this backup will replace all existing local PetNexa AI data on this device.",
          [
            { text: "Cancel", style: "cancel", onPress: () => reject(new Error("Restore cancelled.")) },
            { text: "Replace", style: "destructive", onPress: () => resolve() },
          ],
        );
      });
      await replaceSnapshot(backup);
      await syncReminderNotifications(backup.settings.notificationsEnabled ? backup.reminders : []);
      await refresh();
    },
    exportDiagnostics: async () => exportDiagnosticEvents(),
    clearDiagnostics: async () => clearDiagnosticEvents(),
    resetLocalData: async () => {
      const next = createEmptySnapshot(snapshot.settings);
      await replaceSnapshot(next);
      await syncReminderNotifications([]);
      await clearDiagnosticEvents();
      setSnapshot(next);
    },
  }), [authSessionVersion, markPending, ready, refresh, snapshot, syncIfEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = React.use(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}
