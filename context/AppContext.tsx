import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";
import { AppSnapshot, Consultation, HealthRecord, Owner, Pet, Reminder, Settings, SyncMetadata, Veterinarian } from "@/types/domain";
import { initDatabase, getSnapshot, replaceSnapshot, upsertConsultation, upsertCreditState, upsertOwner, upsertPet, upsertRecord, upsertReminder, upsertSettings, upsertVet, deletePet, deleteRecord, deleteReminder, deleteVet } from "@/storage/database";
import { createId, currentWeekKey, todayIso } from "@/utils/date";
import { exportBackup, pickBackupFile } from "@/services/backup";
import { cancelReminderNotification, scheduleReminderNotification, syncReminderNotifications } from "@/services/notifications";
import { createHome, joinHome, signInWithEmailOtp, signInWithGoogle, signOutHome, softDeleteCloudEntity, syncNow, verifyOtp } from "@/services/home-sync";

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
  createHomeAccount: (name: string) => Promise<void>;
  joinHomeAccount: (inviteCode: string) => Promise<void>;
  logoutHomeAccount: () => Promise<void>;
  syncHomeNow: () => Promise<void>;
  exportData: () => Promise<string>;
  restoreDataReplaceMode: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const emptySnapshot: AppSnapshot = {
  owner: { id: "owner_1", fullName: "", birthday: "" },
  pets: [],
  veterinarians: [],
  records: [],
  reminders: [],
  consultations: [],
  creditState: { aiCredits: 3, starterCreditsGranted: true, weeklyAdWatchCount: 0, lastWeeklyResetDate: todayIso(), totalConsultationsUsed: 0 },
  settings: { notificationsEnabled: true, dailySummaryTime: "08:00", careMode: null, syncEnabled: false },
};

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

export function AppProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setSnapshot(await getSnapshot());
  }, []);

  const syncIfEnabled = useCallback(async (base?: AppSnapshot) => {
    const current = base ?? await getSnapshot();
    if (current.settings.careMode !== "home" || !current.settings.syncEnabled || !current.settings.homeId) return current;
    const synced = await syncNow(current);
    await replaceSnapshot(synced);
    setSnapshot(synced);
    return synced;
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

  useEffect(() => {
    async function boot() {
      await initDatabase();
      await getInstallationId();
      await AsyncStorage.setItem("petnexa_last_opened", new Date().toISOString());
      const current = await getSnapshot();
      setSnapshot(current);
      if (current.settings.notificationsEnabled) await syncReminderNotifications(current.reminders);
      try {
        await syncIfEnabled(current);
      } catch {
        // Home sync should never block local app startup.
      }
      setReady(true);
    }
    boot();
  }, [syncIfEnabled]);

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
      const result = await upsertRecord(markPending(record));
      if (snapshot.settings.notificationsEnabled && result?.linkedReminder) await scheduleReminderNotification(result.linkedReminder);
      await refresh();
      await syncIfEnabled().catch(() => undefined);
    },
    removeRecord: async (id) => {
      if (snapshot.settings.careMode === "home") {
        await softDeleteCloudEntity("records", snapshot.settings.homeId, id).catch(() => undefined);
        await Promise.all(snapshot.reminders.filter((item) => item.linkedRecordId === id).map((item) => softDeleteCloudEntity("reminders", snapshot.settings.homeId, item.id))).catch(() => undefined);
      }
      await deleteRecord(id);
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
    createHomeAccount: async (name) => {
      const home = await createHome(name || `${snapshot.owner.fullName.split(" ")[0] || "PetNexa"} Home`, snapshot.owner.fullName);
      const current = await getSnapshot();
      const next: AppSnapshot = {
        ...current,
        settings: { ...current.settings, careMode: "home", syncEnabled: true, homeId: home.homeId, homeName: home.homeName ?? name, homeInviteCode: home.inviteCode },
      };
      await replaceSnapshot(next);
      await syncIfEnabled(next);
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
      await signOutHome();
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
    },
    syncHomeNow: async () => {
      const synced = await syncIfEnabled();
      await replaceSnapshot(synced);
      setSnapshot(synced);
    },
    exportData: async () => exportBackup(await getSnapshot()),
    restoreDataReplaceMode: async () => {
      const backup = await pickBackupFile();
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
  }), [markPending, ready, refresh, snapshot, syncIfEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = React.use(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}
