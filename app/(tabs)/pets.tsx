import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import {
  Card,
  Chip,
  CompactButton,
  EmptyState,
  Field,
  FormActions,
  GradientCard,
  HeaderActionButton,
  IconBubble,
  PetAvatar,
  ResponsiveScrollView,
  RowAction,
  Screen,
  ScreenHeader,
  SectionHeader,
  useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette, radii } from "@/constants/theme";
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
  const layout = useResponsiveLayout();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const editing = useMemo(() => pets.find((pet) => pet.id === editingId), [editingId, pets]);
  const filteredPets = useMemo(
    () => pets.filter((pet) => `${pet.name} ${pet.breed} ${pet.species}`.toLowerCase().includes(query.toLowerCase())),
    [pets, query],
  );
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

  const choosePhoto = () => {
    Alert.alert("Pet Photo", "Choose a photo source.", [
      { text: "Gallery", onPress: pickImage },
      { text: "Camera", onPress: takePhoto },
      { text: "Cancel", style: "cancel" },
    ]);
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

  const previewPet: Pet = {
    ...form,
    id: editingId ?? "pet-preview",
    createdAt: todayIso(),
    sex: form.sex === "Female" ? "Female" : "Male",
    weightKg: Number(form.weightKg) || 0,
  };

  return (
    <Screen>
      <ResponsiveScrollView>
        {/* ── Header ── */}
        <ScreenHeader
          title="Pets"
          subtitle="Profiles, life stages & care history"
          right={
            <HeaderActionButton
              icon="cog-outline"
              label="Open settings"
              active
              onPress={() => router.push("/settings")}
            />
          }
        />

        {/* ── Summary Banner ── */}
        <GradientCard variant="calm">
          <View
            style={{
              flexDirection: layout.shouldStack ? "column" : "row",
              alignItems: layout.shouldStack ? "flex-start" : "center",
              gap: 14,
            }}
          >
            <IconBubble icon="paw" size={58} />
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text selectable style={{ color: palette.text, fontSize: 20, fontFamily: fontFamily.black }}>
                {pets.length} pet {pets.length === 1 ? "profile" : "profiles"}
              </Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20, fontFamily: fontFamily.medium, fontSize: 13 }}>
                Keep each pet's identity, health notes, and care activity in one place.
              </Text>
              <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
                <Chip label={`${dogCount} dogs`} icon="dog" active={dogCount > 0} />
                <Chip label={`${catCount} cats`} icon="cat" tone="warning" />
                <Chip label={`${records.length} records`} tone="navy" />
              </View>
            </View>
          </View>
        </GradientCard>

        {/* ── Search ── */}
        <Field label="Search pets..." value={query} onChangeText={setQuery} />

        {/* ── Add/Edit Form ── */}
        {showForm ? (
          <>
            <SectionHeader title={editing ? `Edit ${editing.name}` : "Add Pet"} />
            <Card>
              {/* Photo row */}
              <View
                style={{
                  flexDirection: layout.isCompact ? "column" : "row",
                  alignItems: layout.isCompact ? "flex-start" : "center",
                  gap: 12,
                  backgroundColor: palette.background,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: 12,
                }}
              >
                <PetAvatar pet={previewPet} size={layout.isCompact ? 56 : 62} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.bold }}>
                    Profile photo
                  </Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.medium }}>
                    {form.photoUri ? "Photo added to this pet profile." : "Optional — helps identify your pet faster."}
                  </Text>
                </View>
                <CompactButton label={form.photoUri ? "Change" : "Add"} onPress={choosePhoto} />
              </View>

              {/* Species & Sex */}
              <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.bold }}>
                Species & Sex
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(["Dog", "Cat", "Other"] as PetSpecies[]).map((species) => (
                  <Chip
                    key={species}
                    label={species}
                    active={form.species === species}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        species,
                        breed: current.breed && !breedSuggestions[current.species].includes(current.breed) ? current.breed : "",
                      }))
                    }
                  />
                ))}
                {(["Male", "Female"] as Sex[]).map((sex) => (
                  <Chip
                    key={sex}
                    label={sex}
                    active={form.sex === sex}
                    onPress={() => setForm((current) => ({ ...current, sex }))}
                    tone="navy"
                  />
                ))}
              </View>

              <Field label="Name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
              <Field label="Breed" value={form.breed} onChangeText={(breed) => setForm((current) => ({ ...current, breed }))} />

              {/* Breed suggestions */}
              <View style={{ gap: 8 }}>
                <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.bold }}>
                  Common {form.species === "Other" ? "pet types" : `${form.species.toLowerCase()} breeds`}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {breedSuggestions[form.species].map((breed) => (
                    <Chip
                      key={breed}
                      label={breed}
                      active={form.breed === breed}
                      onPress={() => setForm((current) => ({ ...current, breed }))}
                      tone="teal"
                    />
                  ))}
                </ScrollView>
              </View>

              <Field
                label="Birthday"
                value={form.birthday}
                onChangeText={(birthday) => setForm((current) => ({ ...current, birthday }))}
                placeholder={todayIso()}
              />
              <Text selectable style={{ color: palette.teal, fontFamily: fontFamily.bold, fontSize: 13 }}>
                {calculateAge(form.birthday)} • {getLifeStage(form.birthday, form.species)}
              </Text>
              <Field
                label="Weight (kg)"
                value={String(form.weightKg)}
                keyboardType="numeric"
                onChangeText={(weightKg) => setForm((current) => ({ ...current, weightKg: Number(weightKg) || 0 }))}
              />
              <Field
                label="Notes"
                value={form.notes}
                multiline
                onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
              />
              <FormActions submitLabel={editing ? "Save" : "Add Pet"} onSubmit={submit} onCancel={closeForm} />
            </Card>
          </>
        ) : null}

        {/* ── Pet List ── */}
        <SectionHeader
          title="Pet Profiles"
          action={`${filteredPets.length} shown`}
          rightNode={
            !showForm ? <CompactButton label="Add Pet" icon="plus" primary onPress={() => setShowForm(true)} /> : undefined
          }
        />
        {filteredPets.length === 0 ? (
          <EmptyState
            title="No pets registered yet"
            message="Add a pet profile to start tracking records and care tasks."
            actionLabel="Add Pet"
            onAction={() => setShowForm(true)}
          />
        ) : (
          filteredPets.map((pet) => {
            const petRecords = records.filter((record) => record.petId === pet.id);
            const petReminders = reminders.filter((reminder) => reminder.petId === pet.id);
            const isCat = pet.species === "Cat";
            return (
              <Card
                key={pet.id}
                style={{
                  backgroundColor: isCat ? palette.softPeach : "#fff",
                  borderColor: isCat ? "#FFE1CC" : palette.borderLight,
                }}
              >
                <View style={{ gap: 14, minHeight: layout.isCompact ? 168 : 154, position: "relative" }}>
                  <View style={{ position: "absolute", top: 0, right: 0, zIndex: 1, alignItems: "flex-end" }}>
                    <Chip label={`${petRecords.length} records`} tone="navy" />
                  </View>
                  <View style={{ paddingRight: layout.isTiny ? 88 : 98 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
                      <PetAvatar pet={pet} size={layout.isCompact ? 76 : 84} />
                      <View style={{ flex: 1, minWidth: 0, gap: 5, paddingTop: layout.isCompact ? 8 : 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "nowrap" }}>
                          <Text
                            selectable
                            numberOfLines={1}
                            style={{ color: palette.text, fontSize: 19, lineHeight: 24, fontFamily: fontFamily.black, flexShrink: 1 }}
                          >
                            {pet.name}
                          </Text>
                          <MaterialCommunityIcons
                            name={pet.species === "Cat" ? "cat" : pet.species === "Dog" ? "dog" : "paw"}
                            color={isCat ? palette.peach : palette.teal}
                            size={18}
                          />
                        </View>
                        <Text selectable numberOfLines={1} style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.medium }}>
                          {pet.breed || pet.species}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
                          <Text
                            selectable
                            numberOfLines={1}
                            style={{ color: palette.navy, fontSize: 13, lineHeight: 18, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"], flexShrink: 1 }}
                          >
                            {calculateAge(pet.birthday)}
                          </Text>
                          <Text selectable style={{ color: palette.navy, fontSize: 13, lineHeight: 18, fontFamily: fontFamily.bold }}>
                            •
                          </Text>
                          <Text
                            selectable
                            numberOfLines={1}
                            style={{ color: palette.navy, fontSize: 13, lineHeight: 18, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"], flexShrink: 0 }}
                          >
                            {pet.sex} • {pet.weightKg} kg
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: layout.isTiny ? "column" : "row",
                      alignItems: layout.isTiny ? "stretch" : "flex-end",
                      justifyContent: "space-between",
                      gap: 12,
                      marginTop: "auto",
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 }}>
                      <Chip label={getLifeStage(pet.birthday, pet.species)} active tone="teal" />
                      <Chip label={`${petReminders.length} care`} tone="warning" />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        alignSelf: "flex-end",
                        flexShrink: 0,
                      }}
                    >
                      <RowAction icon="pencil-outline" label={`Edit ${pet.name}`} onPress={() => startEdit(pet)} />
                      <RowAction
                        icon="trash-can-outline"
                        label={`Delete ${pet.name}`}
                        danger
                        onPress={() =>
                          Alert.alert("Delete pet?", "This also removes linked records, care tasks, and consultations.", [
                            { text: "Cancel" },
                            { text: "Delete", style: "destructive", onPress: () => removePet(pet.id) },
                          ])
                        }
                      />
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ResponsiveScrollView>
    </Screen>
  );
}
