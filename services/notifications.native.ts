import * as Notifications from "expo-notifications";
import { Reminder } from "@/types/domain";

const NOTIFICATION_SOURCE = "petnexa-reminder";

export async function requestNotificationAccess() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminderNotification(reminder: Reminder) {
  const granted = await requestNotificationAccess();
  if (!granted) return;
  await cancelReminderNotification(reminder.id);
  const date = new Date(`${reminder.dueDate}T09:00:00`);
  if (reminder.completedAt || date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `PetNexa reminder: ${reminder.title}`,
      body: reminder.notes || "A pet health task is coming up.",
      data: { source: NOTIFICATION_SOURCE, reminderId: reminder.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelReminderNotification(reminderId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.source === NOTIFICATION_SOURCE && item.content.data?.reminderId === reminderId)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function syncReminderNotifications(reminders: Reminder[]) {
  const granted = await requestNotificationAccess();
  if (!granted) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.source === NOTIFICATION_SOURCE)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
  await Promise.all(reminders.map((reminder) => scheduleReminderNotification(reminder)));
}
