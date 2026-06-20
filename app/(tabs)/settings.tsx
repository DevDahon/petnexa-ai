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
  StatusNotice,
  UndoBanner,
  useResponsiveLayout,
} from "@/components/ui";
import { appInfo, releaseNotes } from "@/constants/app";
import { aiSafetySections, LegalSection, PRIVACY_POLICY_URL, privacyPolicySections, SUPPORT_EMAIL, supportFaqSections, termsSections } from "@/constants/legal";
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

type Panel = "profile" | "vets" | "data" | "preferences" | "legal" | "help" | "about";

type UndoState = {
  message: string;
  onUndo: () => Promise<void>;
};

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

function LegalBlock({ section }: { section: LegalSection }) {
  return (
    <Card noAnimation>
      <View style={{ gap: 7 }}>
        <Text selectable style={{ color: palette.text, fontSize: 16, fontFamily: fontFamily.black }}>
          {section.title}
        </Text>
        <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 20, fontFamily: fontFamily.medium }}>
          {section.body}
        </Text>
        {section.bullets?.map((bullet) => (
          <View key={bullet} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.teal, marginTop: 8 }} />
            <Text selectable style={{ flex: 1, color: palette.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fontFamily.medium }}>
              {bullet}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function callNumber(value?: string) {
  if (!value) {
    Alert.alert("No phone number", "Add a phone number for this clinic first.");
    return;
  }
  Linking.openURL(`tel:${value}`).catch(() => Alert.alert("Call unavailable", "This device cannot open phone calls right now."));
}

function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_POLICY_URL).catch(() => Alert.alert("Privacy policy unavailable", "This device cannot open the privacy policy right now."));
}

function contactSupport() {
  const subject = encodeURIComponent("PetNexa AI support");
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => Alert.alert("Email unavailable", `Contact support at ${SUPPORT_EMAIL}.`));
}

