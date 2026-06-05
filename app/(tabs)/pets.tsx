import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, GradientCard, IconBubble, PetAvatar, PrimaryButton, RowAction, Screen, ScreenIntro, SectionHeader, StatCard } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Pet, PetSpecies, Sex } from "@/types/domain";
import { calculateAge, getLifeStage, todayIso } from "@/utils/date";

const emptyPet = {
  name: "",
  species: "Dog" as PetSpecies,
  breed: "",
  sex: "Male" as Sex,
  birthday: "2024-01-01",
  weightKg: 1,
  color: "",
  microchipNumber: "",
  notes: "",
  photoUri: "",
  assignedVetId: "",
};

export default function PetsScreen() {
  const { pets, records, reminders, savePet, removePet } = useAppData();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const editing = useMemo(() => pets.find((pet) => pet.id === editingId), [editingId, pets]);

  const submit = async () => {
    if (!form.name.trim()) return Alert.alert("Pet name required", "Add a name before saving this pet.");
    await savePet({ ...form, id: editingId ?? undefined, weightKg: Number(form.weightKg) || 0 });
    setForm(emptyPet);
    setEditingId(null);
    setShowForm(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, photoUri: result.assets[0].uri }));
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission needed", "Allow camera access to take a pet profile photo.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, photoUri: result.assets[0].uri }));
  };

  const startEdit = (pet: Pet) => {
    setEditingId(pet.id);
    setShowForm(true);
    setForm({ ...pet, microchipNumber: pet.microchipNumber ?? "", photoUri: pet.photoUri ?? "", assignedVetId: pet.assignedVetId ?? "" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyPet);
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <ScreenIntro title="Pets" subtitle="Warm profiles for every companion in your care." icon="paw" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Pets" value={pets.length} icon="paw" />
          <StatCard label="Records" value={records.length} icon="clipboard-text-outline" tone="navy" />
          <StatCard label="Reminders" value={reminders.length} icon="calendar-clock" tone="warning" />
        </View>

        {!showForm ? <PrimaryButton label="Add Pet" icon="paw" onPress={() => setShowForm(true)} /> : null}

        {showForm ? (
          <>
            <SectionHeader title={editing ? `Edit ${editing.name}` : "Add Pet"} />
            <GradientCard variant="calm">
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(["Dog", "Cat", "Other"] as PetSpecies[]).map((species) => <Chip key={species} label={species} active={form.species === species} onPress={() => setForm((current) => ({ ...current, species }))} />)}
                {(["Male", "Female", "Unknown"] as Sex[]).map((sex) => <Chip key={sex} label={sex} active={form.sex === sex} onPress={() => setForm((current) => ({ ...current, sex }))} tone="navy" />)}
              </View>
              <Field label="Name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
              <Field label="Breed" value={form.breed} onChangeText={(breed) => setForm((current) => ({ ...current, breed }))} />
              <Field label="Birthday" value={form.birthday} onChangeText={(birthday) => setForm((current) => ({ ...current, birthday }))} placeholder={todayIso()} />
              <Text selectable style={{ color: palette.teal, fontWeight: "800" }}>{calculateAge(form.birthday)} • {getLifeStage(form.birthday, form.species)}</Text>
              <Field label="Weight (kg)" value={String(form.weightKg)} keyboardType="numeric" onChangeText={(weightKg) => setForm((current) => ({ ...current, weightKg: Number(weightKg) || 0 }))} />
              <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <GhostButton label="Gallery" onPress={pickImage} />
                <GhostButton label="Camera" onPress={takePhoto} />
                <PrimaryButton label={editing ? "Save" : "Add"} onPress={submit} />
                <GhostButton label="Cancel" onPress={closeForm} />
              </View>
            </GradientCard>
          </>
        ) : null}

        <SectionHeader title="Pet List" />
        {pets.length === 0 ? (
          <EmptyState title="No pets registered yet" message="Add a pet profile to start tracking records and reminders." actionLabel="Add Pet" onAction={() => setShowForm(true)} />
        ) : (
          pets.map((pet) => {
            const petRecords = records.filter((record) => record.petId === pet.id);
            const petReminders = reminders.filter((reminder) => reminder.petId === pet.id);
            return (
              <Card key={pet.id} style={{ backgroundColor: pet.species === "Cat" ? palette.softPeach : palette.softTeal }}>
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                    <PetAvatar pet={pet} size={104} />
                    <View style={{ flex: 1, gap: 7 }}>
                      <View>
                        <Text selectable style={{ color: palette.text, fontSize: 24, fontWeight: "900" }}>{pet.name}</Text>
                        <Text selectable style={{ color: palette.muted, fontSize: 14, fontWeight: "700" }}>{pet.breed || pet.species}</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                        <Chip label={pet.species} active tone={pet.species === "Cat" ? "warning" : "teal"} />
                        <Chip label={getLifeStage(pet.birthday, pet.species)} tone="navy" />
                        <Chip label={`${pet.weightKg} kg`} tone="peach" />
                      </View>
                      <Text selectable style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>{calculateAge(pet.birthday)}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <IconBubble icon="clipboard-text-outline" tone="navy" size={40} />
                    <Text selectable style={{ color: palette.muted, flex: 1, fontWeight: "700" }}>{petRecords.length} records • {petReminders.length} reminders</Text>
                    <RowAction icon="pencil-outline" onPress={() => startEdit(pet)} />
                    <RowAction icon="trash-can-outline" danger onPress={() => Alert.alert("Delete pet?", "This also removes linked records, reminders, and consultations.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removePet(pet.id) }])} />
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
