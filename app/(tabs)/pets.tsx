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
  UndoBanner,
  useAppPalette,
  useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette, radii } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Pet, PetSpecies, Sex } from "@/types/domain";
import { calculateAge, formatCompactAge, getLifeStage, todayIso } from "@/utils/date";

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
  const pal = useAppPalette();
  const { pets, veterinarians, records, reminders, consultations, savePet, removePet, restorePetDeletion } = useAppData();
  const layout = useResponsiveLayout();
  const [form, setForm] = useState(emptyPet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState<{ message: string; onUndo: () => Promise<void> } | null>(null);
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

  const profileGaps = (pet: Pet, recordCount: number) => {
    const gaps = [];
    if (!pet.birthday) gaps.push("birthday");
    if (!pet.weightKg) gaps.push("weight");
    if (!pet.assignedVetId) gaps.push("vet");
    if (recordCount === 0) gaps.push("records");
    return gaps;
  };

  const deletePetWithUndo = (pet: Pet) => {
    const linkedRecords = records.filter((record) => record.petId === pet.id);
    const linkedReminders = reminders.filter((reminder) => reminder.petId === pet.id);
    const linkedConsultations = consultations.filter((consultation) => consultation.petId === pet.id);
    Alert.alert("Delete pet?", "This also removes linked records, care tasks, and consultations.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removePet(pet.id);
          setUndo({
            message: `${pet.name} deleted.`,
            onUndo: async () => restorePetDeletion({ pet, records: linkedRecords, reminders: linkedReminders, consultations: linkedConsultations }),
          });
        },
      },
    ]);
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

        {undo ? (
          <UndoBanner
            message={undo.message}
            onDismiss={() => setUndo(null)}
            onUndo={() => {
              undo.onUndo().catch(() => Alert.alert("Restore failed", "Could not restore this pet right now."));
              setUndo(null);
            }}
          />
        ) : null}

        {/* ── Summary Banner ── */}
        <GradientCard variant="calm">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <View style={{ flexShrink: 0 }}>
              <IconBubble icon="paw" size={54} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text selectable style={{ color: "#FFFFFF", fontSize: 20, fontFamily: fontFamily.black }}>
                {pets.length} pet {pets.length === 1 ? "profile" : "profiles"}
              </Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.88)", lineHeight: 20, fontFamily: fontFamily.medium, fontSize: 13 }}>
                Manage pet profiles & care notes.
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
                  backgroundColor: pal.background,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: pal.border,
                  padding: 12,
                }}
              >
                <PetAvatar pet={previewPet} size={layout.isCompact ? 56 : 62} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: pal.text, fontSize: 15, fontFamily: fontFamily.bold }}>
                    Profile photo
                  </Text>
                  <Text selectable style={{ color: pal.muted, fontSize: 13, fontFamily: fontFamily.medium }}>
                    {form.photoUri ? "Photo added to this pet profile." : "Optional — helps identify your pet faster."}
                  </Text>
                </View>
                <CompactButton label={form.photoUri ? "Change" : "Add"} onPress={choosePhoto} />
              </View>

              {/* Species & Sex */}
              <Text selectable style={{ color: pal.muted, fontSize: 13, fontFamily: fontFamily.bold }}>
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

              <View style={{ gap: 8 }}>
                <Text selectable style={{ color: pal.muted, fontSize: 13, fontFamily: fontFamily.bold }}>
                  Veterinarian
                </Text>
                {veterinarians.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <Chip
                      label="No vet"
                      active={!form.assignedVetId}
                      onPress={() => setForm((current) => ({ ...current, assignedVetId: "" }))}
                      tone="navy"
                    />
                    {veterinarians.map((vet) => (
                      <Chip
                        key={vet.id}
                        label={vet.clinicName}
                        active={form.assignedVetId === vet.id}
                        onPress={() => setForm((current) => ({ ...current, assignedVetId: vet.id }))}
                        tone={vet.isPrimary ? "teal" : "navy"}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text selectable style={{ color: pal.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                    Add a clinic in Settings to link this pet with a veterinarian.
                  </Text>
                )}
              </View>

              {/* Breed suggestions */}
              <View style={{ gap: 8 }}>
                <Text selectable style={{ color: pal.muted, fontSize: 13, fontFamily: fontFamily.bold }}>
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
              <Text selectable style={{ color: pal.teal, fontFamily: fontFamily.bold, fontSize: 13 }}>
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
            const gaps = profileGaps(pet, petRecords.length);
            const isCat = pet.species === "Cat";
            return (
              <Card key={pet.id} style={{ padding: 16 }}>
                <View style={{ gap: 14 }}>
                  {/* Header Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <PetAvatar pet={pet} size={layout.isCompact ? 60 : 64} />
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text
                          selectable
                          numberOfLines={1}
                          style={{ color: pal.text, fontSize: 20, fontFamily: fontFamily.black }}
                        >
                          {pet.name}
                        </Text>
                        <Chip
                          label={pet.species}
                          icon={pet.species === "Cat" ? "cat" : pet.species === "Dog" ? "dog" : "paw"}
                          tone={isCat ? "warning" : "teal"}
                          active
                        />
                      </View>
                      <Text
                        selectable
                        style={{ color: pal.muted, fontSize: 13, fontFamily: fontFamily.semiBold, lineHeight: 18 }}
                      >
                        {pet.breed || pet.species}
                      </Text>
                    </View>
                  </View>

                  {/* Spec Grid Bar */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-around",
                      backgroundColor: pal.backgroundAlt,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: pal.borderLight,
                      paddingVertical: 10,
                      paddingHorizontal: 6,
                    }}
                  >
                    <View style={{ alignItems: "center", flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ color: pal.muted, fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.5 }}>
                        AGE
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        style={{ color: pal.text, fontSize: 13, fontFamily: fontFamily.bold }}
                      >
                        {formatCompactAge(pet.birthday)}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 22, backgroundColor: pal.borderLight }} />

                    <View style={{ alignItems: "center", flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ color: pal.muted, fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.5 }}>
                        SEX
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        style={{ color: pal.text, fontSize: 13, fontFamily: fontFamily.bold }}
                      >
                        {pet.sex === "Female" ? "Female ♀" : "Male ♂"}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 22, backgroundColor: pal.borderLight }} />

                    <View style={{ alignItems: "center", flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ color: pal.muted, fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.5 }}>
                        WEIGHT
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        style={{ color: pal.text, fontSize: 13, fontFamily: fontFamily.bold }}
                      >
                        {pet.weightKg ? `${pet.weightKg} kg` : "N/A"}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 22, backgroundColor: pal.borderLight }} />

                    <View style={{ alignItems: "center", flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ color: pal.muted, fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.5 }}>
                        RECORDS
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        style={{ color: pal.teal, fontSize: 13, fontFamily: fontFamily.bold }}
                      >
                        {petRecords.length} {petRecords.length === 1 ? "entry" : "entries"}
                      </Text>
                    </View>
                  </View>

                  {/* Footer Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 2 }}>
                    <RowAction icon="pencil-outline" label={`Edit ${pet.name}`} onPress={() => startEdit(pet)} />
                    <RowAction
                      icon="trash-can-outline"
                      label={`Delete ${pet.name}`}
                      danger
                      onPress={() => deletePetWithUndo(pet)}
                    />
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
