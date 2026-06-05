import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, PetAvatar, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { HealthRecord, RecordType } from "@/types/domain";
import { formatFriendlyDate, todayIso } from "@/utils/date";

const recordTypes: RecordType[] = ["Vaccination", "Deworming", "Medication", "Surgery", "Checkup", "Grooming", "Allergy", "Lab Test", "Other"];

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

export default function RecordsScreen() {
  const { pets, records, saveRecord, removeRecord } = useAppData();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecordType | "All">("All");
  const [form, setForm] = useState(emptyRecord);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  };

  const startEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setForm({ ...record, attachmentUri: record.attachmentUri ?? "", nextScheduleDate: record.nextScheduleDate ?? "" });
  };

  const pickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, attachmentUri: result.assets[0].uri }));
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <SectionHeader title="Health Records" action={`${filtered.length} shown`} />
        <Field label="Search" value={query} onChangeText={setQuery} placeholder="Pet, vet, record type, notes" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="All" active={typeFilter === "All"} onPress={() => setTypeFilter("All")} />
          {recordTypes.map((type) => <Chip key={type} label={type} active={typeFilter === type} onPress={() => setTypeFilter(type)} />)}
        </ScrollView>

        {filtered.map((record) => {
          const pet = pets.find((item) => item.id === record.petId);
          return (
            <Card key={record.id}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <PetAvatar pet={pet} size={58} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>{record.type}</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}</Text>
                  <Text selectable style={{ color: palette.text }}>{record.clinic || "No clinic"} • {record.veterinarian || "No vet"}</Text>
                  {record.nextScheduleDate ? <Text selectable style={{ color: palette.teal, fontWeight: "800" }}>Next: {formatFriendlyDate(record.nextScheduleDate)}</Text> : null}
                  <Text selectable style={{ color: palette.muted }}>{record.notes || "No notes."}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <GhostButton label="Edit" onPress={() => startEdit(record)} />
                <GhostButton label="Delete" danger onPress={() => Alert.alert("Delete record?", "Linked reminder will also be removed.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeRecord(record.id) }])} />
              </View>
            </Card>
          );
        })}

        <SectionHeader title={editingId ? "Edit Record" : "Add Record"} />
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {pets.map((pet) => <Chip key={pet.id} label={pet.name} active={(form.petId || pets[0]?.id) === pet.id} onPress={() => setForm((current) => ({ ...current, petId: pet.id }))} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {recordTypes.map((type) => <Chip key={type} label={type} active={form.type === type} onPress={() => setForm((current) => ({ ...current, type }))} />)}
          </ScrollView>
          <Field label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(date) => setForm((current) => ({ ...current, date }))} />
          <Field label="Veterinarian" value={form.veterinarian} onChangeText={(veterinarian) => setForm((current) => ({ ...current, veterinarian }))} />
          <Field label="Clinic" value={form.clinic} onChangeText={(clinic) => setForm((current) => ({ ...current, clinic }))} />
          <Field label="Next Schedule (optional YYYY-MM-DD)" value={form.nextScheduleDate} onChangeText={(nextScheduleDate) => setForm((current) => ({ ...current, nextScheduleDate }))} />
          <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <GhostButton label="Attach Image" onPress={pickAttachment} />
            <PrimaryButton label={editingId ? "Save Record" : "Add Record"} onPress={submit} />
            {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(emptyRecord); }} /> : null}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
