import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { AppSnapshot, Consultation, HealthRecord, Owner, Pet, Reminder, Settings, Veterinarian } from "@/types/domain";
import { initDatabase, getSnapshot, replaceSnapshot, upsertConsultation, upsertCreditState, upsertOwner, upsertPet, upsertRecord, upsertReminder, upsertSettings, upsertVet, deletePet, deleteRecord, deleteReminder, deleteVet } from "@/storage/database";
import { createId, currentWeekKey, todayIso } from "@/utils/date";
import { exportBackup, pickBackupFile } from "@/services/backup";
import { scheduleReminderNotification } from "@/services/notifications";

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
  exportData: () => Promise<string>;
  restoreDataReplaceMode: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const emptySnapshot: AppSnapshot = {
  owner: { id: "owner_1", fullName: "", phone: "", email: "", address: "", emergencyContact: "", notes: "" },
  pets: [],
  veterinarians: [],
  records: [],
  reminders: [],
  consultations: [],
  creditState: { aiCredits: 3, starterCreditsGranted: true, weeklyAdWatchCount: 0, lastWeeklyResetDate: todayIso(), totalConsultationsUsed: 0 },
  settings: { notificationsEnabled: true, dailySummaryTime: "08:00", optionalCloudSyncEnabled: false },
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

  useEffect(() => {
    async function boot() {
      await initDatabase();
      await getInstallationId();
      await AsyncStorage.setItem("petnexa_last_opened", new Date().toISOString());
      await refresh();
      setReady(true);
    }
    boot();
  }, [refresh]);

  const value = useMemo<AppContextValue>(() => ({
    ...snapshot,
    ready,
    refresh,
    saveOwner: async (owner) => {
      await upsertOwner(owner);
      await refresh();
    },
    savePet: async (pet) => {
      await upsertPet(pet);
      await refresh();
    },
    removePet: async (id) => {
      await deletePet(id);
      await refresh();
    },
    saveVet: async (vet) => {
      await upsertVet(vet);
      await refresh();
    },
    removeVet: async (id) => {
      await deleteVet(id);
      await refresh();
    },
    saveRecord: async (record) => {
      await upsertRecord(record);
      await refresh();
    },
    removeRecord: async (id) => {
      await deleteRecord(id);
      await refresh();
    },
    saveReminder: async (reminder) => {
      const saved = { ...reminder, id: reminder.id ?? createId("reminder"), createdAt: reminder.createdAt ?? todayIso() };
      await upsertReminder(saved);
      if (snapshot.settings.notificationsEnabled) await scheduleReminderNotification(saved);
      await refresh();
    },
    completeReminder: async (reminder) => {
      await upsertReminder({ ...reminder, completedAt: new Date().toISOString() });
      await refresh();
    },
    removeReminder: async (id) => {
      await deleteReminder(id);
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
      await refresh();
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
      await refresh();
    },
  }), [ready, refresh, snapshot]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = React.use(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}
