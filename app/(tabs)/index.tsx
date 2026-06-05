import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { BrandMark, Card, EmptyState, GradientCard, IconBubble, PetAvatar, PetCard, PrimaryButton, ReminderPill, Screen, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Pet } from "@/types/domain";
import { calculateAge, formatFriendlyDate, getLifeStage, getReminderStatus } from "@/utils/date";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function featuredPet(pets: Pet[], recordPetIds: string[]) {
  return pets.find((pet) => recordPetIds.includes(pet.id)) ?? pets[0];
}

export default function HomeScreen() {
  const { owner, pets, reminders, records, veterinarians, creditState } = useAppData();
  const due = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming").slice(0, 2);
  const nextReminder = [...due, ...upcoming][0];
  const primaryVet = veterinarians.find((vet) => vet.isPrimary) ?? veterinarians[0];
  const recordPetIds = records.slice(0, 4).map((record) => record.petId);
  const highlightedPet = featuredPet(pets, recordPetIds);
  const highlightedNext = highlightedPet ? reminders.find((item) => item.petId === highlightedPet.id && getReminderStatus(item) !== "Completed") : undefined;
  const weightTrend = pets.slice(0, 4).map((pet) => ({ value: pet.weightKg, label: pet.name.slice(0, 3) }));

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 104 }}>
        <GradientCard variant="primary">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <BrandMark compact />
              <Text selectable style={{ color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 0 }}>{greeting()}, {owner.fullName.split(" ")[0] || "Pet Parent"}</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.86)", lineHeight: 22, fontSize: 15 }}>You have {pets.length} pets and {due.length + overdue.length} care item{due.length + overdue.length === 1 ? "" : "s"} needing attention.</Text>
            </View>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 22, padding: 12, alignItems: "center", minWidth: 76 }}>
                <Text selectable style={{ color: "#fff", fontSize: 26, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{creditState.aiCredits}</Text>
                <Text selectable style={{ color: "rgba(255,255,255,0.86)", fontSize: 12, fontWeight: "800" }}>AI credits</Text>
              </View>
              <Link href="/ai-assistant" asChild>
                <PrimaryButton label="AI Check" icon="heart-pulse" onPress={() => {}} />
              </Link>
            </View>
          </View>
        </GradientCard>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Vaccines" value={records.filter((item) => item.type === "Vaccination").length} icon="needle" tone="teal" />
          <StatCard label="Deworming" value={records.filter((item) => item.type === "Deworming").length} icon="shield-bug-outline" tone="navy" />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Appointments" value={reminders.filter((item) => item.type === "Appointment").length} icon="calendar-heart" tone="warning" />
          <StatCard label="AI Credits" value={`${creditState.aiCredits}/3`} icon="robot-happy-outline" tone="peach" />
        </View>

        <SectionHeader title="Featured Pet" action={highlightedPet ? getLifeStage(highlightedPet.birthday, highlightedPet.species) : undefined} />
        {highlightedPet ? (
          <GradientCard variant="warm">
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              <PetAvatar pet={highlightedPet} size={118} />
              <View style={{ flex: 1, gap: 8 }}>
                <View>
                  <Text selectable style={{ color: palette.text, fontSize: 26, fontWeight: "900" }}>{highlightedPet.name}</Text>
                  <Text selectable style={{ color: palette.muted, fontWeight: "700" }}>{highlightedPet.breed || highlightedPet.species}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <View style={{ backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 12, fontWeight: "900" }}>{calculateAge(highlightedPet.birthday)}</Text>
                  </View>
                  <View style={{ backgroundColor: palette.softTeal, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>{highlightedPet.weightKg} kg</Text>
                  </View>
                </View>
                <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Next care: {highlightedNext ? formatFriendlyDate(highlightedNext.dueDate) : "No active schedule"}</Text>
              </View>
            </View>
          </GradientCard>
        ) : (
          <EmptyState title="No pets yet" message="Add your first pet to start tracking care." icon="paw" />
        )}

        <SectionHeader title="Pet Family" action={`${pets.length} profiles`} />
        {pets.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 6 }}>
            {pets.slice(0, 4).map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </ScrollView>
        ) : null}

        <SectionHeader title="Next Care" />
        {nextReminder ? (
          <Card style={{ backgroundColor: getReminderStatus(nextReminder) === "Due Today" ? palette.softYellow : palette.card }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconBubble icon="calendar-clock" tone={getReminderStatus(nextReminder) === "Due Today" ? "warning" : "teal"} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{nextReminder.title}</Text>
                <Text selectable style={{ color: palette.muted, fontWeight: "700" }}>{formatFriendlyDate(nextReminder.dueDate)}</Text>
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
                <IconBubble icon="clipboard-pulse-outline" tone="navy" />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}>{record.type}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}</Text>
                </View>
              </View>
            </Card>
          );
        })}

        <SectionHeader title="Health Snapshot" />
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 17 }}>Weight overview</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Current pet weights</Text>
            </View>
            <MaterialCommunityIcons name="chart-line" color={palette.teal} size={24} />
          </View>
          <LineChart
            data={weightTrend.length ? weightTrend : [{ value: 0 }]}
            height={104}
            spacing={48}
            color={palette.teal}
            thickness={3}
            hideDataPoints
            hideRules
            yAxisColor={palette.border}
            xAxisColor={palette.border}
          />
        </Card>

        <Card style={{ backgroundColor: palette.softNavy }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <IconBubble icon="phone-in-talk-outline" tone="navy" />
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>{primaryVet?.clinicName ?? "Emergency vet not set"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{primaryVet?.emergencyHotline ?? "Add a primary vet in Settings."}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
