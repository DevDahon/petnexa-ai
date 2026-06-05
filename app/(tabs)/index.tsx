import { Link } from "expo-router";
import { Bot, CalendarDays, Phone, Plus, ShieldCheck } from "lucide-react-native";
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
            <CalendarDays color={palette.warning} />
            <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{due.length}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Due Today</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <ShieldCheck color={palette.danger} />
            <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{overdue.length}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Overdue</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Plus color={palette.teal} />
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
                <Bot color={palette.teal} />
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
            <Phone color={palette.navy} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{primaryVet?.clinicName ?? "No veterinarian saved"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{primaryVet?.emergencyHotline ?? "Add a primary vet in Settings."}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
