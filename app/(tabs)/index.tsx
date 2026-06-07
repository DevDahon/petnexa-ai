import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, GradientCard, HeaderAppIcon, IconBubble, PetAvatar, ReminderPill, Screen, SectionHeader, StatCard } from "@/components/ui";
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
  const featuredPet = pets[0];
  const ownerName = owner.fullName.split(" ")[0] || "Pet Parent";

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Home</Text>
            <Text selectable style={{ color: palette.text, fontSize: 15, fontWeight: "800" }}>{greeting()}, {ownerName}!</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Your pet care overview for today.</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <HeaderAppIcon size={46} />
          </View>
        </View>

        <GradientCard variant="primary">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ flex: 1, gap: 7 }}>
              <Text selectable style={{ color: "rgba(255,255,255,0.84)", fontSize: 12, fontWeight: "900" }}>TODAY'S CARE</Text>
              <Text selectable style={{ color: "#fff", fontSize: 25, lineHeight: 31, fontWeight: "900" }}>{greeting()}, {ownerName}</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 }}>
                {pets.length} {pets.length === 1 ? "pet" : "pets"} tracked • {due.length + overdue.length} care {due.length + overdue.length === 1 ? "item" : "items"} need attention
              </Text>
            </View>
            <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.42)" }}>
              <MaterialCommunityIcons name="heart-pulse" color="#fff" size={38} />
            </View>
          </View>
        </GradientCard>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Due Today" value={due.length} icon="calendar-alert" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-outline" tone="danger" />
          <StatCard label="Upcoming" value={upcoming.length} icon="calendar-check-outline" tone="teal" />
        </View>

        {featuredPet ? (
          <>
            <SectionHeader title="Featured Pet" />
            <Card style={{ backgroundColor: featuredPet.species === "Cat" ? palette.softPeach : palette.softTeal, borderColor: featuredPet.species === "Cat" ? "#FFE1CC" : palette.mint }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <PetAvatar pet={featuredPet} size={84} />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 21, fontWeight: "900" }}>{featuredPet.name}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{featuredPet.breed || featuredPet.species}</Text>
                  <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
                    <Chip label={calculateAge(featuredPet.birthday).replace(" old", "")} active />
                    <Chip label={`${featuredPet.weightKg} kg`} tone="navy" />
                  </View>
                </View>
              </View>
            </Card>
          </>
        ) : null}

        <SectionHeader title="My Pets" action={`${pets.length} saved`} />
        {pets.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pets.slice(0, 3).map((pet) => (
              <Card key={pet.id} style={{ width: 124 }}>
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
        {records.length === 0 ? <EmptyState title="No recent activity" message="New health records will appear here." icon="clipboard-text-outline" /> : null}
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
