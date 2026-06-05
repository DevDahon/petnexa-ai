import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, ScrollView, Switch, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
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

export default function SettingsScreen() {
  const { owner, settings, veterinarians, creditState, saveOwner, saveVet, removeVet, updateSettings, exportData, restoreDataReplaceMode } = useAppData();
  const [ownerForm, setOwnerForm] = useState(owner);
  const [vetForm, setVetForm] = useState(emptyVet);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);

  const submitOwner = async () => {
    await saveOwner(ownerForm);
    Alert.alert("Owner profile saved");
  };

  const submitVet = async () => {
    if (!vetForm.clinicName.trim()) return Alert.alert("Clinic name required");
    await saveVet({ ...vetForm, id: editingVetId ?? undefined });
    setVetForm(emptyVet);
    setEditingVetId(null);
  };

  const editVet = (vet: Veterinarian) => {
    setEditingVetId(vet.id);
    setVetForm(vet);
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
        <Card style={{ backgroundColor: palette.softTeal }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MaterialCommunityIcons name="shield-check-outline" color={palette.teal} size={24} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>Privacy</Text>
              <Text selectable style={{ color: palette.muted }}>All data stays local by default. Data is only sent online when AI consultation or optional cloud sync is enabled.</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Owner Profile" />
        <Card>
          <Field label="Full Name" value={ownerForm.fullName} onChangeText={(fullName) => setOwnerForm((current) => ({ ...current, fullName }))} />
          <Field label="Phone" value={ownerForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setOwnerForm((current) => ({ ...current, phone }))} />
          <Field label="Email" value={ownerForm.email} keyboardType="email-address" onChangeText={(email) => setOwnerForm((current) => ({ ...current, email }))} />
          <Field label="Address" value={ownerForm.address} onChangeText={(address) => setOwnerForm((current) => ({ ...current, address }))} />
          <Field label="Emergency Contact" value={ownerForm.emergencyContact} onChangeText={(emergencyContact) => setOwnerForm((current) => ({ ...current, emergencyContact }))} />
          <Field label="Notes" value={ownerForm.notes} multiline onChangeText={(notes) => setOwnerForm((current) => ({ ...current, notes }))} />
          <PrimaryButton label="Save Owner" icon="shield" onPress={submitOwner} />
        </Card>

        <SectionHeader title="Veterinary Directory" action={`${veterinarians.length} saved`} />
        {veterinarians.map((vet) => (
          <Card key={vet.id}>
            <View style={{ gap: 4 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 17 }}>{vet.clinicName} {vet.isPrimary ? "• Primary" : ""}</Text>
              <Text selectable style={{ color: palette.muted }}>{vet.veterinarianName} • {vet.hours}</Text>
              <Text selectable style={{ color: palette.muted }}>{vet.address}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <GhostButton label="Call" onPress={() => Linking.openURL(`tel:${vet.phone}`)} />
              <GhostButton label="SMS" onPress={() => Linking.openURL(`sms:${vet.phone}`)} />
              <GhostButton label="Email" onPress={() => Linking.openURL(`mailto:${vet.email}`)} />
              <GhostButton label="Maps" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}`)} />
              <GhostButton label="Edit" onPress={() => editVet(vet)} />
              <GhostButton label="Delete" danger onPress={() => Alert.alert("Delete vet?", "This removes the local veterinarian record.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeVet(vet.id) }])} />
            </View>
          </Card>
        ))}

        <SectionHeader title={editingVetId ? "Edit Veterinarian" : "Add Veterinarian"} />
        <Card>
          <Field label="Clinic Name" value={vetForm.clinicName} onChangeText={(clinicName) => setVetForm((current) => ({ ...current, clinicName }))} />
          <Field label="Veterinarian Name" value={vetForm.veterinarianName} onChangeText={(veterinarianName) => setVetForm((current) => ({ ...current, veterinarianName }))} />
          <Field label="Phone" value={vetForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setVetForm((current) => ({ ...current, phone }))} />
          <Field label="Email" value={vetForm.email} keyboardType="email-address" onChangeText={(email) => setVetForm((current) => ({ ...current, email }))} />
          <Field label="Address" value={vetForm.address} onChangeText={(address) => setVetForm((current) => ({ ...current, address }))} />
          <Field label="Website" value={vetForm.website} onChangeText={(website) => setVetForm((current) => ({ ...current, website }))} />
          <Field label="Emergency Hotline" value={vetForm.emergencyHotline} keyboardType="phone-pad" onChangeText={(emergencyHotline) => setVetForm((current) => ({ ...current, emergencyHotline }))} />
          <Field label="Hours" value={vetForm.hours} onChangeText={(hours) => setVetForm((current) => ({ ...current, hours }))} />
          <Field label="Notes" value={vetForm.notes} multiline onChangeText={(notes) => setVetForm((current) => ({ ...current, notes }))} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text selectable style={{ color: palette.text, fontWeight: "800" }}>Primary veterinarian</Text>
            <Switch value={vetForm.isPrimary} onValueChange={(isPrimary) => setVetForm((current) => ({ ...current, isPrimary }))} />
          </View>
          <PrimaryButton label={editingVetId ? "Save Vet" : "Add Vet"} onPress={submitVet} />
        </Card>

        <SectionHeader title="Backup & Restore" />
        <Card>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <GhostButton label="Export JSON Backup" onPress={exportBackup} />
            <GhostButton label="Replace From Backup" danger onPress={restoreBackup} />
          </View>
          <Text selectable style={{ color: palette.muted }}>Restore is replace-mode in v1: a valid backup replaces existing local data only after confirmation.</Text>
        </Card>

        <SectionHeader title="Notifications & Sync" />
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Local reminders</Text>
              <Text selectable style={{ color: palette.muted }}>Schedule local Expo notifications for pet care tasks.</Text>
            </View>
            <Switch value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateSettings({ ...settings, notificationsEnabled })} />
          </View>
          <Field label="Daily Summary Time" value={settings.dailySummaryTime} onChangeText={(dailySummaryTime) => updateSettings({ ...settings, dailySummaryTime })} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Optional cloud sync</Text>
              <Text selectable style={{ color: palette.muted }}>Prepared for Supabase sync; off by default.</Text>
            </View>
            <Switch value={settings.optionalCloudSyncEnabled} onValueChange={(optionalCloudSyncEnabled) => updateSettings({ ...settings, optionalCloudSyncEnabled })} />
          </View>
        </Card>

        <SectionHeader title="About PetNexa AI" />
        <Card>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip label={`${creditState.aiCredits}/3 AI credits`} active />
            <Chip label={`${creditState.weeklyAdWatchCount}/5 weekly ads`} />
            <Chip label={`${creditState.totalConsultationsUsed} consultations`} tone="navy" />
          </View>
          <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Smart Pet Health, Connected Care.</Text>
          <Text selectable style={{ color: palette.muted }}>Production AI keys must live behind a backend proxy such as Supabase Edge Function, Vercel API route, Render backend, or Firebase Cloud Function. Expo API routes are for development and testing only.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
