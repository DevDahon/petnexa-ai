import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { BrandMark, Card, EmptyState, PetCard, PrimaryButton, ReminderPill, Screen, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { formatFriendlyDate, getReminderStatus } from "@/utils/date";

export default function HomeScreen() {
  const { owner, pets, reminders, records, veterinarians, creditState } = useAppData();
  const due = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming").slice(0, 2);
  const nextReminder = [...due, ...upcoming][0];
  const primaryVet = veterinarians.find((vet) => vet.isPrimary) ?? veterinarians[0];
  const weightTrend = pets.slice(0, 4).map((pet) => ({ value: pet.weightKg, label: pet.name.slice(0, 3) }));

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <Card style={{ backgroundColor: palette.softTeal }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>Hi, {owner.fullName.split(" ")[0] || "Pet Parent"}</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>A quick look at your pets today.</Text>
            </View>
            <BrandMark compact />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Due today" value={due.length} icon="calendar-alert" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-circle-outline" tone="danger" />
          <StatCard label="AI credits" value={`${creditState.aiCredits}/3`} icon="robot-happy-outline" tone="navy" />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Link href="/ai-assistant" asChild>
            <PrimaryButton label="AI Check" icon="heart" onPress={() => {}} />
          </Link>
          <Link href="/settings" asChild>
            <PrimaryButton label="Settings" icon="shield" onPress={() => {}} />
          </Link>
        </View>

        <SectionHeader title="Pets" action={`${pets.length} profiles`} />
        {pets.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {pets.slice(0, 4).map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </ScrollView>
        ) : (
          <EmptyState title="No pets yet" message="Add your first pet to start tracking care." actionLabel="Add Pet" onAction={() => {}} />
        )}

        <SectionHeader title="Next Care" />
        {nextReminder ? (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MaterialCommunityIcons name="calendar-clock" color={palette.teal} size={28} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>{nextReminder.title}</Text>
                <Text selectable style={{ color: palette.muted }}>{formatFriendlyDate(nextReminder.dueDate)}</Text>
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
                <MaterialCommunityIcons name="clipboard-pulse-outline" color={palette.teal} size={24} />
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{record.type}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}</Text>
                </View>
              </View>
            </Card>
          );
        })}

        <SectionHeader title="Health Snapshot" />
        <Card>
          <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Weight overview</Text>
          <LineChart
            data={weightTrend.length ? weightTrend : [{ value: 0 }]}
            height={104}
            spacing={48}
            color={palette.teal}
            dataPointsColor={palette.navy}
            thickness={3}
            hideRules
            yAxisColor={palette.border}
            xAxisColor={palette.border}
          />
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialCommunityIcons name="phone-in-talk-outline" color={palette.navy} size={24} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{primaryVet?.clinicName ?? "Emergency vet not set"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{primaryVet?.emergencyHotline ?? "Add a primary vet in Settings."}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
