import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Card, Chip, Field, GhostButton, HeaderAppIcon, IconBubble, PrimaryButton, RowAction, Screen, SectionHeader } from "@/components/ui";
import { appInfo } from "@/constants/app";
import { palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Veterinarian } from "@/types/domain";
import { getAgeYears, isValidIsoDate } from "@/utils/date";

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

type Section = "vets" | "backup" | "about";

const sections: { id: Section; title: string; subtitle: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { id: "vets", title: "Veterinarians", subtitle: "Clinics and emergency contacts", icon: "hospital-building" },
  { id: "backup", title: "Backup & Restore", subtitle: "Export or replace local data", icon: "database-sync-outline" },
  { id: "about", title: "About PetNexa AI", subtitle: "Purpose, version, developer", icon: "information-outline" },
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
  const { owner, settings, veterinarians, saveVet, removeVet, updateSettings, syncHomeNow, logoutHomeAccount, exportData, restoreDataReplaceMode } = useAppData();
  const [section, setSection] = useState<Section>("vets");
  const [vetForm, setVetForm] = useState(emptyVet);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);
  const [showVetForm, setShowVetForm] = useState(false);

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

  const manualSync = async () => {
    try {
      await syncHomeNow();
      Alert.alert("Sync complete", "Home care data is up to date.");
    } catch (error) {
      Alert.alert("Sync failed", error instanceof Error ? error.message : "Please try again when online.");
    }
  };

  const logoutHome = () => {
    Alert.alert(
      "Log out of Home?",
      "This signs out this device and stops Home sync. Local cached care data will stay on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutHomeAccount();
            } catch (error) {
              Alert.alert("Logout failed", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text selectable style={{ color: palette.text, fontSize: 28, fontWeight: "900" }}>Settings</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 13 }}>Profile, vets, local data, and privacy.</Text>
          </View>
          <HeaderAppIcon size={46} />
        </View>

        <Card style={{ backgroundColor: palette.softTeal, borderColor: palette.mint }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconBubble icon="account-heart-outline" size={54} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: palette.text, fontSize: 20, fontWeight: "900" }}>{owner.fullName || "Pet Parent"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 12 }}>
                {isValidIsoDate(owner.birthday) ? `Owner age: ${getAgeYears(owner.birthday)}` : "Birthday not set"}
              </Text>
              <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>{settings.careMode === "home" ? `Home Furparent${settings.homeName ? ` • ${settings.homeName}` : ""}` : "Solo Furparent"} • {veterinarians.length} vets</Text>
            </View>
          </View>
        </Card>

        {settings.careMode === "home" ? (
          <Card>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <IconBubble icon="home-heart" size={46} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>{settings.homeName || "Home Account"}</Text>
                <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{settings.lastSyncAt ? `Last sync: ${settings.lastSyncAt}` : "Not synced yet"}</Text>
                {settings.homeInviteCode ? <Text selectable style={{ color: palette.teal, fontSize: 12, fontWeight: "900" }}>Invite code: {settings.homeInviteCode}</Text> : null}
              </View>
              <RowAction icon="sync" onPress={manualSync} />
            </View>
            <GhostButton label="Log Out" danger onPress={logoutHome} />
          </Card>
        ) : null}

        <View style={{ gap: 8 }}>
          {sections.map((item) => (
            <SettingsRow key={item.id} title={item.title} subtitle={item.subtitle} icon={item.icon} active={section === item.id} onPress={() => setSection(item.id)} />
          ))}
        </View>

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
                  <Text selectable style={{ color: palette.text, fontSize: 20, fontWeight: "900" }}>{appInfo.name}</Text>
                  <Text selectable style={{ color: palette.teal, fontSize: 13, fontWeight: "900" }}>{appInfo.tagline}</Text>
                </View>
              </View>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Purpose</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>PetNexa AI helps pet parents organize pet profiles, health records, reminders, veterinarian contacts, and guided pet-care notes in one offline-first mobile app.</Text>
              <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Privacy</Text>
              <Text selectable style={{ color: palette.muted, lineHeight: 20 }}>All data stays local by default. If Home Furparent sync is enabled, selected care data is securely synced to your Home account so your household can access it across devices. AI consultation sends only the consultation details needed for guidance.</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", paddingTop: 4 }}>
                <Chip label={`Version ${appInfo.version}`} active />
                <Chip label={`Developer: ${appInfo.developer}`} tone="navy" />
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
