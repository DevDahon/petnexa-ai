import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GhostButton, IconBubble, PetAvatar, PrimaryButton, RowAction, Screen, SectionHeader } from "@/components/ui";
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

const breedSuggestions: Record<PetSpecies, string[]> = {
  Dog: ["Golden Retriever", "Labrador Retriever", "Beagle", "Poodle", "Shih Tzu", "German Shepherd", "Chihuahua", "Mixed Breed"],
  Cat: ["Persian Cat", "Siamese", "Maine Coon", "British Shorthair", "Ragdoll", "Bengal", "Domestic Shorthair", "Mixed Breed"],
  Other: ["Rabbit", "Hamster", "Guinea Pig", "Bird", "Turtle", "Fish", "Ferret", "Other"],
};

export default function PetsScreen() {
  const { pets, records, reminders, savePet, removePet } = useAppData();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const editing = useMemo(() => pets.find((pet) => pet.id === editingId), [editingId, pets]);
  const filteredPets = useMemo(() => pets.filter((pet) => `${pet.name} ${pet.breed} ${pet.species}`.toLowerCase().includes(query.toLowerCase())), [pets, query]);

  const submit = async () => {
    if (!form.name.trim()) return Alert.alert("Pet name required", "Add a name before saving this pet.");
    await savePet({ ...form, id: editingId ?? undefined, sex: form.sex === "Female" ? "Female" : "Male", weightKg: Number(form.weightKg) || 0 });
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
    setForm({ ...pet, sex: pet.sex === "Female" ? "Female" : "Male", microchipNumber: pet.microchipNumber ?? "", photoUri: pet.photoUri ?? "", assignedVetId: pet.assignedVetId ?? "" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyPet);
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Pets</Text>
          {!showForm ? <IconBubble icon="plus" size={42} /> : null}
        </View>
        <Field label="Search pets..." value={query} onChangeText={setQuery} />

        {!showForm ? <PrimaryButton label="Add Pet" icon="paw" onPress={() => setShowForm(true)} /> : null}

        {showForm ? (
          <>
            <SectionHeader title={editing ? `Edit ${editing.name}` : "Add Pet"} />
            <Card>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(["Dog", "Cat", "Other"] as PetSpecies[]).map((species) => <Chip key={species} label={species} active={form.species === species} onPress={() => setForm((current) => ({ ...current, species, breed: current.breed && !breedSuggestions[current.species].includes(current.breed) ? current.breed : "" }))} />)}
                {(["Male", "Female"] as Sex[]).map((sex) => <Chip key={sex} label={sex} active={form.sex === sex} onPress={() => setForm((current) => ({ ...current, sex }))} tone="navy" />)}
              </View>
              <Field label="Name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
              <Field label="Breed" value={form.breed} onChangeText={(breed) => setForm((current) => ({ ...current, breed }))} />
              <View style={{ gap: 8 }}>
                <Text selectable style={{ color: palette.muted, fontSize: 12, fontWeight: "800" }}>Common {form.species === "Other" ? "pet types" : `${form.species.toLowerCase()} breeds`}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {breedSuggestions[form.species].map((breed) => (
                    <Chip key={breed} label={breed} active={form.breed === breed} onPress={() => setForm((current) => ({ ...current, breed }))} tone="teal" />
                  ))}
                </ScrollView>
              </View>
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
            </Card>
          </>
        ) : null}

        {filteredPets.length === 0 ? (
          <EmptyState title="No pets registered yet" message="Add a pet profile to start tracking records and reminders." actionLabel="Add Pet" onAction={() => setShowForm(true)} />
        ) : (
          filteredPets.map((pet) => {
            const petRecords = records.filter((record) => record.petId === pet.id);
            const petReminders = reminders.filter((reminder) => reminder.petId === pet.id);
            return (
              <Card key={pet.id}>
                <View style={{ flexDirection: "row", gap: 13, alignItems: "center" }}>
                  <PetAvatar pet={pet} size={78} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>{pet.name}</Text>
                    <Text selectable style={{ color: palette.muted, fontSize: 13 }}>{pet.breed || pet.species}</Text>
                    <Text selectable style={{ color: palette.navy, fontSize: 12 }}>{calculateAge(pet.birthday)} • {pet.weightKg} kg</Text>
                    <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>{petRecords.length} records • {petReminders.length} reminders</Text>
                  </View>
                  <View>
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
