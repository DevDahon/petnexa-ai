import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { Card, EmptyState, HeaderAppIcon, IconBubble, PetAvatar, ReminderPill, Screen, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { calculateAge, formatFriendlyDate, getReminderStatus } from "@/utils/date";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { owner, pets, reminders, records } = useAppData();
  const due = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming");
  const nextReminder = [...due, ...upcoming][0];

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Home</Text>
            <Text selectable style={{ color: palette.text, fontSize: 15, fontWeight: "800" }}>{greeting()}, {owner.fullName.split(" ")[0] || "John"}!</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Here's what's happening today.</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <HeaderAppIcon size={46} />
          </View>
        </View>

        <Card style={{ borderColor: palette.mint }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconBubble icon="heart-pulse" size={50} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Care Summary</Text>
              <Text selectable style={{ color: palette.navy, fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{pets.length} pets</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{records.length} health records saved</Text>
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Due Today" value={due.length} icon="calendar-alert" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-outline" tone="danger" />
          <StatCard label="Upcoming" value={upcoming.length} icon="calendar-check-outline" tone="teal" />
        </View>

        <SectionHeader title="My Pets" action="View all" />
        {pets.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pets.slice(0, 3).map((pet) => (
              <Card key={pet.id} style={{ width: 118 }}>
                <View style={{ alignItems: "center", gap: 7 }}>
                  <PetAvatar pet={pet} size={64} />
                  <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 14 }}>{pet.name}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 10, textAlign: "center" }}>{pet.breed || pet.species}</Text>
                  <Text selectable style={{ color: palette.navy, fontSize: 10 }}>{calculateAge(pet.birthday).replace(" old", "")}</Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        ) : (
          <EmptyState title="No pets yet" message="Add your first pet to start tracking care." icon="paw" />
        )}

        <SectionHeader title="Next Care" />
        {nextReminder ? (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconBubble icon="calendar-clock" size={46} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 15 }}>{nextReminder.title}</Text>
                <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{formatFriendlyDate(nextReminder.dueDate)}</Text>
              </View>
              <ReminderPill reminder={nextReminder} />
            </View>
          </Card>
        ) : (
          <EmptyState title="No upcoming care" message="You are all caught up for now." icon="check-circle-outline" />
        )}

        <SectionHeader title="Recent Activity" />
        {records.slice(0, 2).map((record) => {
          const pet = pets.find((item) => item.id === record.petId);
          return (
            <Card key={record.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <IconBubble icon={record.type === "Vaccination" ? "needle" : "clipboard-pulse-outline"} tone={record.type === "Vaccination" ? "peach" : "navy"} size={42} />
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{record.type}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" color={palette.navy} size={22} />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
