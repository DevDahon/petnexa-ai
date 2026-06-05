import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, IconBubble, PetAvatar, PrimaryButton, RowAction, Screen, ScreenIntro, SectionHeader, StatCard, TimelineRail } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { HealthRecord, RecordType } from "@/types/domain";
import { formatFriendlyDate, todayIso } from "@/utils/date";

const recordTypes: RecordType[] = ["Vaccination", "Deworming", "Medication", "Surgery", "Checkup", "Grooming", "Allergy", "Lab Test", "Other"];
const quickFilters: (RecordType | "All")[] = ["All", "Vaccination", "Deworming", "Medication", "Checkup"];

const emptyRecord = {
  petId: "",
  type: "Vaccination" as RecordType,
  date: todayIso(),
  veterinarian: "",
  clinic: "",
  notes: "",
  attachmentUri: "",
  nextScheduleDate: "",
};

function recordVisual(type: RecordType) {
  if (type === "Vaccination") return { icon: "needle" as const, tone: "teal" as const };
  if (type === "Deworming") return { icon: "shield-bug-outline" as const, tone: "navy" as const };
  if (type === "Medication") return { icon: "pill" as const, tone: "warning" as const };
  if (type === "Checkup") return { icon: "stethoscope" as const, tone: "success" as const };
  if (type === "Surgery") return { icon: "hospital-box-outline" as const, tone: "danger" as const };
  return { icon: "clipboard-pulse-outline" as const, tone: "peach" as const };
}

export default function RecordsScreen() {
  const { pets, records, saveRecord, removeRecord } = useAppData();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecordType | "All">("All");
  const [form, setForm] = useState(emptyRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const filtered = useMemo(() => records.filter((record) => {
    const pet = pets.find((item) => item.id === record.petId);
    const text = `${record.type} ${record.veterinarian} ${record.clinic} ${record.notes} ${pet?.name}`.toLowerCase();
    return (typeFilter === "All" || record.type === typeFilter) && text.includes(query.toLowerCase());
  }), [pets, query, records, typeFilter]);

  const submit = async () => {
    const petId = form.petId || pets[0]?.id;
    if (!petId) return Alert.alert("Add a pet first", "Health records must be linked to a pet.");
    await saveRecord({ ...form, id: editingId ?? undefined, petId, nextScheduleDate: form.nextScheduleDate || undefined, attachmentUri: form.attachmentUri || undefined });
    setForm(emptyRecord);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setShowForm(true);
    setForm({ ...record, attachmentUri: record.attachmentUri ?? "", nextScheduleDate: record.nextScheduleDate ?? "" });
  };

  const pickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, attachmentUri: result.assets[0].uri }));
  };

  const captureAttachment = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission needed", "Allow camera access to capture a record attachment.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, attachmentUri: result.assets[0].uri }));
  };

  const closeForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyRecord);
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <ScreenIntro title="Records" subtitle="A clear medical timeline for every pet." icon="clipboard-text-outline" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Total" value={records.length} icon="clipboard-list-outline" />
          <StatCard label="Vaccines" value={records.filter((item) => item.type === "Vaccination").length} icon="needle" tone="navy" />
          <StatCard label="Follow-ups" value={records.filter((item) => item.nextScheduleDate).length} icon="calendar-plus" tone="warning" />
        </View>

        {!showForm ? <PrimaryButton label="Add Record" icon="clipboard-plus-outline" onPress={() => setShowForm(true)} /> : null}

        {showForm ? (
          <>
            <SectionHeader title={editingId ? "Edit Record" : "Add Record"} />
            <GradientCard variant="calm">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {pets.map((pet) => <Chip key={pet.id} label={pet.name} active={(form.petId || pets[0]?.id) === pet.id} onPress={() => setForm((current) => ({ ...current, petId: pet.id }))} />)}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {recordTypes.map((type) => <Chip key={type} label={type} active={form.type === type} onPress={() => setForm((current) => ({ ...current, type }))} />)}
              </ScrollView>
              <Field label="Date" value={form.date} onChangeText={(date) => setForm((current) => ({ ...current, date }))} />
              <Field label="Clinic" value={form.clinic} onChangeText={(clinic) => setForm((current) => ({ ...current, clinic }))} />
              <Field label="Next Schedule" value={form.nextScheduleDate} onChangeText={(nextScheduleDate) => setForm((current) => ({ ...current, nextScheduleDate }))} />
              <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
              {form.attachmentUri ? <Text selectable style={{ color: palette.teal, fontWeight: "800" }}>Attachment added</Text> : null}
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <GhostButton label="Gallery" onPress={pickAttachment} />
                <GhostButton label="Camera" onPress={captureAttachment} />
                <PrimaryButton label={editingId ? "Save" : "Add"} onPress={submit} />
                <GhostButton label="Cancel" onPress={closeForm} />
              </View>
            </GradientCard>
          </>
        ) : null}

        <SectionHeader title="Medical Timeline" action={`${filtered.length} shown`} />
        <Card style={{ backgroundColor: palette.softNavy }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <IconBubble icon="magnify" tone="navy" />
            <View style={{ flex: 1 }}>
              <Field label="Search Records" value={query} onChangeText={setQuery} placeholder="Pet, type, clinic, notes" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {quickFilters.map((type) => <Chip key={type} label={type} active={typeFilter === type} onPress={() => setTypeFilter(type)} tone={type === "All" ? "teal" : recordVisual(type).tone} />)}
          </ScrollView>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState title="No records found" message="Try a different filter or add a new health record." icon="clipboard-search-outline" />
        ) : (
          filtered.slice(0, 12).map((record) => {
            const pet = pets.find((item) => item.id === record.petId);
            const visual = recordVisual(record.type);
            return (
              <Card key={record.id}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TimelineRail tone={visual.tone} />
                  <View style={{ flex: 1, gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <IconBubble icon={visual.icon} tone={visual.tone} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{record.type}</Text>
                        <Text selectable style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>{formatFriendlyDate(record.date)}</Text>
                      </View>
                      <PetAvatar pet={pet} size={46} />
                    </View>
                    <View style={{ backgroundColor: "#F8FBFD", borderRadius: 18, padding: 12, gap: 4 }}>
                      <Text selectable style={{ color: palette.text, fontSize: 14, fontWeight: "900" }}>{pet?.name ?? "Pet"}</Text>
                      <Text selectable style={{ color: palette.muted, fontSize: 13 }}>{record.clinic || "Clinic not set"}</Text>
                      {record.attachmentUri ? <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>Image attached</Text> : null}
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                      <RowAction icon="pencil-outline" onPress={() => startEdit(record)} />
                      <RowAction icon="trash-can-outline" danger onPress={() => Alert.alert("Delete record?", "Linked reminder will also be removed.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeRecord(record.id) }])} />
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