function contactDataRequest() {
  const subject = encodeURIComponent("PetNexa AI data request");
  const body = encodeURIComponent("Please include your app version, device platform, care mode, and whether you use Home Furparent sync. Do not attach backups unless requested.");
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => Alert.alert("Email unavailable", `Contact support at ${SUPPORT_EMAIL}.`));
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
    records,
    reminders,
    consultations,
    settings,
    saveOwner,
    saveVet,
    removeVet,
    restoreVetDeletion,
    updateSettings,
    syncHomeNow,
    logoutHomeAccount,
    exportData,
    restoreDataReplaceMode,
    exportDiagnostics,
    clearDiagnostics,
    resetLocalData,
  } = useAppData();
  const layout = useResponsiveLayout();

  const [activePanel, setActivePanel] = useState<Panel | null>(null);
  const [ownerForm, setOwnerForm] = useState({ fullName: owner.fullName, birthday: owner.birthday });
  const [showVetForm, setShowVetForm] = useState(false);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);
  const [vetForm, setVetForm] = useState(emptyVet);
  const [syncing, setSyncing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const activeCare = reminders.filter((item) => ["Due Today", "Overdue"].includes(getReminderStatus(item))).length;
  const pendingChanges = [...pets, ...veterinarians, ...records, ...reminders].filter((item) => item.syncStatus === "pending" || item.syncStatus === "error").length;
  const dueToday = reminders.filter((item) => getReminderStatus(item) === "Due Today").length;
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue").length;
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming").length;
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
  const syncTone = settings.lastSyncError ? "danger" : pendingChanges > 0 ? "warning" : settings.careMode === "home" ? "success" : "navy";
  const syncTitle = settings.careMode === "home" ? (settings.lastSyncError ? "Home sync needs attention" : pendingChanges > 0 ? "Home sync has pending changes" : "Home sync ready") : "Solo mode is local-only";
  const syncMessage =
    settings.careMode === "home"
      ? settings.lastSyncError || `${pendingChanges} pending · Last synced: ${settings.lastSyncAt || "Not yet"}`
      : "Your pet data stays on this device unless you export a backup or switch to Home.";
  const notificationTitle = settings.notificationsEnabled ? "Care reminders enabled" : "Care reminders off";
  const notificationMessage = settings.notificationsEnabled
    ? `${dueToday} due today · ${overdue} overdue · ${upcoming} upcoming`
    : "Turn notifications on to receive local care reminders on supported devices.";

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

  const handleExportData = async () => {
    try {
      await exportData();
    } catch {
      Alert.alert("Export failed", "PetNexa AI could not create a backup on this device.");
    }
  };

  const handleImportData = async () => {
    try {
      await restoreDataReplaceMode();
    } catch (error) {
      if (error instanceof Error && error.message === "Restore cancelled.") return;
      Alert.alert("Import failed", error instanceof Error ? error.message : "PetNexa AI could not import this backup.");
    }
  };

  const handleExportDiagnostics = async () => {
    try {
      await exportDiagnostics();
    } catch {
      Alert.alert("Export failed", "Diagnostics could not be exported on this device.");
    }
  };

  const handleClearDiagnostics = async () => {
    await clearDiagnostics();
    Alert.alert("Diagnostics cleared", "Local diagnostic events were removed from this device.");
  };

  const handleDeleteVet = (vet: Veterinarian) => {
    Alert.alert("Delete clinic?", "This removes the local veterinarian contact.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeVet(vet.id);
          setUndo({
            message: `${vet.clinicName} deleted.`,
            onUndo: async () => restoreVetDeletion(vet),
          });
        },
      },
    ]);
  };

  const handleResetLocalData = () => {
    Alert.alert(
      "Delete local data?",
      "This removes local pets, records, reminders, vets, consultations, and diagnostics from this device. It does not delete a Home account or cloud data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resetLocalData().catch(() => Alert.alert("Delete failed", "Could not clear local data right now.")),
        },
      ],
    );
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
                {careModeLabel} · {pets.length} pets · {records.length} records · {activeCare} active care
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
        {undo ? (
          <UndoBanner
            message={undo.message}
            onDismiss={() => setUndo(null)}
            onUndo={() => {
              undo.onUndo().catch(() => Alert.alert("Restore failed", "Could not restore this item right now."));
              setUndo(null);
            }}
          />
        ) : null}
        <Card style={{ gap: 0 }}>
          <MenuRow icon="account-outline" title="Owner Profile" subtitle="Name and birthday" active={activePanel === "profile"} onPress={() => setActivePanel(activePanel === "profile" ? null : "profile")} />
          <Divider />
          <MenuRow icon="hospital-building" title="Veterinarians" subtitle={`${veterinarians.length} saved clinics`} active={activePanel === "vets"} onPress={() => setActivePanel(activePanel === "vets" ? null : "vets")} />
          <Divider />
          <MenuRow icon="database-sync-outline" title="Data" subtitle="Backup, restore, and Home sync" active={activePanel === "data"} onPress={() => setActivePanel(activePanel === "data" ? null : "data")} />
          <Divider />
          <MenuRow icon="bell-outline" title="Preferences" subtitle="Notifications and daily summary" active={activePanel === "preferences"} onPress={() => setActivePanel(activePanel === "preferences" ? null : "preferences")} />
          <Divider />
          <MenuRow icon="shield-check-outline" title="Legal & Privacy" subtitle="Policy, consent, and AI safety" active={activePanel === "legal"} onPress={() => setActivePanel(activePanel === "legal" ? null : "legal")} />
          <Divider />
          <MenuRow icon="help-circle-outline" title="Help & Support" subtitle="Contact, diagnostics, and urgent care guidance" active={activePanel === "help"} onPress={() => setActivePanel(activePanel === "help" ? null : "help")} />
          <Divider />
          <MenuRow icon="information-outline" title="About" subtitle="Version and developer" active={activePanel === "about"} onPress={() => setActivePanel(activePanel === "about" ? null : "about")} />
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
                  handleDeleteVet(vet)
                }
              />
            ))}
          </>
        ) : null}

        {activePanel === "data" ? (
          <Card>
            <SectionHeader title="Data" />
            <StatusNotice title={syncTitle} message={syncMessage} icon={settings.careMode === "home" ? "cloud-sync-outline" : "cellphone-lock"} tone={syncTone} />
            <DetailRow icon="backup-restore" title="Backup & Restore" subtitle="Portable JSON backups include local images when the device can read them." />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Export" icon="export" onPress={handleExportData} />
              <CompactButton label="Import" icon="import" danger onPress={handleImportData} />
            </View>
            <Divider />
            <DetailRow
              icon="cloud-sync-outline"
              title="Home Sync"
              subtitle={`${syncState} · Pending: ${pendingChanges} · Last synced: ${settings.lastSyncAt || "Not yet"}`}
            />
            {settings.lastSyncError ? (
              <>
                <Divider />
                <DetailRow icon="alert-circle-outline" title="Sync Issue" subtitle={settings.lastSyncError} danger />
              </>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Sync Now" icon="sync" disabled={settings.careMode !== "home" || syncing} onPress={handleSyncNow} />
            </View>
            <Divider />
            <DetailRow
              icon="bug-check-outline"
              title="Local Diagnostics"
              subtitle="Off by default. When enabled, failed sync/import events are stored locally until exported or cleared."
              right={<Switch value={Boolean(settings.diagnosticsEnabled)} onValueChange={(diagnosticsEnabled) => updateSettings({ ...settings, diagnosticsEnabled })} color={palette.teal} />}
            />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Export Logs" icon="file-export-outline" onPress={handleExportDiagnostics} />
              <CompactButton label="Clear Logs" icon="delete-outline" danger onPress={handleClearDiagnostics} />
            </View>
            <Divider />
            <DetailRow icon="database-remove-outline" title="Delete Local Device Data" subtitle="Clears this device without deleting Home cloud data." danger />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
              <CompactButton label="Delete Local Data" icon="trash-can-outline" danger onPress={handleResetLocalData} />
            </View>
          </Card>
        ) : null}

        {activePanel === "preferences" ? (
          <Card>
            <SectionHeader title="Preferences" />
            <StatusNotice title={notificationTitle} message={notificationMessage} icon={settings.notificationsEnabled ? "bell-check-outline" : "bell-off-outline"} tone={settings.notificationsEnabled ? "success" : "warning"} />
            <DetailRow
              icon="bell-outline"
              title="Notifications"
              subtitle="Local care reminders when supported."
              right={<Switch value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateSettings({ ...settings, notificationsEnabled })} color={palette.teal} />}
            />
            <Divider />
            <DetailRow icon="clock-outline" title="Daily Summary" subtitle={`Preferred time: ${settings.dailySummaryTime}`} />
            <Divider />
            <DetailRow
              icon="chart-line"
              title="Analytics"
              subtitle="Product analytics are disabled unless you explicitly opt in."
              right={<Switch value={Boolean(settings.analyticsEnabled)} onValueChange={(analyticsEnabled) => updateSettings({ ...settings, analyticsEnabled })} color={palette.teal} />}
            />
            <Divider />
            <DetailRow
              icon="advertisements"
              title="Personalized Ads"
              subtitle="Controls consent for ad personalization separately from app use."
              right={<Switch value={Boolean(settings.adsPersonalizationConsent)} onValueChange={(adsPersonalizationConsent) => updateSettings({ ...settings, adsPersonalizationConsent })} color={palette.teal} />}
            />
          </Card>
        ) : null}

        {activePanel === "legal" ? (
          <>
            <Card>
              <SectionHeader title="Legal & Privacy" />
              <DetailRow
                icon="open-in-new"
                title="Full Privacy Policy"
                subtitle="Opens the standalone PetNexa AI Privacy Center website."
                right={<CompactButton label="Open" icon="open-in-new" onPress={openPrivacyPolicy} />}
              />
              <Divider />
              <DetailRow
                icon="shield-check-outline"
                title="Privacy Policy"
                subtitle={settings.privacyAcknowledgedAt ? `Acknowledged: ${settings.privacyAcknowledgedAt.slice(0, 10)}` : "Review and acknowledge before using online features."}
                right={
                  <CompactButton
                    label={settings.privacyAcknowledgedAt ? "Acknowledged" : "Acknowledge"}
                    icon="check-circle-outline"
                    primary={!settings.privacyAcknowledgedAt}
                    onPress={() => updateSettings({ ...settings, privacyAcknowledgedAt: new Date().toISOString() })}
                  />
                }
              />
              <Divider />
              <DetailRow
                icon="robot-outline"
                title="AI Safety Notice"
                subtitle={settings.aiDisclaimerAcceptedAt ? `Accepted: ${settings.aiDisclaimerAcceptedAt.slice(0, 10)}` : "AI guidance is informational and not a veterinary diagnosis."}
                right={
                  <CompactButton
                    label={settings.aiDisclaimerAcceptedAt ? "Accepted" : "Accept"}
                    icon="check-circle-outline"
                    primary={!settings.aiDisclaimerAcceptedAt}
                    onPress={() => updateSettings({ ...settings, aiDisclaimerAcceptedAt: new Date().toISOString() })}
                  />
                }
              />
            </Card>

            <SectionHeader title="Privacy Policy" />
            {privacyPolicySections.map((section) => <LegalBlock key={section.title} section={section} />)}

            <SectionHeader title="Terms" />
            {termsSections.map((section) => <LegalBlock key={section.title} section={section} />)}

            <SectionHeader title="AI Safety" />
            {aiSafetySections.map((section) => <LegalBlock key={section.title} section={section} />)}
          </>
        ) : null}

        {activePanel === "help" ? (
          <>
            <Card>
              <SectionHeader title="Help & Support" />
              <StatusNotice
                title="Emergency symptoms need a veterinarian"
                message="Breathing trouble, poisoning, seizures, severe injury, collapse, or rapidly worsening symptoms should go to urgent veterinary care."
                icon="hospital-box-outline"
                tone="danger"
              />
              <DetailRow
                icon="email-outline"
                title="Contact Support"
                subtitle={SUPPORT_EMAIL}
                right={<CompactButton label="Email" icon="email-outline" onPress={contactSupport} />}
              />
              <Divider />
              <DetailRow
                icon="database-search-outline"
                title="Data Request"
                subtitle="Use this for privacy questions, Home data requests, or provider-retention questions."
                right={<CompactButton label="Request" icon="email-fast-outline" onPress={contactDataRequest} />}
              />
              <Divider />
              <DetailRow
                icon="file-export-outline"
                title="Diagnostics"
                subtitle="Export local diagnostic logs only when support asks for them."
                right={<CompactButton label="Export" icon="file-export-outline" onPress={handleExportDiagnostics} />}
              />
            </Card>

            <SectionHeader title="Support FAQ" />
            {supportFaqSections.map((section) => <LegalBlock key={section.title} section={section} />)}
          </>
        ) : null}

        {activePanel === "about" ? (
          <Card>
            <View style={{ alignItems: "center", gap: 10 }}>
              <HeaderAppIcon size={72} />
              <View style={{ alignItems: "center", gap: 2 }}>
                <Text selectable style={{ color: palette.text, fontSize: 21, fontFamily: fontFamily.black }}>
                  {appInfo.name}
                </Text>
                <Text selectable style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.bold }}>
                  {appInfo.tagline}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: layout.isCompact ? 250 : undefined }}>
                <Chip label={`Version ${appInfo.version}`} active />
                <Chip label={`Developer: ${appInfo.developer}`} tone="navy" />
              </View>
            </View>
            <Divider />
            <DetailRow icon="shield-check-outline" title="Privacy" subtitle="Data stays local by default. Online use is limited to AI consultation, optional Home sync, sharing, and ads." />
            <Divider />
            <DetailRow icon="database-outline" title="Local Records" subtitle={`${pets.length} pets · ${records.length} records · ${consultations.length} AI consultations`} />
            <Divider />
            {releaseNotes.map((note) => (
              <DetailRow
                key={`${note.version}-${note.date}`}
                icon="history"
                title={`${note.version} · ${note.title}`}
                subtitle={`${note.date} · ${note.changes.join(" ")}`}
              />
            ))}
          </Card>
        ) : null}
      </ResponsiveScrollView>
    </Screen>
  );
}
