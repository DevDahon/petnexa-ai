import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { Reminder } from "@/types/domain";

const NOTIFICATION_SOURCE = "petnexa-reminder";

type NotificationsApi = typeof import("expo-notifications");
let notificationsPromise: Promise<NotificationsApi | null> | null = null;

function isAndroidExpoGo() {
  return Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function getNotifications() {
  if (isAndroidExpoGo()) return null;
  if (!notificationsPromise) {
    notificationsPromise = import("expo-notifications").catch(() => null);
  }
  return notificationsPromise;
}

function reminderDate(dueDate: string, dayOffset = 0) {
  const date = new Date(`${dueDate}T09:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

export async function requestNotificationAccess() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminderNotification(reminder: Reminder) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  const granted = await requestNotificationAccess();
  if (!granted) return;
  await cancelReminderNotification(reminder.id);
  if (reminder.completedAt) return;

  const oneDayBefore = reminderDate(reminder.dueDate, -1);
  const dueDate = reminderDate(reminder.dueDate);
  const schedules = [
    {
      date: oneDayBefore,
      title: `PetNexa care tomorrow: ${reminder.title}`,
      body: reminder.notes || "A pet health task is due tomorrow.",
      kind: "one-day-before",
    },
    {
      date: dueDate,
      title: `PetNexa care today: ${reminder.title}`,
      body: reminder.notes || "A pet health task is due today.",
      kind: "due-date",
    },
  ];

  await Promise.all(
    schedules
      .filter((item) => item.date.getTime() > Date.now())
      .map((item) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: item.title,
            body: item.body,
            data: { source: NOTIFICATION_SOURCE, reminderId: reminder.id, kind: item.kind },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date },
        }),
      ),
  );
}

export async function cancelReminderNotification(reminderId: string) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.source === NOTIFICATION_SOURCE && item.content.data?.reminderId === reminderId)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function syncReminderNotifications(reminders: Reminder[]) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
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
