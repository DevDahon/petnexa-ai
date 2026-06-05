import * as Notifications from "expo-notifications";
import { Reminder } from "@/types/domain";

export async function requestNotificationAccess() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminderNotification(reminder: Reminder) {
  const granted = await requestNotificationAccess();
  if (!granted) return;
  const date = new Date(`${reminder.dueDate}T09:00:00`);
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `PetNexa reminder: ${reminder.title}`,
      body: reminder.notes || "A pet health task is coming up.",
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
