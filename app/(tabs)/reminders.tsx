import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, IconBubble, PetAvatar, PrimaryButton, ReminderPill, RowAction, Screen, ScreenIntro, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Reminder, ReminderType } from "@/types/domain";
import { formatFriendlyDate, getReminderStatus, todayIso } from "@/utils/date";

const reminderTypes: ReminderType[] = ["Vaccination", "Deworming", "Medication", "Appointment", "Grooming", "Custom"];
const emptyReminder = { petId: "", type: "Vaccination" as ReminderType, title: "", dueDate: todayIso(), notes: "" };

function statusTone(reminder: Reminder) {
  const value = getReminderStatus(reminder);
  if (value === "Overdue") return "danger" as const;
  if (value === "Due Today") return "warning" as const;
  if (value === "Completed") return "success" as const;
  return "teal" as const;
}

export default function RemindersScreen() {
  const { pets, reminders, saveReminder, completeReminder, removeReminder } = useAppData();
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState(emptyReminder);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const filtered = useMemo(() => reminders.filter((reminder) => status === "All" || getReminderStatus(reminder) === status), [reminders, status]);
  const dueToday = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const markedDates = useMemo(() => reminders.reduce<Record<string, { marked: boolean; dotColor: string }>>((acc, reminder) => {
    const reminderStatus = getReminderStatus(reminder);
    acc[reminder.dueDate] = {
      marked: true,
      dotColor: reminderStatus === "Completed" ? palette.success : reminderStatus === "Due Today" ? palette.warning : reminderStatus === "Overdue" ? palette.danger : palette.teal,
    };
    return acc;
  }, {}), [reminders]);

  const submit = async () => {
    const petId = form.petId || pets[0]?.id;
    if (!petId) return Alert.alert("Add a pet first", "Reminders must be linked to a pet.");
    await saveReminder({ ...form, id: editingId ?? undefined, petId, title: form.title || form.type });
    setForm(emptyReminder);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setShowForm(true);
    setForm({ petId: reminder.petId, type: reminder.type, title: reminder.title, dueDate: reminder.dueDate, notes: reminder.notes });
  };

  const closeForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyReminder);
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <ScreenIntro title="Reminders" subtitle="A calm care queue with clear priority." icon="calendar-clock" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Today" value={dueToday.length} icon="calendar-today" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-outline" tone="danger" />
          <StatCard label="Total" value={reminders.length} icon="bell-outline" />
        </View>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {!showForm ? <PrimaryButton label="Add Reminder" icon="bell-plus-outline" onPress={() => setShowForm(true)} /> : null}
          <GhostButton label={showCalendar ? "Hide Calendar" : "Calendar"} onPress={() => setShowCalendar((value) => !value)} />
        </View>

        <GradientCard variant="calm">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconBubble icon="calendar-month-outline" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 19, fontWeight: "900" }}>Care calendar</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Vaccines, medication, appointments, and grooming are color-coded by urgency.</Text>
            </View>
          </View>
        </GradientCard>

        {showCalendar ? (
          <Card>
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
          </Card>
        ) : null}

        {showForm ? (
          <>
            <SectionHeader title={editingId ? "Edit Reminder" : "Add Reminder"} />
            <GradientCard variant="calm">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pets.map((pet) => <Chip key={pet.id} label={pet.name} active={(form.petId || pets[0]?.id) === pet.id} onPress={() => setForm((current) => ({ ...current, petId: pet.id }))} />)}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {reminderTypes.map((type) => <Chip key={type} label={type} active={form.type === type} onPress={() => setForm((current) => ({ ...current, type, title: current.title || type }))} />)}
              </ScrollView>
              <Field label="Title" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
              <Field label="Due Date" value={form.dueDate} onChangeText={(dueDate) => setForm((current) => ({ ...current, dueDate }))} />
              <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <PrimaryButton label={editingId ? "Save" : "Add"} onPress={submit} />
                <GhostButton label="Cancel" onPress={closeForm} />
              </View>
            </GradientCard>
          </>
        ) : null}

        <SectionHeader title="Care Queue" action={`${filtered.length} shown`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {["All", "Due Today", "Overdue", "Upcoming", "Completed"].map((item) => <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} tone={item === "Overdue" ? "danger" : item === "Due Today" ? "warning" : "teal"} />)}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState title="No reminders found" message="Add a reminder or change the current filter." icon="bell-off-outline" />
        ) : (
          filtered.slice(0, 12).map((reminder) => {
            const pet = pets.find((item) => item.id === reminder.petId);
            return (
              <Card key={reminder.id}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <View style={{ width: 5, alignSelf: "stretch", borderRadius: 99, backgroundColor: getReminderStatus(reminder) === "Overdue" ? palette.danger : getReminderStatus(reminder) === "Due Today" ? palette.warning : getReminderStatus(reminder) === "Completed" ? palette.success : palette.teal }} />
                    <PetAvatar pet={pet} size={58} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{reminder.title}</Text>
                      <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(reminder.dueDate)}</Text>
                    </View>
                    <ReminderPill reminder={reminder} />
                  </View>
                  <View style={{ height: 9, borderRadius: 99, backgroundColor: "#EEF2F6", overflow: "hidden" }}>
                    <View style={{ width: getReminderStatus(reminder) === "Completed" ? "100%" : getReminderStatus(reminder) === "Overdue" ? "92%" : getReminderStatus(reminder) === "Due Today" ? "68%" : "34%", height: "100%", backgroundColor: getReminderStatus(reminder) === "Overdue" ? palette.danger : getReminderStatus(reminder) === "Due Today" ? palette.warning : getReminderStatus(reminder) === "Completed" ? palette.success : palette.teal }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip label={reminder.type} tone={statusTone(reminder)} />
                    <View style={{ flexDirection: "row" }}>
                      {!reminder.completedAt ? <RowAction icon="check-circle-outline" onPress={() => completeReminder(reminder)} /> : null}
                      <RowAction icon="pencil-outline" onPress={() => startEdit(reminder)} />
                      <RowAction icon="trash-can-outline" danger onPress={() => Alert.alert("Delete reminder?", "This removes the local reminder.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeReminder(reminder.id) }])} />
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
