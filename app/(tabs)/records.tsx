import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, CompactButton, EmptyState, Field, FormActions, HeaderActionButton, HeaderAppIcon, IconBubble, PetAvatar, RowAction, Screen, SectionHeader } from "@/components/ui";
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

  const chooseAttachment = () => {
    Alert.alert("Record Attachment", "Choose an attachment source.", [
      { text: "Gallery", onPress: pickAttachment },
      { text: "Camera", onPress: captureAttachment },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const closeForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyRecord);
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900", flex: 1 }}>Records</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!showForm ? <HeaderActionButton label="Add record" icon="plus" onPress={() => setShowForm(true)} /> : null}
            <HeaderAppIcon size={46} />
          </View>
        </View>
        <Field label="Search records..." value={query} onChangeText={setQuery} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {quickFilters.map((type) => <Chip key={type} label={type} active={typeFilter === type} onPress={() => setTypeFilter(type)} tone={type === "All" ? "teal" : recordVisual(type).tone} />)}
        </ScrollView>

        {showForm ? (
          <>
            <SectionHeader title={editingId ? "Edit Record" : "Add Record"} />
            <Card>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8FBFD", borderRadius: 18, borderWidth: 1, borderColor: palette.border, padding: 10 }}>
                <IconBubble icon={form.attachmentUri ? "image-check-outline" : "image-plus"} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 15, fontWeight: "900" }}>Attachment</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{form.attachmentUri ? "Image attached to this record." : "Optional photo or document image."}</Text>
                </View>
                <CompactButton label={form.attachmentUri ? "Change" : "Add"} onPress={chooseAttachment} />
              </View>
              <FormActions submitLabel={editingId ? "Save" : "Add"} onSubmit={submit} onCancel={closeForm} />
            </Card>
          </>
        ) : null}

        <SectionHeader title="History" action={`${filtered.length} shown`} />

        {filtered.length === 0 ? (
          <EmptyState title="No records found" message="Try a different filter or add a new health record." icon="clipboard-search-outline" />
        ) : (
          filtered.slice(0, 12).map((record) => {
            const pet = pets.find((item) => item.id === record.petId);
            const visual = recordVisual(record.type);
            return (
              <Card key={record.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 5, alignSelf: "stretch", borderRadius: 99, backgroundColor: visual.tone === "danger" ? palette.danger : visual.tone === "warning" ? palette.warning : visual.tone === "navy" ? palette.navy : palette.teal }} />
                  <IconBubble icon={visual.icon} tone={visual.tone} size={54} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>{record.type}</Text>
                    <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}</Text>
                    <Text selectable style={{ color: palette.navy, fontSize: 12 }}>{record.clinic || "Clinic not set"}</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      <Chip label={record.type} tone={visual.tone} />
                      {record.attachmentUri ? <Chip label="Image" icon="image-outline" active tone="teal" /> : null}
                    </View>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <PetAvatar pet={pet} size={42} />
                    <View style={{ flexDirection: "row" }}>
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
