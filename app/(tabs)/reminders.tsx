import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, HeaderAppIcon, IconBubble, PetAvatar, PrimaryButton, ReminderPill, RowAction, Screen, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Reminder, ReminderType } from "@/types/domain";
import { formatFriendlyDate, getReminderStatus, todayIso } from "@/utils/date";

const reminderTypes: ReminderType[] = ["Vaccination", "Deworming", "Medication", "Appointment", "Grooming", "Custom"];
const emptyReminder = { petId: "", type: "Vaccination" as ReminderType, title: "", dueDate: todayIso(), notes: "" };

function CareActionButton({ label, detail, icon, active, primary, onPress }: { label: string; detail: string; icon: React.ComponentProps<typeof IconBubble>["icon"]; active?: boolean; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
      <View style={{ minHeight: 78, borderRadius: 22, borderWidth: 1.5, borderColor: primary || active ? palette.teal : palette.border, backgroundColor: primary ? palette.teal : active ? palette.softTeal : "#fff", padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: primary ? "rgba(255,255,255,0.2)" : active ? "#fff" : palette.softTeal }}>
          <IconBubble icon={icon} size={34} tone={primary ? "navy" : "teal"} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: primary ? "#fff" : palette.text, fontSize: 13, fontWeight: "900" }}>{label}</Text>
          <Text selectable style={{ color: primary ? "rgba(255,255,255,0.82)" : palette.muted, fontSize: 11, lineHeight: 15 }}>{detail}</Text>
        </View>
      </View>
    </Pressable>
  );
}

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
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming");
  const nextReminder = [...dueToday, ...upcoming][0];
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Care</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 13 }}>Reminders, schedules, and follow-ups.</Text>
          </View>
          <HeaderAppIcon size={46} />
        </View>

        <GradientCard variant={overdue.length > 0 ? "danger" : "calm"}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <IconBubble icon={overdue.length > 0 ? "alert-outline" : "calendar-heart"} tone={overdue.length > 0 ? "danger" : "teal"} size={58} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable style={{ color: palette.text, fontSize: 21, fontWeight: "900" }}>{overdue.length > 0 ? `${overdue.length} overdue care item${overdue.length === 1 ? "" : "s"}` : "Care schedule is on track"}</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>
                {nextReminder ? `Next: ${nextReminder.title} • ${formatFriendlyDate(nextReminder.dueDate)}` : "No upcoming reminders right now."}
              </Text>
            </View>
          </View>
        </GradientCard>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Today" value={dueToday.length} icon="calendar-today" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-outline" tone="danger" />
          <StatCard label="Total" value={reminders.length} icon="bell-outline" />
        </View>

        {!showForm ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <CareActionButton label="Add" detail="New reminder" icon="bell-plus-outline" primary onPress={() => setShowForm(true)} />
            <CareActionButton label={showCalendar ? "Hide" : "Calendar"} detail={showCalendar ? "Close view" : "Monthly view"} icon="calendar-month-outline" active={showCalendar} onPress={() => setShowCalendar((value) => !value)} />
          </View>
        ) : null}

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
            <Card>
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
            </Card>
          </>
        ) : null}

        <SectionHeader title="Care Queue" action={`${filtered.length} shown`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {["All", "Due Today", "Overdue", "Upcoming", "Completed"].map((item) => <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} tone={item === "Overdue" ? "danger" : item === "Due Today" ? "warning" : "teal"} />)}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState title="No reminders found" message="Add a reminder or change the current filter." icon="bell-off-outline" />
        ) : (
          filtered.slice(0, 12).map((reminder) => {
            const pet = pets.find((item) => item.id === reminder.petId);
            return (
              <Card key={reminder.id} style={{ backgroundColor: getReminderStatus(reminder) === "Overdue" ? palette.softDanger : getReminderStatus(reminder) === "Due Today" ? palette.softYellow : "#fff", borderColor: getReminderStatus(reminder) === "Overdue" ? "#FECACA" : getReminderStatus(reminder) === "Due Today" ? "#FDE68A" : "#E8EEF4" }}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <View style={{ width: 5, alignSelf: "stretch", borderRadius: 99, backgroundColor: getReminderStatus(reminder) === "Overdue" ? palette.danger : getReminderStatus(reminder) === "Due Today" ? palette.warning : getReminderStatus(reminder) === "Completed" ? palette.success : palette.teal }} />
                    <PetAvatar pet={pet} size={58} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{reminder.title}</Text>
                      <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(reminder.dueDate)}</Text>
                      {reminder.notes ? <Text selectable style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>{reminder.notes}</Text> : null}
                    </View>
                    <ReminderPill reminder={reminder} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <Chip label={reminder.type} tone={statusTone(reminder)} />
                    <View style={{ flexDirection: "row", gap: 4 }}>
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
