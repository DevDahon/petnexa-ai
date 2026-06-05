import { Reminder } from "@/types/domain";

type NotificationsModule = typeof import("./notifications.web");

let modulePromise: Promise<NotificationsModule> | null = null;

function notifications(): Promise<NotificationsModule> {
  if (!modulePromise) {
    modulePromise = process.env.EXPO_OS === "web"
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
