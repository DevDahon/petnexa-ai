import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Card, Chip, Field, GhostButton, PetAvatar, PrimaryButton, ReminderPill, Screen, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Reminder, ReminderType } from "@/types/domain";
import { formatFriendlyDate, getReminderStatus, todayIso } from "@/utils/date";

const reminderTypes: ReminderType[] = ["Vaccination", "Deworming", "Medication", "Appointment", "Grooming", "Custom"];
const emptyReminder = { petId: "", type: "Vaccination" as ReminderType, title: "", dueDate: todayIso(), notes: "" };

export default function RemindersScreen() {
  const { pets, reminders, saveReminder, completeReminder, removeReminder } = useAppData();
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState(emptyReminder);
  const [editingId, setEditingId] = useState<string | null>(null);
  const filtered = useMemo(() => reminders.filter((reminder) => status === "All" || getReminderStatus(reminder) === status), [reminders, status]);
  const markedDates = useMemo(() => {
    return reminders.reduce<Record<string, { marked: boolean; dotColor: string }>>((acc, reminder) => {
      const reminderStatus = getReminderStatus(reminder);
      acc[reminder.dueDate] = {
        marked: true,
        dotColor: reminderStatus === "Completed" ? palette.success : reminderStatus === "Due Today" ? palette.warning : reminderStatus === "Overdue" ? palette.danger : palette.teal,
      };
      return acc;
    }, {});
  }, [reminders]);

  const submit = async () => {
    const petId = form.petId || pets[0]?.id;
    if (!petId) return Alert.alert("Add a pet first", "Reminders must be linked to a pet.");
    await saveReminder({ ...form, id: editingId ?? undefined, petId, title: form.title || form.type });
    setForm(emptyReminder);
    setEditingId(null);
  };

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({ petId: reminder.petId, type: reminder.type, title: reminder.title, dueDate: reminder.dueDate, notes: reminder.notes });
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <SectionHeader title="Smart Reminders" action={`${filtered.length} shown`} />
        <Card>
          <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Reminder Calendar</Text>
          <Calendar
            markedDates={markedDates}
            theme={{
              calendarBackground: "#fff",
              todayTextColor: palette.teal,
              arrowColor: palette.teal,
              selectedDayBackgroundColor: palette.teal,
              textMonthFontWeight: "800",
              textDayFontWeight: "600",
            }}
          />
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip label="Completed" tone="teal" />
            <Chip label="Due Today" tone="warning" />
            <Chip label="Overdue" tone="danger" />
            <Chip label="Upcoming" tone="navy" />
          </View>
        </Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {["All", "Due Today", "Overdue", "Upcoming", "Completed"].map((item) => <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} tone={item === "Overdue" ? "danger" : item === "Due Today" ? "warning" : "teal"} />)}
        </ScrollView>
        {filtered.map((reminder) => {
          const pet = pets.find((item) => item.id === reminder.petId);
          return (
            <Card key={reminder.id}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <PetAvatar pet={pet} size={54} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{reminder.title}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(reminder.dueDate)}</Text>
                  <Text selectable style={{ color: palette.muted }}>{reminder.notes || "No notes."}</Text>
                </View>
                <ReminderPill reminder={reminder} />
              </View>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {!reminder.completedAt ? <GhostButton label="Complete" onPress={() => completeReminder(reminder)} /> : null}
                <GhostButton label="Edit" onPress={() => startEdit(reminder)} />
                <GhostButton label="Delete" danger onPress={() => Alert.alert("Delete reminder?", "This removes the local reminder.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeReminder(reminder.id) }])} />
              </View>
            </Card>
          );
        })}

        <SectionHeader title={editingId ? "Edit Reminder" : "Add Reminder"} />
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {pets.map((pet) => <Chip key={pet.id} label={pet.name} active={(form.petId || pets[0]?.id) === pet.id} onPress={() => setForm((current) => ({ ...current, petId: pet.id }))} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {reminderTypes.map((type) => <Chip key={type} label={type} active={form.type === type} onPress={() => setForm((current) => ({ ...current, type, title: current.title || type }))} />)}
          </ScrollView>
          <Field label="Title" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
          <Field label="Due Date (YYYY-MM-DD)" value={form.dueDate} onChangeText={(dueDate) => setForm((current) => ({ ...current, dueDate }))} />
          <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <PrimaryButton label={editingId ? "Save Reminder" : "Add Reminder"} onPress={submit} />
            {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(emptyReminder); }} /> : null}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
