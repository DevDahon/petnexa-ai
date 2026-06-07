import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Card, Chip, EmptyState, Field, GradientCard, HeaderAppIcon, IconBubble, PetAvatar, RowAction, Screen, SectionHeader } from "@/components/ui";
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

function CompactPetButton({
  label,
  icon,
  onPress,
  primary,
  danger,
  iconOnly,
  quiet,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  iconOnly?: boolean;
  quiet?: boolean;
}) {
  const color = danger ? palette.danger : primary ? palette.teal : palette.navy;
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
      <View style={{ width: iconOnly ? 40 : undefined, minWidth: iconOnly ? 40 : undefined, minHeight: 40, borderRadius: iconOnly ? 15 : 999, borderWidth: quiet ? 0 : 1.2, borderColor: primary ? palette.teal : danger ? "#FECACA" : palette.border, backgroundColor: primary ? palette.teal : iconOnly ? "#F8FBFD" : "#fff", paddingHorizontal: iconOnly ? 0 : quiet ? 8 : 13, paddingVertical: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <MaterialCommunityIcons name={icon} size={15} color={primary ? "#fff" : color} />
        {!iconOnly ? <Text selectable style={{ color: primary ? "#fff" : color, fontSize: 12, fontWeight: "900" }}>{label}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function PetsScreen() {
  const { pets, records, reminders, savePet, removePet } = useAppData();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const editing = useMemo(() => pets.find((pet) => pet.id === editingId), [editingId, pets]);
  const filteredPets = useMemo(() => pets.filter((pet) => `${pet.name} ${pet.breed} ${pet.species}`.toLowerCase().includes(query.toLowerCase())), [pets, query]);
  const dogCount = pets.filter((pet) => pet.species === "Dog").length;
  const catCount = pets.filter((pet) => pet.species === "Cat").length;

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
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Pets</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 13 }}>Profiles, life stages, and care history.</Text>
          </View>
          <HeaderAppIcon size={46} />
        </View>

        <GradientCard variant="calm">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <IconBubble icon="paw" size={58} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text selectable style={{ color: palette.text, fontSize: 21, fontWeight: "900" }}>{pets.length} pet profiles</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Keep each pet's identity, health notes, and care activity in one place.</Text>
              <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
                <Chip label={`${dogCount} dogs`} icon="dog" active={dogCount > 0} />
                <Chip label={`${catCount} cats`} icon="cat" tone="warning" />
                <Chip label={`${records.length} records`} tone="navy" />
              </View>
            </View>
          </View>
        </GradientCard>

        <Field label="Search pets..." value={query} onChangeText={setQuery} />

        {!showForm ? (
          <View style={{ alignItems: "flex-end" }}>
            <CompactPetButton label="Add Pet" icon="paw" primary onPress={() => setShowForm(true)} />
          </View>
        ) : null}

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
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 4 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <CompactPetButton label="Choose from gallery" icon="image-outline" iconOnly onPress={pickImage} />
                  <CompactPetButton label="Take pet photo" icon="camera-outline" iconOnly onPress={takePhoto} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <CompactPetButton label="Cancel" icon="close" danger quiet onPress={closeForm} />
                  <CompactPetButton label={editing ? "Save" : "Add"} icon={editing ? "content-save-outline" : "plus"} primary onPress={submit} />
                </View>
              </View>
            </Card>
          </>
        ) : null}

        <SectionHeader title="Pet Profiles" action={`${filteredPets.length} shown`} />
        {filteredPets.length === 0 ? (
          <EmptyState title="No pets registered yet" message="Add a pet profile to start tracking records and reminders." actionLabel="Add Pet" onAction={() => setShowForm(true)} />
        ) : (
          filteredPets.map((pet) => {
            const petRecords = records.filter((record) => record.petId === pet.id);
            const petReminders = reminders.filter((reminder) => reminder.petId === pet.id);
            return (
              <Card key={pet.id} style={{ backgroundColor: pet.species === "Cat" ? palette.softPeach : "#fff", borderColor: pet.species === "Cat" ? "#FFE1CC" : "#E8EEF4" }}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", gap: 13, alignItems: "center" }}>
                    <PetAvatar pet={pet} size={82} />
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <Text selectable style={{ color: palette.text, fontSize: 19, fontWeight: "900" }}>{pet.name}</Text>
                        <MaterialCommunityIcons name={pet.species === "Cat" ? "cat" : pet.species === "Dog" ? "dog" : "paw"} color={palette.teal} size={18} />
                      </View>
                      <Text selectable style={{ color: palette.muted, fontSize: 13 }}>{pet.breed || pet.species}</Text>
                      <Text selectable style={{ color: palette.navy, fontSize: 12, fontWeight: "800" }}>{calculateAge(pet.birthday)} • {pet.weightKg} kg</Text>
                    </View>
                    <View>
                      <RowAction icon="pencil-outline" onPress={() => startEdit(pet)} />
                      <RowAction icon="trash-can-outline" danger onPress={() => Alert.alert("Delete pet?", "This also removes linked records, reminders, and consultations.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removePet(pet.id) }])} />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    <Chip label={getLifeStage(pet.birthday, pet.species)} active tone="teal" />
                    <Chip label={`${petRecords.length} records`} tone="navy" />
                    <Chip label={`${petReminders.length} care`} tone="warning" />
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
