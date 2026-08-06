import { Platform } from "react-native";
import { Reminder } from "@/types/domain";

type NotificationsModule = typeof import("./notifications.web");

let modulePromise: Promise<NotificationsModule> | null = null;

function notifications(): Promise<NotificationsModule> {
  if (!modulePromise) {
    modulePromise = Platform.OS === "web"
      ? import("./notifications.web")
      : import("./notifications.native");
  }
  return modulePromise;
}

export async function requestNotificationAccess() {
  return (await notifications()).requestNotificationAccess();
}

export async function scheduleReminderNotification(reminder: Reminder) {
  return (await notifications()).scheduleReminderNotification(reminder);
}

export async function cancelReminderNotification(reminderId: string) {
  return (await notifications()).cancelReminderNotification(reminderId);
}

export async function syncReminderNotifications(reminders: Reminder[]) {
  return (await notifications()).syncReminderNotifications(reminders);
}
