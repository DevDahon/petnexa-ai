import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, IconBubble, PrimaryButton, RowAction, Screen, SectionHeader } from "@/components/ui";
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

type Section = "profile" | "vets" | "backup" | "about";

const sections: { id: Section; title: string; subtitle: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { id: "profile", title: "Owner Profile", subtitle: "Name, phone, emergency contact", icon: "account-heart-outline" },
  { id: "vets", title: "Veterinarians", subtitle: "Clinics and emergency contacts", icon: "hospital-building" },
  { id: "backup", title: "Backup & Restore", subtitle: "Export or replace local data", icon: "database-sync-outline" },
  { id: "about", title: "About PetNexa AI", subtitle: "Privacy, credits, app details", icon: "information-outline" },
];

function SettingsRow({ title, subtitle, icon, active, onPress }: { title: string; subtitle: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
      <Card style={{ backgroundColor: active ? palette.softTeal : "#fff", borderColor: active ? palette.mint : "#E9EEF5" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconBubble icon={icon} tone={active ? "teal" : "navy"} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: palette.text, fontSize: 15, fontWeight: "900" }}>{title}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" color={active ? palette.teal : palette.muted} size={22} />
        </View>
      </Card>
    </Pressable>
  );
}

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
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Settings</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 13 }}>Profile, vets, local data, and privacy.</Text>
          </View>
          <IconBubble icon="cog-outline" tone="navy" size={42} />
        </View>

        <Card style={{ backgroundColor: palette.softTeal, borderColor: palette.mint }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconBubble icon="account-heart-outline" size={54} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: palette.text, fontSize: 20, fontWeight: "900" }}>{owner.fullName || "Pet Parent"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{owner.phone || "Phone not set"}</Text>
              <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>{veterinarians.length} veterinary contacts saved</Text>
            </View>
          </View>
        </Card>

        <View style={{ gap: 8 }}>
          {sections.map((item) => (
            <SettingsRow key={item.id} title={item.title} subtitle={item.subtitle} icon={item.icon} active={section === item.id} onPress={() => setSection(item.id)} />
          ))}
        </View>

        {section === "profile" ? (
          <>
            <SectionHeader title="Owner Profile" />
            <Card>
              <Field label="Full Name" value={ownerForm.fullName} onChangeText={(fullName) => setOwnerForm((current) => ({ ...current, fullName }))} />
              <Field label="Phone" value={ownerForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setOwnerForm((current) => ({ ...current, phone }))} />
              <Field label="Email" value={ownerForm.email} keyboardType="email-address" onChangeText={(email) => setOwnerForm((current) => ({ ...current, email }))} />
              <Field label="Emergency Contact" value={ownerForm.emergencyContact} keyboardType="phone-pad" onChangeText={(emergencyContact) => setOwnerForm((current) => ({ ...current, emergencyContact }))} />
              <PrimaryButton label="Save Profile" icon="content-save-outline" onPress={submitOwner} />
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
              <Card style={{ backgroundColor: palette.softTeal }}>
                <Field label="Clinic Name" value={vetForm.clinicName} onChangeText={(clinicName) => setVetForm((current) => ({ ...current, clinicName }))} />
                <Field label="Veterinarian Name" value={vetForm.veterinarianName} onChangeText={(veterinarianName) => setVetForm((current) => ({ ...current, veterinarianName }))} />
                <Field label="Phone" value={vetForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setVetForm((current) => ({ ...current, phone }))} />
                <Field label="Emergency Hotline" value={vetForm.emergencyHotline} keyboardType="phone-pad" onChangeText={(emergencyHotline) => setVetForm((current) => ({ ...current, emergencyHotline }))} />
                <Field label="Address" value={vetForm.address} onChangeText={(address) => setVetForm((current) => ({ ...current, address }))} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Primary veterinarian</Text>
                  <Switch value={vetForm.isPrimary} onValueChange={(isPrimary) => setVetForm((current) => ({ ...current, isPrimary }))} />
                </View>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                  <PrimaryButton label={editingVetId ? "Save" : "Add"} icon="hospital-building" onPress={submitVet} />
                  <GhostButton label="Cancel" onPress={() => { setShowVetForm(false); setEditingVetId(null); setVetForm(emptyVet); }} />
                </View>
              </Card>
            ) : null}
            {veterinarians.map((vet) => (
              <Card key={vet.id}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <IconBubble icon="hospital-building" />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: palette.text, fontWeight: "900", fontSize: 16 }}>{vet.clinicName}</Text>
                    <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{vet.isPrimary ? "Primary vet" : "Veterinary contact"}</Text>
                    <Text selectable style={{ color: palette.navy, fontSize: 12 }}>{vet.phone || vet.emergencyHotline || "Phone not set"}</Text>
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

        {section === "backup" ? (
          <>
            <SectionHeader title="Local Data" />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text selectable style={{ color: palette.text, fontWeight: "900" }}>Local reminders</Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Schedule native notifications for saved reminders.</Text>
                </View>
                <Switch value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateSettings({ ...settings, notificationsEnabled })} />
              </View>
            </Card>
            <Card style={{ backgroundColor: palette.softTeal, borderColor: palette.mint }}>
              <IconBubble icon="database-export-outline" size={46} />
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Create Backup</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Export local PetNexa AI data to a JSON file on this device.</Text>
              <PrimaryButton label="Create Backup" icon="download-outline" onPress={exportBackup} />
            </Card>
            <Card style={{ backgroundColor: palette.softDanger }}>
              <IconBubble icon="backup-restore" tone="danger" size={46} />
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Restore Backup</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>Restore replaces all current local data after confirmation.</Text>
              <GhostButton label="Restore Backup" danger onPress={restoreBackup} />
            </Card>
          </>
        ) : null}

        {section === "about" ? (
          <>
            <SectionHeader title="About PetNexa AI" />
            <Card>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <IconBubble icon="paw" size={54} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 20, fontWeight: "900" }}>PetNexa AI</Text>
                  <Text selectable style={{ color: palette.teal, fontSize: 13, fontWeight: "900" }}>Smart Pet Health, Connected Care.</Text>
                </View>
              </View>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Purpose</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>PetNexa AI helps pet parents organize pet profiles, health records, reminders, veterinarian contacts, and guided pet-care notes in one offline-first mobile app.</Text>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Privacy</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>All data stays local by default. Data is only sent online when AI consultation is used.</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
