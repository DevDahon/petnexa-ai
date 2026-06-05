import * as ImagePicker from "expo-image-picker";
import { Edit3, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, PetAvatar, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
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
  const { pets, veterinarians, records, reminders, savePet, removePet } = useAppData();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => pets.find((pet) => pet.id === editingId), [editingId, pets]);

  const submit = async () => {
    if (!form.name.trim()) return Alert.alert("Pet name required", "Add a name before saving this pet.");
    await savePet({ ...form, id: editingId ?? undefined, weightKg: Number(form.weightKg) || 0 });
    setForm(emptyPet);
    setEditingId(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm((current) => ({ ...current, photoUri: result.assets[0].uri }));
  };

  const startEdit = (pet: Pet) => {
    setEditingId(pet.id);
    setForm({ ...pet, microchipNumber: pet.microchipNumber ?? "", photoUri: pet.photoUri ?? "", assignedVetId: pet.assignedVetId ?? "" });
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <SectionHeader title="Pet Profiles" action={`${pets.length} total`} />
        {pets.map((pet) => {
          const petRecords = records.filter((record) => record.petId === pet.id);
          const petReminders = reminders.filter((reminder) => reminder.petId === pet.id);
          return (
            <Card key={pet.id}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <PetAvatar pet={pet} size={90} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{pet.name}</Text>
                  <Text selectable style={{ color: palette.muted }}>{pet.breed} • {pet.sex}</Text>
                  <Text selectable style={{ color: palette.text }}>{calculateAge(pet.birthday)} • {getLifeStage(pet.birthday, pet.species)}</Text>
                  <Text selectable style={{ color: palette.muted }}>{pet.weightKg} kg • {petRecords.length} records • {petReminders.length} reminders</Text>
                </View>
              </View>
              <Text selectable style={{ color: palette.muted }}>{pet.notes || "No notes yet."}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <GhostButton label="Edit" onPress={() => startEdit(pet)} />
                <GhostButton label="Delete" danger onPress={() => Alert.alert("Delete pet?", "This also removes linked records, reminders, and consultations.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removePet(pet.id) }])} />
              </View>
            </Card>
          );
        })}

        <SectionHeader title={editing ? `Edit ${editing.name}` : "Add Pet"} />
        <Card>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {(["Dog", "Cat", "Other"] as PetSpecies[]).map((species) => <Chip key={species} label={species} active={form.species === species} onPress={() => setForm((current) => ({ ...current, species }))} />)}
            {(["Male", "Female", "Unknown"] as Sex[]).map((sex) => <Chip key={sex} label={sex} active={form.sex === sex} onPress={() => setForm((current) => ({ ...current, sex }))} tone="navy" />)}
          </View>
          <Field label="Name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
          <Field label="Breed" value={form.breed} onChangeText={(breed) => setForm((current) => ({ ...current, breed }))} />
          <Field label="Birthday (YYYY-MM-DD)" value={form.birthday} onChangeText={(birthday) => setForm((current) => ({ ...current, birthday }))} placeholder={todayIso()} />
          <Text selectable style={{ color: palette.teal, fontWeight: "800" }}>{calculateAge(form.birthday)} • {getLifeStage(form.birthday, form.species)}</Text>
          <Field label="Weight (kg)" value={String(form.weightKg)} keyboardType="numeric" onChangeText={(weightKg) => setForm((current) => ({ ...current, weightKg: Number(weightKg) || 0 }))} />
          <Field label="Color" value={form.color} onChangeText={(color) => setForm((current) => ({ ...current, color }))} />
          <Field label="Microchip Number" value={form.microchipNumber} onChangeText={(microchipNumber) => setForm((current) => ({ ...current, microchipNumber }))} />
          <Field label="Notes" value={form.notes} multiline onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <GhostButton label="Choose Photo" onPress={pickImage} />
            <PrimaryButton label={editing ? "Save Pet" : "Add Pet"} onPress={submit} />
            {editing ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(emptyPet); }} /> : null}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
