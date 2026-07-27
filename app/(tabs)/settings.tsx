import {
  Card,
  Chip,
  CompactButton,
  DropdownOption,
  Field,
  FormActions,
  HeaderActionButton,
  HeaderAppIcon,
  IconBubble,
  ResponsiveScrollView,
  Screen,
  ScreenHeader,
  SectionHeader,
  SelectDropdown,
  StatusNotice,
  UndoBanner,
  useResponsiveLayout
} from "@/components/ui";
import { appInfo } from "@/constants/app";
import { DEVELOPER_PORTFOLIO_URL, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/constants/legal";
import { fontFamily, palette, radii } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { getAgeYears, getReminderStatus, isValidIsoDate } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Text,
  View
} from "react-native";
import { Switch } from "react-native-paper";

const MIN_OWNER_AGE = 13;

type Panel = "profile" | "data" | "preferences" | "help" | "about";

type UndoState = {
  message: string;
  onUndo: () => Promise<void>;
};

const DAILY_SUMMARY_OPTIONS: DropdownOption[] = [
  {
    label: "06:00 AM",
    value: "06:00",
    subtitle: "Early morning summary",
    icon: "weather-sunset-up",
  },
  {
    label: "07:00 AM",
    value: "07:00",
    subtitle: "Morning care check",
    icon: "clock-outline",
  },
  {
    label: "08:00 AM (Default)",
    value: "08:00",
    subtitle: "Standard morning summary",
    icon: "clock-check-outline",
  },
  {
    label: "09:00 AM",
    value: "09:00",
    subtitle: "Late morning summary",
    icon: "clock-outline",
  },
  {
    label: "12:00 PM",
    value: "12:00",
    subtitle: "Mid-day summary",
    icon: "weather-sunny",
  },
  {
    label: "06:00 PM",
    value: "18:00",
    subtitle: "Evening care check",
    icon: "weather-sunset-down",
  },
  {
    label: "08:00 PM",
    value: "20:00",
    subtitle: "Night summary",
    icon: "moon-waning-crescent",
  },
  {
    label: "09:00 PM",
    value: "21:00",
    subtitle: "Late night summary",
    icon: "weather-night",
  },
];

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: palette.borderLight,
        marginVertical: 6,
      }}
    />
  );
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          minWidth: 0,
        }}
      >
        <IconBubble icon={icon} tone={active ? "teal" : "navy"} size={42} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            selectable
            numberOfLines={2}
            style={{
              color: active ? palette.tealDeep : palette.text,
              fontSize: 15,
              fontFamily: fontFamily.black,
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            numberOfLines={layout.isTiny ? 3 : 2}
            style={{
              color: palette.muted,
              fontSize: 13,
              lineHeight: 19,
              fontFamily: fontFamily.medium,
            }}
          >
            {subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={active ? "chevron-up" : "chevron-down"}
          color={active ? palette.teal : palette.muted}
          size={24}
        />
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
        <Text
          selectable
          numberOfLines={2}
          style={{
            color: palette.text,
            fontSize: 15,
            fontFamily: fontFamily.bold,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            selectable
            numberOfLines={3}
            style={{
              color: palette.muted,
              fontSize: 13,
              lineHeight: 19,
              fontFamily: fontFamily.medium,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <View style={{ alignSelf: layout.shouldStack ? "flex-start" : "auto" }}>
          {right}
        </View>
      ) : null}
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
      <Text
        style={{
          color: palette.danger,
          fontSize: 14,
          fontFamily: fontFamily.black,
        }}
      >
        {disabled
          ? "Logging Out"
          : mode === "home"
            ? "Log Out of Home"
            : "Exit Solo Mode"}
      </Text>
    </Pressable>
  );
}

function callNumber(value?: string) {
  if (!value) {
    Alert.alert("No phone number", "Add a phone number for this clinic first.");
    return;
  }
  Linking.openURL(`tel:${value}`).catch(() =>
    Alert.alert(
      "Call unavailable",
      "This device cannot open phone calls right now.",
    ),
  );
}

function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_POLICY_URL).catch(() =>
    Alert.alert(
      "Privacy policy unavailable",
      "This device cannot open the privacy policy right now.",
    ),
  );
}

function openDeveloperPortfolio() {
  Linking.openURL(DEVELOPER_PORTFOLIO_URL).catch(() =>
    Alert.alert(
      "Portfolio unavailable",
      "This device cannot open the developer portfolio right now.",
    ),
  );
}

function contactSupport() {
  const subject = encodeURIComponent("PetNexa AI support");
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() =>
    Alert.alert("Email unavailable", `Contact support at ${SUPPORT_EMAIL}.`),
  );
}

