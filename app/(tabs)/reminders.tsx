import {
    Card,
    Chip,
    CompactButton,
    EmptyState,
    Field,
    FormActions,
    GradientCard,
    HeaderActionButton,
    IconBubble,
    PetAvatar,
    ReminderPill,
    ResponsiveScrollView,
    RowAction,
    Screen,
    ScreenHeader,
    SectionHeader,
    StatCard,
    StatusRail,
    useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Reminder, ReminderType } from "@/types/domain";
import { formatFriendlyDate, getReminderStatus, todayIso } from "@/utils/date";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

const reminderTypes: ReminderType[] = [
  "Vaccination",
  "Deworming",
  "Medication",
  "Appointment",
  "Grooming",
  "Custom",
];
const emptyReminder = {
  petId: "",
  type: "Vaccination" as ReminderType,
  title: "",
  dueDate: todayIso(),
  notes: "",
};

function statusTone(reminder: Reminder) {
  const value = getReminderStatus(reminder);
  if (value === "Overdue") return "danger" as const;
  if (value === "Due Today") return "warning" as const;
  if (value === "Completed") return "success" as const;
  return "teal" as const;
}

export default function RemindersScreen() {
  const { pets, reminders, saveReminder, completeReminder, removeReminder } =
    useAppData();
  const layout = useResponsiveLayout();
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState(emptyReminder);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const filtered = useMemo(
    () =>
      reminders.filter(
        (reminder) =>
          status === "All" || getReminderStatus(reminder) === status,
      ),
    [reminders, status],
  );
  const dueToday = reminders.filter(
    (item) => getReminderStatus(item) === "Due Today",
  );
  const overdue = reminders.filter(
    (item) => getReminderStatus(item) === "Overdue",
  );
  const upcoming = reminders.filter(
    (item) => getReminderStatus(item) === "Upcoming",
  );
  const nextReminder = [...dueToday, ...upcoming][0];

  const markedDates = useMemo(
    () =>
      reminders.reduce<Record<string, { marked: boolean; dotColor: string }>>(
        (acc, reminder) => {
          const reminderStatus = getReminderStatus(reminder);
          acc[reminder.dueDate] = {
            marked: true,
            dotColor:
              reminderStatus === "Completed"
                ? palette.success
                : reminderStatus === "Due Today"
                  ? palette.warning
                  : reminderStatus === "Overdue"
                    ? palette.danger
                    : palette.teal,
          };
          return acc;
        },
        {},
      ),
    [reminders],
  );

  const submit = async () => {
    const petId = form.petId || pets[0]?.id;
    if (!petId)
      return Alert.alert(
        "Add a pet first",
        "Care tasks must be linked to a pet.",
      );
    await saveReminder({
      ...form,
      id: editingId ?? undefined,
      petId,
      title: form.title || form.type,
    });
    setForm(emptyReminder);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setShowForm(true);
    setForm({
      petId: reminder.petId,
      type: reminder.type,
      title: reminder.title,
      dueDate: reminder.dueDate,
      notes: reminder.notes,
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyReminder);
  };

  const hasUrgent = overdue.length > 0;

  return (
    <Screen>
      <ResponsiveScrollView>
        {/* ── Header ── */}
        <ScreenHeader
          title="Care"
          subtitle="Care tasks, schedules & follow-ups"
          right={
            <HeaderActionButton
              icon="cog-outline"
              label="Open settings"
              active
              onPress={() => router.push("/settings")}
            />
          }
        />

        {/* ── Status Banner ── */}
        <GradientCard variant={hasUrgent ? "danger" : "calm"}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <IconBubble
              icon={hasUrgent ? "alert-outline" : "calendar-heart"}
              tone={hasUrgent ? "danger" : "teal"}
              size={40}
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontSize: 20,
                  fontFamily: fontFamily.black,
                }}
              >
                {hasUrgent
                  ? `${overdue.length} overdue care item${overdue.length === 1 ? "" : "s"}`
                  : "Care schedule is on track"}
              </Text>
              <Text
                selectable
                style={{
                  color: palette.muted,
                  lineHeight: 20,
                  fontFamily: fontFamily.medium,
                  fontSize: 13,
                }}
              >
                {nextReminder
                  ? `Next: ${nextReminder.title} • ${formatFriendlyDate(nextReminder.dueDate)}`
                  : "No upcoming care tasks right now."}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* ── Stat Row ── */}
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <StatCard
            label="Today"
            value={dueToday.length}
            icon="calendar-today"
            tone="warning"
          />
          <StatCard
            label="Overdue"
            value={overdue.length}
            icon="alert-outline"
            tone="danger"
          />
          <StatCard
            label="Total"
            value={reminders.length}
            icon="bell-outline"
          />
        </View>

        {/* ── Calendar ── */}
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
                textMonthFontFamily: fontFamily.bold,
                textDayFontFamily: fontFamily.medium,
              }}
            />
          </Card>
        ) : null}

        {/* ── Add/Edit Form ── */}
        {showForm ? (
          <>
            <SectionHeader
              title={editingId ? "Edit Reminder" : "Add Reminder"}
            />
            <Card>
              <Text
                selectable
                style={{
                  color: palette.muted,
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                }}
              >
                Select pet
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {pets.map((pet) => (
                  <Chip
                    key={pet.id}
                    label={pet.name}
                    active={(form.petId || pets[0]?.id) === pet.id}
                    onPress={() =>
                      setForm((current) => ({ ...current, petId: pet.id }))
                    }
                  />
                ))}
              </ScrollView>

              <Text
                selectable
                style={{
                  color: palette.muted,
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                }}
              >
                Care type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {reminderTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    active={form.type === type}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        type,
                        title: current.title || type,
                      }))
                    }
                  />
                ))}
              </ScrollView>

              <Field
                label="Title"
                value={form.title}
                onChangeText={(title) =>
                  setForm((current) => ({ ...current, title }))
                }
              />
              <Field
                label="Due Date"
                value={form.dueDate}
                onChangeText={(dueDate) =>
                  setForm((current) => ({ ...current, dueDate }))
                }
              />
              <Field
                label="Notes"
                value={form.notes}
                multiline
                onChangeText={(notes) =>
                  setForm((current) => ({ ...current, notes }))
                }
              />
              <FormActions
                submitLabel={editingId ? "Save" : "Add"}
                onSubmit={submit}
                onCancel={closeForm}
              />
            </Card>
          </>
        ) : null}

        {/* ── Filter Tabs ── */}
        <SectionHeader
          title="Care Queue"
          rightNode={
            <View
              style={{
                flexDirection: "row",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <CompactButton
                label="Calendar"
                icon="calendar-month-outline"
                onPress={() => setShowCalendar((value) => !value)}
              />
              {!showForm ? (
                <CompactButton
                  label="Add Care"
                  icon="plus"
                  primary
                  onPress={() => setShowForm(true)}
                />
              ) : null}
            </View>
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {["All", "Due Today", "Overdue", "Upcoming", "Completed"].map(
            (item) => (
              <Chip
                key={item}
                label={item}
                active={status === item}
                onPress={() => setStatus(item)}
                tone={
                  item === "Overdue"
                    ? "danger"
                    : item === "Due Today"
                      ? "warning"
                      : item === "Completed"
                        ? "success"
                        : "teal"
                }
              />
            ),
          )}
        </ScrollView>

        {/* ── Reminder List ── */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No care tasks found"
            message="Add a care task or change the current filter."
            icon="bell-off-outline"
          />
        ) : (
          filtered.slice(0, 15).map((reminder) => {
            const pet = pets.find((item) => item.id === reminder.petId);
            const tone = statusTone(reminder);
            return (
              <Card
                key={reminder.id}
                style={{
                  backgroundColor:
                    getReminderStatus(reminder) === "Overdue"
                      ? palette.dangerSoft
                      : getReminderStatus(reminder) === "Due Today"
                        ? palette.warningSoft
                        : "#fff",
                  borderColor:
                    getReminderStatus(reminder) === "Overdue"
                      ? "#FECACA"
                      : getReminderStatus(reminder) === "Due Today"
                        ? "#FDE68A"
                        : palette.borderLight,
                }}
              >
                <View style={{ gap: 12 }}>
                  <View
                    style={{
                      flexDirection: layout.isCompact ? "column" : "row",
                      gap: 12,
                      alignItems: layout.isCompact ? "flex-start" : "center",
                    }}
                  >
                    <StatusRail tone={tone} />
                    <PetAvatar pet={pet} size={layout.isCompact ? 50 : 56} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        selectable
                        style={{
                          color: palette.text,
                          fontSize: 17,
                          fontFamily: fontFamily.black,
                        }}
                      >
                        {reminder.title}
                      </Text>
                      <Text
                        selectable
                        style={{
                          color: palette.muted,
                          fontSize: 13,
                          fontFamily: fontFamily.semiBold,
                        }}
                      >
                        {pet?.name ?? "Pet"} •{" "}
                        {formatFriendlyDate(reminder.dueDate)}
                      </Text>
                      {reminder.notes ? (
                        <Text
                          selectable
                          style={{
                            color: palette.muted,
                            fontSize: 12,
                            fontFamily: fontFamily.medium,
                            lineHeight: 18,
                          }}
                        >
                          {reminder.notes}
                        </Text>
                      ) : null}
                    </View>
                    <ReminderPill reminder={reminder} />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip label={reminder.type} tone={tone} />
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {!reminder.completedAt ? (
                        <RowAction
                          icon="check-circle-outline"
                          onPress={() => completeReminder(reminder)}
                        />
                      ) : null}
                      <RowAction
                        icon="pencil-outline"
                        onPress={() => startEdit(reminder)}
                      />
                      <RowAction
                        icon="trash-can-outline"
                        danger
                        onPress={() =>
                          Alert.alert(
                            "Delete care task?",
                            "This removes the local care task.",
                            [
                              { text: "Cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => removeReminder(reminder.id),
                              },
                            ],
                          )
                        }
                      />
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ResponsiveScrollView>
    </Screen>
  );
}
