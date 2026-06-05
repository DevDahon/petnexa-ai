import { Reminder } from "@/types/domain";

export async function requestNotificationAccess() {
  return false;
}

export async function scheduleReminderNotification(_reminder: Reminder) {
  return;
}

export async function cancelReminderNotification(_reminderId: string) {
  return;
}

export async function syncReminderNotifications(_reminders: Reminder[]) {
  return;
}
