import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { ScrollView, Text, View } from "react-native";
import { BrandMark, Card, PetCard, PrimaryButton, ReminderPill, Screen, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { formatFriendlyDate, getReminderStatus } from "@/utils/date";

export default function HomeScreen() {
  const { owner, pets, reminders, records, veterinarians } = useAppData();
  const due = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming").slice(0, 4);
  const primaryVet = veterinarians.find((vet) => vet.isPrimary) ?? veterinarians[0];
  const chartCounts = [
    { value: records.filter((record) => record.type === "Vaccination").length, color: palette.teal, text: "Vaccines" },
    { value: records.filter((record) => record.type === "Deworming").length, color: palette.mint, text: "Deworm" },
    { value: records.filter((record) => record.type === "Medication").length, color: palette.yellow, text: "Meds" },
    { value: records.filter((record) => record.type !== "Vaccination" && record.type !== "Deworming" && record.type !== "Medication").length, color: palette.peach, text: "Other" },
  ].filter((item) => item.value > 0);
  const weightTrend = pets.slice(0, 5).map((pet, index) => ({ value: pet.weightKg, label: index === 0 ? "Pets" : "" }));

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <Card style={{ backgroundColor: palette.softTeal }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 26, fontWeight: "900" }}>Good morning, {owner.fullName.split(" ")[0] || "Pet Parent"}</Text>
              <Text selectable style={{ color: palette.muted }}>Here is what is happening today.</Text>
            </View>
            <BrandMark compact />
          </View>
        </Card>

        <SectionHeader title="My Pets" action={`${pets.length} profiles`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card style={{ flex: 1 }}>
            <MaterialCommunityIcons name="calendar-alert" color={palette.warning} size={26} />
            <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{due.length}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Due Today</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <MaterialCommunityIcons name="shield-alert-outline" color={palette.danger} size={26} />
            <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{overdue.length}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Overdue</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <MaterialCommunityIcons name="calendar-clock" color={palette.teal} size={26} />
            <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{upcoming.length}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Upcoming</Text>
          </Card>
        </View>

        <SectionHeader title="Upcoming Schedule" />
        {reminders.slice(0, 5).map((reminder) => {
          const pet = pets.find((item) => item.id === reminder.petId);
          return (
            <Card key={reminder.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{reminder.title}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(reminder.dueDate)}</Text>
                </View>
                <ReminderPill reminder={reminder} />
              </View>
            </Card>
          );
        })}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Link href="/ai-assistant" asChild>
            <PrimaryButton label="Start AI Check" icon="heart" onPress={() => {}} />
          </Link>
          <PrimaryButton label={primaryVet ? "Emergency Vet" : "Add Vet"} icon="shield" onPress={() => {}} />
        </View>

        <SectionHeader title="Recent Records" />
        {records.slice(0, 4).map((record) => {
          const pet = pets.find((item) => item.id === record.petId);
          return (
            <Card key={record.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <MaterialCommunityIcons name="clipboard-pulse-outline" color={palette.teal} size={24} />
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{record.type}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name} • {formatFriendlyDate(record.date)}</Text>
                </View>
              </View>
            </Card>
          );
        })}

        <Card>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialCommunityIcons name="phone-in-talk-outline" color={palette.navy} size={24} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{primaryVet?.clinicName ?? "No veterinarian saved"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{primaryVet?.emergencyHotline ?? "Add a primary vet in Settings."}</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Health Analytics Preview" />
        <View style={{ gap: 12 }}>
          <Card>
            <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Weight Trend</Text>
            <LineChart
              data={weightTrend.length ? weightTrend : [{ value: 0 }]}
              height={120}
              spacing={42}
              color={palette.teal}
              dataPointsColor={palette.navy}
              thickness={3}
              hideRules
              yAxisColor={palette.border}
              xAxisColor={palette.border}
            />
          </Card>
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 160 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Records</Text>
              <PieChart data={chartCounts.length ? chartCounts : [{ value: 1, color: palette.border, text: "None" }]} donut radius={54} innerRadius={34} />
            </Card>
            <Card style={{ flex: 1, minWidth: 160 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Reminders</Text>
              <BarChart
                data={[
                  { value: reminders.filter((item) => getReminderStatus(item) === "Completed").length, label: "Done", frontColor: palette.success },
                  { value: upcoming.length, label: "Soon", frontColor: palette.teal },
                  { value: overdue.length, label: "Late", frontColor: palette.danger },
                ]}
                height={118}
                barWidth={24}
                spacing={18}
                hideRules
                yAxisThickness={0}
                xAxisColor={palette.border}
              />
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
