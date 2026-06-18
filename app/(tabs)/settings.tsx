import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Switch } from "react-native-paper";
import {
  Card,
  Chip,
  CompactButton,
  Field,
  FormActions,
  HeaderActionButton,
  HeaderAppIcon,
  IconBubble,
  ResponsiveScrollView,
  RowAction,
  Screen,
  ScreenHeader,
  SectionHeader,
  useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { Veterinarian } from "@/types/domain";
import { getAgeYears, getReminderStatus, isValidIsoDate } from "@/utils/date";

const MIN_OWNER_AGE = 13;

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

type Panel = "profile" | "vets" | "data" | "preferences" | "about";

function Divider() {
  return <View style={{ height: 1, backgroundColor: palette.borderLight, marginVertical: 6 }} />;
}

function MenuRow({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  subtitle: string;
  active?: boolean;
  onPress: () => void;
}) {
  const layout = useResponsiveLayout();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, minWidth: 0 }}>
        <IconBubble icon={icon} tone={active ? "teal" : "navy"} size={42} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable numberOfLines={2} style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.black }}>
            {title}
          </Text>
          <Text selectable numberOfLines={layout.isTiny ? 3 : 2} style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
            {subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons name={active ? "chevron-up" : "chevron-right"} color={active ? palette.teal : palette.muted} size={24} />
      </View>
    </Pressable>
  );
}

function DetailRow({
  icon,
  title,
  subtitle,
  right,
  danger,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  subtitle?: string;
  right?: ReactNode;
  danger?: boolean;
}) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        flexDirection: layout.shouldStack && right ? "column" : "row",
        alignItems: layout.shouldStack && right ? "stretch" : "center",
        gap: 12,
        paddingVertical: 6,
        minWidth: 0,
      }}
    >
      <IconBubble icon={icon} tone={danger ? "danger" : "teal"} size={42} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text selectable numberOfLines={2} style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.bold }}>
          {title}
        </Text>
        {subtitle ? (
          <Text selectable numberOfLines={3} style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ alignSelf: layout.shouldStack ? "flex-start" : "auto" }}>{right}</View> : null}
    </View>
  );
}

function LogoutAction({
  mode,
  disabled,
  onPress,
}: {
  mode: "solo" | "home";
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        marginTop: 12,
        minHeight: 50,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: "#FECACA",
        backgroundColor: palette.dangerSoft,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 14,
      })}
    >
      <MaterialCommunityIcons name="logout" color={palette.danger} size={19} />
      <Text style={{ color: palette.danger, fontSize: 14, fontFamily: fontFamily.black }}>
        {disabled ? "Logging Out" : mode === "home" ? "Log Out of Home" : "Exit Solo Mode"}
      </Text>
    </Pressable>
  );
}

function callNumber(value?: string) {
  if (!value) {
    Alert.alert("No phone number", "Add a phone number for this clinic first.");
    return;
  }
  Linking.openURL(`tel:${value}`).catch(() => Alert.alert("Call unavailable", "This device cannot open phone calls right now."));
}