function contactDataRequest() {
  const subject = encodeURIComponent("PetNexa AI data request");
  const body = encodeURIComponent(
    "Please include your app version, device platform, care mode, and whether you use Home Furparent sync. Do not attach backups unless requested.",
  );
  Linking.openURL(
    `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
  ).catch(() =>
    Alert.alert("Email unavailable", `Contact support at ${SUPPORT_EMAIL}.`),
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
  const [syncing, setSyncing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const [ownerForm, setOwnerForm] = useState({
    fullName: owner?.fullName ?? "",
    birthday: owner?.birthday ?? "",
  });

  useEffect(() => {
    setOwnerForm({
      fullName: owner?.fullName ?? "",
      birthday: owner?.birthday ?? "",
    });
  }, [owner?.fullName, owner?.birthday]);

  const activeCare = reminders.filter((item) =>
    ["Due Today", "Overdue"].includes(getReminderStatus(item)),
  ).length;
  const pendingChanges = [...pets, ...records, ...reminders].filter(
    (item) => item.syncStatus === "pending" || item.syncStatus === "error",
  ).length;
  const dueToday = reminders.filter(
    (item) => getReminderStatus(item) === "Due Today",
  ).length;
  const overdue = reminders.filter(
    (item) => getReminderStatus(item) === "Overdue",
  ).length;
  const upcoming = reminders.filter(
    (item) => getReminderStatus(item) === "Upcoming",
  ).length;
  const careModeLabel =
    settings.careMode === "home"
      ? "Home Furparent"
      : settings.careMode === "solo"
        ? "Solo Furparent"
        : "Choose mode";
  const syncState =
    settings.careMode !== "home"
      ? "Solo mode"
      : syncing
        ? "Syncing"
        : settings.syncEnabled
          ? "Ready"
          : "Off";
  const syncTone = settings.lastSyncError
    ? "danger"
    : pendingChanges > 0
      ? "warning"
      : settings.careMode === "home"
        ? "success"
        : "navy";
  const syncTitle =
    settings.careMode === "home"
      ? settings.lastSyncError
        ? "Home sync needs attention"
        : pendingChanges > 0
          ? "Home sync has pending changes"
          : "Home sync ready"
      : "Solo mode is local-only";
  const syncMessage =
    settings.careMode === "home"
      ? settings.lastSyncError ||
        `${pendingChanges} pending · Last synced: ${settings.lastSyncAt || "Not yet"}`
      : "Your pet data stays on this device unless you export a backup or switch to Home.";
  const notificationTitle = settings.notificationsEnabled
    ? "Care reminders enabled"
    : "Care reminders off";
  const notificationMessage = settings.notificationsEnabled
    ? `${dueToday} due today · ${overdue} overdue · ${upcoming} upcoming`
    : "Turn notifications on to receive local care reminders on supported devices.";

  const submitOwner = async () => {
    const fullName = ownerForm.fullName.trim();
    const birthday = ownerForm.birthday.trim();

    if (!fullName)
      return Alert.alert("Name required", "Enter the owner full name.");
    if (!isValidIsoDate(birthday))
      return Alert.alert("Invalid birthday", "Use YYYY-MM-DD format.");
    if (getAgeYears(birthday) < MIN_OWNER_AGE)
      return Alert.alert(
        "Age requirement",
        `Owner must be at least ${MIN_OWNER_AGE} years old.`,
      );

    await saveOwner({ id: owner.id, fullName, birthday });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncHomeNow();
      Alert.alert("Sync complete", "Your Home Furparent data is up to date.");
    } catch {
      Alert.alert(
        "Sync unavailable",
        "Check your connection and Home Furparent setup, then try again.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = async () => {
    try {
      await exportData();
    } catch {
      Alert.alert(
        "Export failed",
        "PetNexa AI could not create a backup on this device.",
      );
    }
  };

  const handleImportData = async () => {
    try {
      await restoreDataReplaceMode();
    } catch (error) {
      if (error instanceof Error && error.message === "Restore cancelled.")
        return;
      Alert.alert(
        "Import failed",
        error instanceof Error
          ? error.message
          : "PetNexa AI could not import this backup.",
      );
    }
  };

  const handleExportDiagnostics = async () => {
    try {
      await exportDiagnostics();
    } catch {
      Alert.alert(
        "Export failed",
        "Diagnostics could not be exported on this device.",
      );
    }
  };

  const handleClearDiagnostics = async () => {
    await clearDiagnostics();
    Alert.alert(
      "Diagnostics cleared",
      "Local diagnostic events were removed from this device.",
    );
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
          onPress: () =>
            resetLocalData().catch(() =>
              Alert.alert(
                "Delete failed",
                "Could not clear local data right now.",
              ),
            ),
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
      Alert.alert(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "Could not log out on this device.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <ResponsiveScrollView contentContainerStyle={{ gap: 14 }}>
        <ScreenHeader
          title="Settings"
          subtitle="App settings & account."
          right={
            <HeaderActionButton
              icon="home-outline"
              label="Go home"
              active
              onPress={() => router.replace("/")}
            />
          }
        />

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <IconBubble icon="account-circle-outline" tone="teal" size={48} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontSize: 18,
                  fontFamily: fontFamily.black,
                }}
              >
                {owner.fullName || "Pet Parent"}
              </Text>
              <Text
                selectable
                style={{
                  color: palette.muted,
                  fontSize: 13,
                  lineHeight: 19,
                  fontFamily: fontFamily.medium,
                }}
              >
                {careModeLabel} · {pets.length} pets
              </Text>
            </View>
          </View>
        </Card>

        {settings.careMode ? (
          <Card style={{ gap: 0 }}>
            <DetailRow
              icon={
                settings.careMode === "home"
                  ? "home-account"
                  : "account-lock-outline"
              }
              title={
                settings.careMode === "home" ? "Home Account" : "Solo Account"
              }
              subtitle={
                settings.careMode === "home"
                  ? settings.homeName || "Sync connected"
                  : "Local mode"
              }
            />
            <LogoutAction
              mode={settings.careMode}
              disabled={loggingOut}
              onPress={handleLogout}
            />
          </Card>
        ) : null}

        <SectionHeader title="Settings" />
        {undo ? (
          <UndoBanner
            message={undo.message}
            onDismiss={() => setUndo(null)}
            onUndo={() => {
              undo
                .onUndo()
                .catch(() =>
                  Alert.alert("Restore failed", "Could not restore item."),
                );
              setUndo(null);
            }}
          />
        ) : null}

        <Card style={{ gap: 4, padding: 6 }}>
          {/* 1. Owner Profile Accordion */}
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor:
                activePanel === "profile" ? palette.neutralBg : "#FFFFFF",
              borderWidth: 1,
              borderColor:
                activePanel === "profile" ? palette.border : "transparent",
              borderLeftWidth: activePanel === "profile" ? 4 : 0,
              borderLeftColor:
                activePanel === "profile" ? palette.teal : "transparent",
              paddingHorizontal: 8,
              overflow: "hidden",
            }}
          >
            <MenuRow
              icon="account-outline"
              title="Owner Profile"
              subtitle="Name & birthday"
              active={activePanel === "profile"}
              onPress={() =>
                setActivePanel(activePanel === "profile" ? null : "profile")
              }
            />
            {activePanel === "profile" ? (
              <View
                style={{
                  paddingHorizontal: 4,
                  paddingBottom: 14,
                  paddingTop: 4,
                  gap: 10,
                }}
              >
                <Divider />
                <SectionHeader title="Owner Profile" />
                <Field
                  label="Full Name"
                  value={ownerForm.fullName}
                  onChangeText={(fullName) =>
                    setOwnerForm((current) => ({ ...current, fullName }))
                  }
                />
                <Field
                  label="Birthday"
                  value={ownerForm.birthday}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(birthday) =>
                    setOwnerForm((current) => ({ ...current, birthday }))
                  }
                />
                <FormActions
                  submitLabel="Save"
                  submitIcon="content-save-outline"
                  onSubmit={submitOwner}
                  onCancel={() => setActivePanel(null)}
                />
              </View>
            ) : null}
          </View>

          <Divider />

          {/* 2. Data Accordion */}
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor:
                activePanel === "data" ? palette.neutralBg : "#FFFFFF",
              borderWidth: 1,
              borderColor:
                activePanel === "data" ? palette.border : "transparent",
              borderLeftWidth: activePanel === "data" ? 4 : 0,
              borderLeftColor:
                activePanel === "data" ? palette.teal : "transparent",
              paddingHorizontal: 8,
              overflow: "hidden",
            }}
          >
            <MenuRow
              icon="database-sync-outline"
              title="Data"
              subtitle="Backup & sync"
              active={activePanel === "data"}
              onPress={() =>
                setActivePanel(activePanel === "data" ? null : "data")
              }
            />
            {activePanel === "data" ? (
              <View
                style={{
                  paddingHorizontal: 4,
                  paddingBottom: 14,
                  paddingTop: 4,
                  gap: 10,
                }}
              >
                <Divider />
                <SectionHeader title="Data Settings" />
                <StatusNotice
                  title={syncTitle}
                  message={syncMessage}
                  icon={
                    settings.careMode === "home"
                      ? "cloud-sync-outline"
                      : "cellphone-lock"
                  }
                  tone={syncTone}
                />

                <DetailRow
                  icon="backup-restore"
                  title="Backup & Restore"
                  subtitle="JSON file backup & restore"
                  right={
                    <View
                      style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}
                    >
                      <CompactButton
                        label="Export"
                        icon="export"
                        onPress={handleExportData}
                      />
                      <CompactButton
                        label="Import"
                        icon="import"
                        danger
                        onPress={handleImportData}
                      />
                    </View>
                  }
                />

                <Divider />

                <DetailRow
                  icon="cloud-sync-outline"
                  title="Home Sync"
                  subtitle={settings.careMode === "home" ? "Automatic sync active" : "Solo mode (local only)"}
                />

                {settings.lastSyncError ? (
                  <>
                    <Divider />
                    <DetailRow
                      icon="alert-circle-outline"
                      title="Sync Issue"
                      subtitle={settings.lastSyncError}
                      danger
                    />
                  </>
                ) : null}

                <Divider />

                <DetailRow
                  icon="database-remove-outline"
                  title="Delete Local Data"
                  subtitle="Deletes data on this device"
                  danger
                  right={
                    <CompactButton
                      label="Delete Local Data"
                      icon="trash-can-outline"
                      danger
                      onPress={handleResetLocalData}
                    />
                  }
                />
              </View>
            ) : null}
          </View>

          <Divider />

          {/* 3. Preferences Accordion */}
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor:
                activePanel === "preferences" ? palette.neutralBg : "#FFFFFF",
              borderWidth: 1,
              borderColor:
                activePanel === "preferences" ? palette.border : "transparent",
              borderLeftWidth: activePanel === "preferences" ? 4 : 0,
              borderLeftColor:
                activePanel === "preferences" ? palette.teal : "transparent",
              paddingHorizontal: 8,
              overflow: "hidden",
            }}
          >
            <MenuRow
              icon="bell-outline"
              title="Preferences"
              subtitle="Reminders & summary"
              active={activePanel === "preferences"}
              onPress={() =>
                setActivePanel(
                  activePanel === "preferences" ? null : "preferences",
                )
              }
            />
            {activePanel === "preferences" ? (
              <View
                style={{
                  paddingHorizontal: 4,
                  paddingBottom: 14,
                  paddingTop: 4,
                  gap: 10,
                }}
              >
                <Divider />
                <SectionHeader title="Preferences" />
                <StatusNotice
                  title={notificationTitle}
                  message={notificationMessage}
                  icon={
                    settings.notificationsEnabled
                      ? "bell-check-outline"
                      : "bell-off-outline"
                  }
                  tone={settings.notificationsEnabled ? "success" : "warning"}
                />
                <DetailRow
                  icon="bell-outline"
                  title="Notifications"
                  subtitle="Care reminder alerts"
                  right={
                    <Switch
                      value={settings.notificationsEnabled}
                      onValueChange={(notificationsEnabled) =>
                        updateSettings({ ...settings, notificationsEnabled })
                      }
                      color={palette.teal}
                    />
                  }
                />
                <Divider />
                <SelectDropdown
                  label="Summary Time"
                  value={settings.dailySummaryTime || "08:00"}
                  options={DAILY_SUMMARY_OPTIONS}
                  icon="clock-outline"
                  onSelect={(newTime) => {
                    updateSettings({ ...settings, dailySummaryTime: newTime });
                    Alert.alert(
                      "Preference saved",
                      `Daily summary time set to ${DAILY_SUMMARY_OPTIONS.find((o) => o.value === newTime)?.label || newTime}`,
                    );
                  }}
                />
              </View>
            ) : null}
          </View>

          <Divider />

          {/* 4. Help & Support Accordion */}
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor:
                activePanel === "help" ? palette.neutralBg : "#FFFFFF",
              borderWidth: 1,
              borderColor:
                activePanel === "help" ? palette.border : "transparent",
              borderLeftWidth: activePanel === "help" ? 4 : 0,
              borderLeftColor:
                activePanel === "help" ? palette.teal : "transparent",
              paddingHorizontal: 8,
              overflow: "hidden",
            }}
          >
            <MenuRow
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Contact support"
              active={activePanel === "help"}
              onPress={() =>
                setActivePanel(activePanel === "help" ? null : "help")
              }
            />
            {activePanel === "help" ? (
              <View
                style={{
                  paddingHorizontal: 4,
                  paddingBottom: 14,
                  paddingTop: 4,
                  gap: 10,
                }}
              >
                <Divider />
                <SectionHeader title="Help & Support" />
                <StatusNotice
                  title="Emergency symptoms need a veterinarian"
                  message="Urgent symptoms require immediate veterinary care."
                  icon="hospital-box-outline"
                  tone="danger"
                />
                <DetailRow
                  icon="email-outline"
                  title="Contact Support"
                  subtitle={SUPPORT_EMAIL}
                  right={
                    <CompactButton
                      label="Email"
                      icon="email-outline"
                      onPress={contactSupport}
                    />
                  }
                />
                <Divider />
                <DetailRow
                  icon="database-search-outline"
                  title="Data Request"
                  subtitle="Privacy & data requests"
                  right={
                    <CompactButton
                      label="Request"
                      icon="email-fast-outline"
                      onPress={contactDataRequest}
                    />
                  }
                />
              </View>
            ) : null}
          </View>
        </Card>

        {/* Standalone About Card */}
        <Card style={{ gap: 12, padding: 16 }}>
          <SectionHeader title="About PetNexa AI" />
          <View style={{ alignItems: "center", gap: 10, paddingVertical: 6 }}>
            <HeaderAppIcon size={72} />
            <View style={{ alignItems: "center", gap: 2 }}>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontSize: 21,
                  fontFamily: fontFamily.black,
                }}
              >
                {appInfo.name}
              </Text>
              <Text
                selectable
                style={{
                  color: palette.teal,
                  fontSize: 13,
                  fontFamily: fontFamily.bold,
                }}
              >
                {appInfo.tagline}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
                maxWidth: layout.isCompact ? 250 : undefined,
              }}
            >
              <Chip label={`Version ${appInfo.version}`} active />
              <Chip
                label={`Developer: ${appInfo.developer}`}
                tone="navy"
              />
            </View>
            <Text
              selectable
              style={{
                color: palette.muted,
                fontSize: 13,
                lineHeight: 19,
                fontFamily: fontFamily.medium,
                textAlign: "center",
                paddingHorizontal: 8,
              }}
            >
              {appInfo.description}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginTop: 4,
              justifyContent: "center",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Privacy Policy"
              onPress={openPrivacyPolicy}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                minHeight: 40,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.neutralBg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingHorizontal: 6,
              })}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                color={palette.teal}
                size={16}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: palette.text,
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                }}
              >
                Privacy Policy
              </Text>
              <MaterialCommunityIcons
                name="open-in-new"
                color={palette.muted}
                size={13}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open About Developer Portfolio"
              onPress={openDeveloperPortfolio}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                minHeight: 40,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.neutralBg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingHorizontal: 6,
              })}
            >
              <MaterialCommunityIcons
                name="code-tags"
                color={palette.teal}
                size={16}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: palette.text,
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                }}
              >
                About Developer
              </Text>
              <MaterialCommunityIcons
                name="open-in-new"
                color={palette.muted}
                size={13}
              />
            </Pressable>
          </View>
        </Card>
      </ResponsiveScrollView>
    </Screen>
  );
}
