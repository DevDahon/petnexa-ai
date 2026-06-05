import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, ScrollView, Switch, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, PrimaryButton, RowAction, Screen, ScreenIntro, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Veterinarian } from "@/types/domain";

const emptyVet = {
  clinicName: "",
  veterinarianName: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  emergencyHotline: "",
  hours: "",
  notes: "",
  isPrimary: false,
};

type Section = "profile" | "vets" | "data" | "about";

export default function SettingsScreen() {
  const { owner, settings, veterinarians, creditState, saveOwner, saveVet, removeVet, updateSettings, exportData, restoreDataReplaceMode } = useAppData();
  const [section, setSection] = useState<Section>("profile");
  const [ownerForm, setOwnerForm] = useState(owner);
  const [vetForm, setVetForm] = useState(emptyVet);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);
  const [showVetForm, setShowVetForm] = useState(false);

  const submitOwner = async () => {
    await saveOwner(ownerForm);
    Alert.alert("Owner profile saved");
  };

  const submitVet = async () => {
    if (!vetForm.clinicName.trim()) return Alert.alert("Clinic name required");
    await saveVet({ ...vetForm, id: editingVetId ?? undefined });
    setVetForm(emptyVet);
    setEditingVetId(null);
    setShowVetForm(false);
  };

  const editVet = (vet: Veterinarian) => {
    setEditingVetId(vet.id);
    setVetForm(vet);
    setShowVetForm(true);
  };

  const exportBackup = async () => {
    const uri = await exportData();
    Alert.alert("Backup exported", uri);
  };

  const restoreBackup = async () => {
    try {
      await restoreDataReplaceMode();
      Alert.alert("Restore complete", "Local data was replaced by the selected backup.");
    } catch (error) {
      if (error instanceof Error && error.message === "Restore cancelled.") return;
      Alert.alert("Restore failed", error instanceof Error ? error.message : "The backup could not be restored.");
    }
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        <ScreenIntro title="Settings" subtitle="Manage account, vets, privacy, and backup tools." icon="cog-outline" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Profile" active={section === "profile"} onPress={() => setSection("profile")} />
          <Chip label="Vets" active={section === "vets"} onPress={() => setSection("vets")} />
          <Chip label="Data" active={section === "data"} onPress={() => setSection("data")} />
          <Chip label="About" active={section === "about"} onPress={() => setSection("about")} />
        </ScrollView>

        {section === "profile" ? (
          <>
            <SectionHeader title="Owner Profile" />
            <Card>
              <Field label="Full Name" value={ownerForm.fullName} onChangeText={(fullName) => setOwnerForm((current) => ({ ...current, fullName }))} />
              <Field label="Phone" value={ownerForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setOwnerForm((current) => ({ ...current, phone }))} />
              <Field label="Email" value={ownerForm.email} keyboardType="email-address" onChangeText={(email) => setOwnerForm((current) => ({ ...current, email }))} />
              <Field label="Emergency Contact" value={ownerForm.emergencyContact} onChangeText={(emergencyContact) => setOwnerForm((current) => ({ ...current, emergencyContact }))} />
              <PrimaryButton label="Save Profile" icon="shield" onPress={submitOwner} />
            </Card>
          </>
        ) : null}

        {section === "vets" ? (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <SectionHeader title="Veterinarians" action={`${veterinarians.length} saved`} />
              {!showVetForm ? <GhostButton label="Add" onPress={() => setShowVetForm(true)} /> : null}
            </View>
            {showVetForm ? (
              <Card>
                <Field label="Clinic Name" value={vetForm.clinicName} onChangeText={(clinicName) => setVetForm((current) => ({ ...current, clinicName }))} />
                <Field label="Veterinarian Name" value={vetForm.veterinarianName} onChangeText={(veterinarianName) => setVetForm((current) => ({ ...current, veterinarianName }))} />
                <Field label="Phone" value={vetForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setVetForm((current) => ({ ...current, phone }))} />
                <Field label="Emergency Hotline" value={vetForm.emergencyHotline} keyboardType="phone-pad" onChangeText={(emergencyHotline) => setVetForm((current) => ({ ...current, emergencyHotline }))} />
                <Field label="Address" value={vetForm.address} onChangeText={(address) => setVetForm((current) => ({ ...current, address }))} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "800" }}>Primary veterinarian</Text>
                  <Switch value={vetForm.isPrimary} onValueChange={(isPrimary) => setVetForm((current) => ({ ...current, isPrimary }))} />
                </View>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                  <PrimaryButton label={editingVetId ? "Save" : "Add"} onPress={submitVet} />
                  <GhostButton label="Cancel" onPress={() => { setShowVetForm(false); setEditingVetId(null); setVetForm(emptyVet); }} />
                </View>
              </Card>
            ) : null}
            {veterinarians.map((vet) => (
              <Card key={vet.id}>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <MaterialCommunityIcons name="hospital-building" color={palette.teal} size={26} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 16 }}>{vet.clinicName} {vet.isPrimary ? "• Primary" : ""}</Text>
                    <Text selectable style={{ color: palette.muted }}>{vet.phone || vet.emergencyHotline}</Text>
                  </View>
                  <RowAction icon="phone-outline" onPress={() => Linking.openURL(`tel:${vet.phone || vet.emergencyHotline}`)} />
                  <RowAction icon="map-marker-outline" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}`)} />
                  <RowAction icon="pencil-outline" onPress={() => editVet(vet)} />
                  <RowAction icon="trash-can-outline" danger onPress={() => Alert.alert("Delete vet?", "This removes the local veterinarian record.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeVet(vet.id) }])} />
                </View>
              </Card>
            ))}
          </>
        ) : null}

        {section === "data" ? (
          <>
            <SectionHeader title="Data & Sync" />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Local reminders</Text>
                  <Text selectable style={{ color: palette.muted }}>Schedule native reminder notifications.</Text>
                </View>
                <Switch value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateSettings({ ...settings, notificationsEnabled })} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Optional cloud sync</Text>
                  <Text selectable style={{ color: palette.muted }}>Prepared for Supabase; off by default.</Text>
                </View>
                <Switch value={settings.optionalCloudSyncEnabled} onValueChange={(optionalCloudSyncEnabled) => updateSettings({ ...settings, optionalCloudSyncEnabled })} />
              </View>
            </Card>
            <Card>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Backup & Restore</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Restore is replace-mode in v1 and only runs after confirmation.</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <GhostButton label="Export Backup" onPress={exportBackup} />
                <GhostButton label="Restore" danger onPress={restoreBackup} />
              </View>
            </Card>
          </>
        ) : null}

        {section === "about" ? (
          <>
            <SectionHeader title="About PetNexa AI" />
            <Card>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Chip label={`${creditState.aiCredits}/3 AI credits`} active />
                <Chip label={`${creditState.weeklyAdWatchCount}/5 weekly ads`} />
                <Chip label={`${creditState.totalConsultationsUsed} consultations`} tone="navy" />
              </View>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Smart Pet Health, Connected Care.</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>All data stays local by default. Data is only sent online when AI consultation or optional cloud sync is enabled.</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