function VetCard({ vet, onEdit, onDelete }: { vet: Veterinarian; onEdit: () => void; onDelete: () => void }) {
  const emergency = Boolean(vet.emergencyHotline);
  const layout = useResponsiveLayout();

  return (
    <Card style={{ backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: layout.shouldStack ? "column" : "row",
          alignItems: layout.shouldStack ? "stretch" : "center",
          gap: 12,
          minWidth: 0,
        }}
      >
        <IconBubble icon={emergency ? "hospital-marker" : "hospital-building"} tone={emergency ? "danger" : vet.isPrimary ? "navy" : "teal"} size={42} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text selectable numberOfLines={2} style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.black, flexShrink: 1 }}>
              {vet.clinicName}
            </Text>
            {vet.isPrimary ? <Chip label="Primary" active tone="navy" /> : null}
            {emergency ? <Chip label="Emergency" active tone="danger" /> : null}
          </View>
          <Text selectable numberOfLines={2} style={{ color: palette.navy, fontSize: 13, fontFamily: fontFamily.medium }}>
            {vet.phone || vet.emergencyHotline || "No phone saved"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, alignSelf: layout.shouldStack ? "stretch" : "auto" }}>
          <RowAction icon="phone-outline" label={`Call ${vet.clinicName}`} onPress={() => callNumber(vet.emergencyHotline || vet.phone)} />
          <RowAction icon="pencil-outline" label={`Edit ${vet.clinicName}`} onPress={onEdit} />
          <RowAction icon="trash-can-outline" label={`Delete ${vet.clinicName}`} danger onPress={onDelete} />
        </View>
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  const {
    owner,
    pets,
    veterinarians,
    reminders,
    settings,
    saveOwner,
    saveVet,
    removeVet,
    updateSettings,
    syncHomeNow,
    logoutHomeAccount,
    exportData,
    restoreDataReplaceMode,
  } = useAppData();
  const layout = useResponsiveLayout();

  const [activePanel, setActivePanel] = useState<Panel | null>(null);
  const [ownerForm, setOwnerForm] = useState({ fullName: owner.fullName, birthday: owner.birthday });
  const [showVetForm, setShowVetForm] = useState(false);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);
  const [vetForm, setVetForm] = useState(emptyVet);
  const [syncing, setSyncing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeCare = reminders.filter((item) => ["Due Today", "Overdue"].includes(getReminderStatus(item))).length;
  const primaryVet = veterinarians.find((vet) => vet.isPrimary);
  const emergencyVet = veterinarians.find((vet) => vet.emergencyHotline);
  const careModeLabel = settings.careMode === "home" ? "Home Furparent" : settings.careMode === "solo" ? "Solo Furparent" : "Choose mode";
  const syncState =
    settings.careMode !== "home"
      ? "Solo mode"
      : syncing
        ? "Syncing"
        : settings.syncEnabled
          ? "Ready"
          : "Off";

  const submitOwner = async () => {
    const fullName = ownerForm.fullName.trim();
    const birthday = ownerForm.birthday.trim();

    if (!fullName) return Alert.alert("Name required", "Enter the owner full name.");
    if (!isValidIsoDate(birthday)) return Alert.alert("Invalid birthday", "Use YYYY-MM-DD format.");
    if (getAgeYears(birthday) < MIN_OWNER_AGE) return Alert.alert("Age requirement", `Owner must be at least ${MIN_OWNER_AGE} years old.`);

    await saveOwner({ id: owner.id, fullName, birthday });
  };

  const submitVet = async () => {
    if (!vetForm.clinicName.trim()) return Alert.alert("Clinic name required", "Please enter a clinic name.");

    await saveVet({ ...vetForm, id: editingVetId ?? undefined });
    setVetForm(emptyVet);
    setEditingVetId(null);
    setShowVetForm(false);
  };

  const startEditVet = (vet: Veterinarian) => {
    setEditingVetId(vet.id);
    setShowVetForm(true);
    setVetForm({
      clinicName: vet.clinicName,
      veterinarianName: vet.veterinarianName || "",
      phone: vet.phone || "",
      email: vet.email || "",
      address: vet.address || "",
      website: vet.website || "",
      emergencyHotline: vet.emergencyHotline || "",
      hours: vet.hours || "",
      notes: vet.notes || "",
      isPrimary: vet.isPrimary,
    });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncHomeNow();
      Alert.alert("Sync complete", "Your Home Furparent data is up to date.");
    } catch {
      Alert.alert("Sync unavailable", "Check your connection and Home Furparent setup, then try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    console.log("[PetNexa] logout pressed", settings.careMode);
    setLoggingOut(true);
    try {
      await logoutHomeAccount();
    } catch (error) {
      Alert.alert("Logout failed", error instanceof Error ? error.message : "Could not log out on this device.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <ResponsiveScrollView contentContainerStyle={{ gap: 14 }}>
        <ScreenHeader
          title="Settings"
          subtitle="Account and app controls."
          right={
            <HeaderActionButton
              icon="home-outline"
              label="Go home"
              active
              onPress={() => router.replace("/")}
            />
          }
        />

        <Card style={{ backgroundColor: palette.softTeal, borderColor: palette.mintLight }}>
          <View style={{ gap: 5 }}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable style={{ color: palette.text, fontSize: 20, fontFamily: fontFamily.black }}>
                {owner.fullName || "Pet Parent"}
              </Text>
              <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                {careModeLabel} · {pets.length} pets · {activeCare} active care
              </Text>
            </View>
          </View>
        </Card>

        {settings.careMode ? (
          <Card style={{ gap: 0 }}>
            <DetailRow
              icon={settings.careMode === "home" ? "home-account" : "account-lock-outline"}
              title={settings.careMode === "home" ? "Home Account" : "Solo Account"}
              subtitle={settings.careMode === "home" ? settings.homeName || "Home Furparent sync is connected" : "Local-only care on this device"}
            />
            <LogoutAction mode={settings.careMode} disabled={loggingOut} onPress={handleLogout} />
          </Card>
        ) : null}

        <SectionHeader title="Settings" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="account-outline" title="Owner Profile" subtitle="Name and birthday" active={activePanel === "profile"} onPress={() => setActivePanel(activePanel === "profile" ? null : "profile")} />
          <Divider />
          <MenuRow icon="hospital-building" title="Veterinarians" subtitle={`${veterinarians.length} saved clinics`} active={activePanel === "vets"} onPress={() => setActivePanel(activePanel === "vets" ? null : "vets")} />
          <Divider />
          <MenuRow icon="database-sync-outline" title="Data" subtitle="Backup, restore, and Home sync" active={activePanel === "data"} onPress={() => setActivePanel(activePanel === "data" ? null : "data")} />
          <Divider />
          <MenuRow icon="bell-outline" title="Preferences" subtitle="Notifications and daily summary" active={activePanel === "preferences"} onPress={() => setActivePanel(activePanel === "preferences" ? null : "preferences")} />
          <Divider />
          <MenuRow icon="information-outline" title="About" subtitle="Version, developer, and privacy" active={activePanel === "about"} onPress={() => setActivePanel(activePanel === "about" ? null : "about")} />
        </Card>

        {activePanel === "profile" ? (
          <Card>
            <SectionHeader title="Owner Profile" />
            <Field label="Owner Full Name" value={ownerForm.fullName} onChangeText={(fullName) => setOwnerForm((current) => ({ ...current, fullName }))} />
            <Field label="Birthday" value={ownerForm.birthday} placeholder="YYYY-MM-DD" onChangeText={(birthday) => setOwnerForm((current) => ({ ...current, birthday }))} />
            <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
              Used for greetings and age eligibility.
            </Text>
            <FormActions submitLabel="Save" submitIcon="content-save-outline" onSubmit={submitOwner} onCancel={() => setActivePanel(null)} />
          </Card>
        ) : null}

        {activePanel === "vets" ? (
          <>
            <Card>
              <SectionHeader title="Veterinarians" rightNode={!showVetForm ? <CompactButton label="Add" icon="plus" primary onPress={() => setShowVetForm(true)} /> : undefined} />
              <DetailRow icon="hospital-building" title="Primary Vet" subtitle={primaryVet?.clinicName || "No primary clinic selected"} />
              <Divider />
              <DetailRow icon="alert-octagon-outline" title="Emergency Vet" subtitle={emergencyVet?.clinicName || "No emergency hotline saved"} danger={Boolean(emergencyVet)} />
            </Card>

            {showVetForm ? (
              <Card style={{ borderColor: palette.mintLight }}>
                <Text selectable style={{ color: palette.text, fontSize: 16, fontFamily: fontFamily.bold }}>
                  {editingVetId ? "Edit clinic" : "Add clinic"}
                </Text>
                <Field label="Clinic Name" value={vetForm.clinicName} onChangeText={(clinicName) => setVetForm((current) => ({ ...current, clinicName }))} />
                <Field label="Veterinarian Name" value={vetForm.veterinarianName} onChangeText={(veterinarianName) => setVetForm((current) => ({ ...current, veterinarianName }))} />
                <Field label="Phone Number" value={vetForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setVetForm((current) => ({ ...current, phone }))} />
                <Field label="Emergency Hotline" value={vetForm.emergencyHotline} keyboardType="phone-pad" onChangeText={(emergencyHotline) => setVetForm((current) => ({ ...current, emergencyHotline }))} />
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Chip label="Regular Clinic" active={!vetForm.isPrimary} onPress={() => setVetForm((current) => ({ ...current, isPrimary: false }))} />
                  <Chip label="Primary Vet" active={vetForm.isPrimary} onPress={() => setVetForm((current) => ({ ...current, isPrimary: true }))} tone="navy" />
                </View>
                <FormActions
                  submitLabel={editingVetId ? "Save" : "Add"}
                  submitIcon="content-save-outline"
                  onSubmit={submitVet}
                  onCancel={() => {
                    setShowVetForm(false);
                    setEditingVetId(null);
                    setVetForm(emptyVet);
                  }}
                />
              </Card>
            ) : null}

            {veterinarians.map((vet) => (
              <VetCard
                key={vet.id}
                vet={vet}
                onEdit={() => startEditVet(vet)}
                onDelete={() =>
                  Alert.alert("Delete clinic?", "This removes the local veterinarian contact.", [
                    { text: "Cancel" },
                    { text: "Delete", style: "destructive", onPress: () => removeVet(vet.id) },
                  ])
                }
              />
            ))}
          </>
        ) : null}

        {activePanel === "data" ? (
          <Card>
            <SectionHeader title="Data" />
            <DetailRow icon="backup-restore" title="Backup & Restore" subtitle="Export or replace local data. Image files are not bundled." />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Export" icon="export" onPress={exportData} />
              <CompactButton label="Import" icon="import" danger onPress={restoreDataReplaceMode} />
            </View>
            <Divider />
            <DetailRow icon="cloud-sync-outline" title="Home Sync" subtitle={`${syncState} · Last synced: ${settings.lastSyncAt || "Not yet"}`} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Sync Now" icon="sync" disabled={settings.careMode !== "home" || syncing} onPress={handleSyncNow} />
            </View>
          </Card>
        ) : null}

        {activePanel === "preferences" ? (
          <Card>
            <SectionHeader title="Preferences" />
            <DetailRow
              icon="bell-outline"
              title="Notifications"
              subtitle="Local care reminders when supported."
              right={<Switch value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateSettings({ ...settings, notificationsEnabled })} color={palette.teal} />}
            />
            <Divider />
            <DetailRow icon="clock-outline" title="Daily Summary" subtitle={`Preferred time: ${settings.dailySummaryTime}`} />
          </Card>
        ) : null}

        {activePanel === "about" ? (
          <Card>
            <View style={{ alignItems: "center", gap: 10 }}>
              <HeaderAppIcon size={72} />
              <View style={{ alignItems: "center", gap: 2 }}>
                <Text selectable style={{ color: palette.text, fontSize: 21, fontFamily: fontFamily.black }}>
                  PetNexa AI
                </Text>
                <Text selectable style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.bold }}>
                  Smart Pet Health, Connected Care.
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: layout.isCompact ? 250 : undefined }}>
                <Chip label="Version 1.0.0" active />
                <Chip label="Developer: Dahon" tone="navy" />
              </View>
            </View>
            <Divider />
            <DetailRow icon="shield-check-outline" title="Privacy" subtitle="All data stays local by default. Data is only sent online when AI consultation or optional cloud sync is enabled." />
            <Divider />
            <DetailRow icon="information-outline" title="AI Safety" subtitle="The AI provides informational guidance only and does not replace veterinary care." />
          </Card>
        ) : null}
      </ResponsiveScrollView>
    </Screen>
  );
}
