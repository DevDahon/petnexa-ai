import { Reminder } from "@/types/domain";

export async function requestNotificationAccess() {
  return false;
}

export async function scheduleReminderNotification(_reminder: Reminder) {
  return;
}
