import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Share, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { BrandMark, Field, useResponsiveLayout } from "@/components/ui";
import { MIN_OWNER_AGE } from "@/constants/owner";
import { fontFamily, gradients, palette, radii } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import type { HomeAccount } from "@/services/home-sync";
import { getAgeYears, isValidIsoDate } from "@/utils/date";

function validateOwnerProfile(fullName: string, birthday: string) {
  const name = fullName.trim();
  const birthDate = birthday.trim();
  if (!name) return "Enter your full name so PetNexa AI can greet you properly.";
  if (!isValidIsoDate(birthDate)) return "Enter a valid birthday using YYYY-MM-DD.";
  if (getAgeYears(birthDate) < MIN_OWNER_AGE) return `You must be at least ${MIN_OWNER_AGE} years old to use PetNexa AI.`;
  return "";
}

function Panel({ children }: { children: React.ReactNode }) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
        backgroundColor: "#fff",
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: palette.borderLight,
        padding: layout.isTiny ? 12 : layout.isCompact ? 14 : 16,
        gap: 12,
        boxShadow: "0 4px 16px rgba(30,58,138,0.08)",
      }}
    >
      {children}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  secondary,
  danger,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  const bg = danger ? palette.danger : secondary ? "#fff" : palette.teal;
  const fg = danger || !secondary ? "#fff" : palette.navy;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        minHeight: 50,
        borderRadius: radii.pill,
        backgroundColor: bg,
        borderWidth: secondary ? 1.5 : 0,
        borderColor: danger ? palette.danger : palette.border,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        minWidth: 0,
      })}
    >
      <MaterialCommunityIcons name={icon} color={fg} size={18} />
      <Text numberOfLines={2} style={{ color: fg, fontSize: 14, fontFamily: fontFamily.black, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function PaperActionButton({
  label,
  icon,
  onPress,
  disabled,
  secondary,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Button
      mode={secondary ? "outlined" : "contained"}
      icon={icon}
      disabled={disabled}
      onPress={onPress}
      buttonColor={secondary ? "#fff" : palette.teal}
      textColor={secondary ? palette.navy : "#fff"}
      style={{
        borderRadius: radii.pill,
        borderColor: secondary ? palette.border : palette.teal,
      }}
      contentStyle={{ minHeight: 50, paddingHorizontal: 12 }}
      labelStyle={{ fontSize: 14, fontFamily: fontFamily.black, letterSpacing: 0 }}
    >
      {label}
    </Button>
  );
}

function ModeButton({
  title,
  subtitle,
  icon,
  onPress,
  primary,
  expanded,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  primary?: boolean;
  expanded?: boolean;
  disabled?: boolean;
}) {
  const layout = useResponsiveLayout();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        width: "100%",
        minHeight: 76,
        borderRadius: radii.xl,
        padding: 14,
        backgroundColor: primary ? palette.teal : "#fff",
        borderWidth: primary ? 0 : 1.5,
        borderColor: expanded ? palette.teal : palette.borderLight,
        flexDirection: layout.isTiny ? "column" : "row",
        alignItems: layout.isTiny ? "flex-start" : "center",
        gap: 12,
        minWidth: 0,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? "rgba(255,255,255,0.22)" : palette.softTeal,
        }}
      >
        <MaterialCommunityIcons name={icon} color={primary ? "#fff" : palette.teal} size={24} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={2} style={{ color: primary ? "#fff" : palette.text, fontSize: 16, fontFamily: fontFamily.black }}>
          {title}
        </Text>
        <Text numberOfLines={3} style={{ color: primary ? "rgba(255,255,255,0.88)" : palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
          {subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons name={primary ? "arrow-right" : expanded ? "chevron-up" : "chevron-down"} color={primary ? "#fff" : palette.teal} size={23} />
    </Pressable>
  );
}

export function OwnerOnboarding() {
  const {
    owner,
    settings,
    saveOwner,
    chooseSoloMode,
    sendHomeOtp,
    verifyHomeOtp,
    signInHomeWithGoogle,
    hasHomeAuthSession,
    listHomeAccounts,
    selectHomeAccount,
    deleteHomeAccount,
    logoutHomeAccount,
    createHomeAccount,
    joinHomeAccount,
  } = useAppData();
  const layout = useResponsiveLayout();

  const [fullName, setFullName] = useState(owner.fullName);
  const [birthday, setBirthday] = useState(owner.birthday);
  const [homeName, setHomeName] = useState("");
  const [createdHomeName, setCreatedHomeName] = useState(settings.homeName ?? "");
  const [homeAccounts, setHomeAccounts] = useState<HomeAccount[]>([]);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loadingHomes, setLoadingHomes] = useState(false);
  const [pendingDeleteHomeId, setPendingDeleteHomeId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [showHomeSetup, setShowHomeSetup] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const typedOwnerIsValid = Boolean(fullName.trim()) && isValidIsoDate(birthday) && getAgeYears(birthday) >= MIN_OWNER_AGE;
  const storedOwnerIsValid = Boolean(owner.fullName.trim()) && isValidIsoDate(owner.birthday) && getAgeYears(owner.birthday) >= MIN_OWNER_AGE;
  const needsProfile = !storedOwnerIsValid;

  const loadHomeAccounts = async () => {
    setLoadingHomes(true);
    try {
      const homes = await listHomeAccounts();
      setHomeAccounts(homes);
      if (homes.length) {
        setMessage("Choose an existing Home or create a new one.");
      } else {
        setMessage("No Home account found yet. Create one to start shared care.");
      }
    } catch (error) {
      setHomeAccounts([]);
      setMessage(error instanceof Error ? error.message : "Could not load Home accounts.");
    } finally {
      setLoadingHomes(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    hasHomeAuthSession()
      .then((signedIn) => {
        if (!mounted || !signedIn) return;
        setVerified(true);
        setShowHomeSetup(true);
        if (storedOwnerIsValid) {
          setMessage("Account connected. Loading Home accounts...");
          loadHomeAccounts().catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [hasHomeAuthSession, storedOwnerIsValid]);

  const saveProfile = async () => {
    const validation = validateOwnerProfile(fullName, birthday);
    if (validation) {
      setMessage(validation);
      return;
    }
    setBusy(true);
    try {
      await saveOwner({ id: owner.id, fullName: fullName.trim(), birthday: birthday.trim() });
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  const startSolo = async () => {
    setBusy(true);
    try {
      await chooseSoloMode();
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    try {
      await signInHomeWithGoogle();
      setVerified(true);
      setMessage("Google account connected. Loading Home accounts...");
      await loadHomeAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    const email = otpEmail.trim();
    if (!email || !email.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await sendHomeOtp(email);
      setOtpSent(true);
      setMessage("OTP sent. Check your email, then enter the code.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const email = otpEmail.trim();
    const token = otpToken.trim();
    if (!email || !token) {
      setMessage("Enter your email and OTP code.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await verifyHomeOtp(email, token);
      setVerified(true);
      setMessage("Account connected. Loading Home accounts...");
      await loadHomeAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const createHome = async () => {
    Keyboard.dismiss();
    if (busy) return;
    setBusy(true);
    setMessage("Creating Home account...");
    try {
      const signedIn = await hasHomeAuthSession();
      if (!signedIn) {
        setVerified(false);
        setMessage("Account disconnected. Sign in with Google before creating a Home account.");
        return;
      }
      const finalHomeName = await createHomeAccount(homeName || `${fullName.split(" ")[0] || "PetNexa"} Home`);
      setCreatedHomeName(finalHomeName);
      setHomeName(finalHomeName);
      setMessage(`${finalHomeName} created. Opening PetNexa AI...`);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Could not create Home account.";
      setMessage(nextMessage);
      Alert.alert("Create Home failed", nextMessage);
    } finally {
      setBusy(false);
    }
  };

  const changeAccount = async () => {
    Keyboard.dismiss();
    if (busy) return;
    setBusy(true);
    try {
      await logoutHomeAccount();
      setVerified(false);
      setCreatedHomeName("");
      setHomeAccounts([]);
      setMessage("Account disconnected. Sign in again to create or join a Home.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not disconnect account.");
    } finally {
      setBusy(false);
    }
  };

  const enterHome = async (home: HomeAccount) => {
    if (busy) return;
    setBusy(true);
    setMessage(`Opening ${home.homeName}...`);
    try {
      await selectHomeAccount(home);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open Home account.");
      Alert.alert("Home unavailable", error instanceof Error ? error.message : "Could not open Home account.");
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async (home: HomeAccount) => {
    if (!home.inviteCode) {
      setMessage("Invite code is not available for this Home yet.");
      return;
    }
    try {
      await Share.share({
        title: "PetNexa AI Fur Home invitation",
        message: `Join ${home.homeName} in PetNexa AI with invite code: ${home.inviteCode}`,
      });
      setMessage(`Invite code for ${home.homeName}: ${home.inviteCode}`);
    } catch {
      setMessage(`Invite code for ${home.homeName}: ${home.inviteCode}`);
    }
  };

  const joinFurHome = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setMessage("Enter the Fur Home invite code.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setMessage("Joining Fur Home...");
    try {
      await joinHomeAccount(code);
      setInviteCode("");
      setMessage("Fur Home joined. Opening PetNexa AI...");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Could not join Fur Home.";
      setMessage(nextMessage);
      Alert.alert("Join Fur Home failed", nextMessage);
    } finally {
      setBusy(false);
    }
  };

  const requestDeleteHome = (home: HomeAccount) => {
    if (home.role !== "owner") {
      setMessage("Only the Home owner can delete this Home.");
      return;
    }
    setPendingDeleteHomeId(home.homeId);
    setMessage(`Confirm deletion of ${home.homeName}.`);
  };

  const confirmDeleteHome = async (home: HomeAccount) => {
    if (busy) return;
    setBusy(true);
    setMessage(`Deleting ${home.homeName}...`);
    try {
      await deleteHomeAccount(home);
      setHomeAccounts((current) => current.filter((item) => item.homeId !== home.homeId));
      setPendingDeleteHomeId(null);
      if (createdHomeName === home.homeName || settings.homeName === home.homeName) setCreatedHomeName("");
      setMessage(`${home.homeName} deleted.`);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Could not delete Home account.";
      setMessage(nextMessage);
      Alert.alert("Delete Home failed", nextMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <LinearGradient colors={gradients.calm} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: needsProfile ? "center" : "flex-start",
              paddingHorizontal: layout.isCompact ? 14 : layout.isTablet ? 28 : 22,
              paddingVertical: layout.isCompact ? 18 : 22,
              paddingTop: needsProfile ? 22 : layout.isTablet ? 72 : 64,
              paddingBottom: 40,
              gap: 18,
              alignItems: "center",
            }}
          >
            <View style={{ alignItems: "center", gap: 8, width: "100%", maxWidth: 520 }}>
              <BrandMark />
              <Text selectable style={{ color: palette.text, fontSize: 20, fontFamily: fontFamily.black, textAlign: "center", letterSpacing: 0 }}>
                {needsProfile ? "Set up your owner profile" : "Choose your care mode"}
              </Text>
              <Text selectable style={{ color: palette.muted, fontSize: layout.isCompact ? 13 : 14, fontFamily: fontFamily.medium, lineHeight: 22, textAlign: "center", maxWidth: 360 }}>
                {needsProfile
                  ? "PetNexa AI needs your name for greetings and your birthday to confirm age eligibility."
                  : "Choose Solo for local use or Home to sync with your household."}
              </Text>
            </View>

            {needsProfile ? (
              <Panel>
                <View style={{ flexDirection: layout.isTiny ? "column" : "row", alignItems: layout.isTiny ? "flex-start" : "center", gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: radii.pill, backgroundColor: palette.softTeal, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.mintLight }}>
                    <MaterialCommunityIcons name="account-heart-outline" color={palette.teal} size={25} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text selectable style={{ color: palette.text, fontSize: 17, fontFamily: fontFamily.black }}>Owner Details</Text>
                    <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.medium }}>Required before entering the app</Text>
                  </View>
                </View>
                <Field label="Full Name" value={fullName} onChangeText={(text) => { setFullName(text); setMessage(""); }} />
                <Field label="Birthday" value={birthday} placeholder="YYYY-MM-DD" onChangeText={(text) => { setBirthday(text); setMessage(""); }} />
                {message ? <Text selectable style={{ color: palette.danger, fontSize: 13, fontFamily: fontFamily.bold, lineHeight: 19 }}>{message}</Text> : null}
                <ActionButton label={busy ? "Saving..." : "Continue"} icon="arrow-right" disabled={busy} onPress={saveProfile} />
              </Panel>
            ) : null}

            {!needsProfile ? (
              <View style={{ width: "100%", maxWidth: 560, gap: 12 }}>
                <ModeButton
                  title="Continue Solo"
                  subtitle="Private local care on this device."
                  icon="cellphone"
                  primary
                  disabled={busy}
                  onPress={startSolo}
                />
                <ModeButton
                  title="Home Furparent"
                  subtitle="Sync shared pet care with your household."
                  icon="home-heart"
                  expanded={showHomeSetup}
                  onPress={() => setShowHomeSetup((value) => !value)}
                />

                {showHomeSetup ? (
                  <Panel>
                    <View style={{ gap: 4 }}>
                      <Text selectable style={{ color: palette.text, fontSize: 18, fontFamily: fontFamily.black }}>Home setup</Text>
                      <Text selectable style={{ color: palette.muted, lineHeight: 21, fontFamily: fontFamily.medium, fontSize: 13 }}>
                        {verified ? "Google account connected. Choose an existing Home or create a new one." : "Sign in with Google first, then choose or create a Home account."}
                      </Text>
                    </View>

                    {!verified ? (
                      <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: layout.isTiny ? "column" : "row", alignItems: layout.isTiny ? "flex-start" : "center", gap: 12, backgroundColor: palette.softTeal, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.mintLight, padding: 14 }}>
                          <View style={{ width: 42, height: 42, borderRadius: radii.pill, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                            <MaterialCommunityIcons name="google" color={palette.navy} size={22} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <Text selectable style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.black }}>Google account</Text>
                            <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                              Used only for shared Home sync.
                            </Text>
                          </View>
                        </View>
                        <PaperActionButton label={busy ? "Opening Google..." : "Continue with Google"} icon="google" disabled={busy} onPress={continueWithGoogle} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: palette.borderLight }} />
                          <Text selectable style={{ color: palette.muted, fontSize: 12, fontFamily: fontFamily.bold }}>or use email OTP</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: palette.borderLight }} />
                        </View>
                        <Field label="Email" value={otpEmail} placeholder="you@example.com" onChangeText={(text) => { setOtpEmail(text); setMessage(""); }} />
                        {otpSent ? (
                          <Field label="OTP Code" value={otpToken} placeholder="123456" onChangeText={(text) => { setOtpToken(text); setMessage(""); }} />
                        ) : null}
                        <PaperActionButton
                          label={busy ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
                          icon={otpSent ? "check-circle-outline" : "email-outline"}
                          secondary
                          disabled={busy}
                          onPress={otpSent ? verifyOtp : sendOtp}
                        />
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: layout.isTiny ? "column" : "row", alignItems: layout.isTiny ? "flex-start" : "center", gap: 10, backgroundColor: palette.softTeal, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.mintLight, padding: 12 }}>
                          <MaterialCommunityIcons name="check-circle-outline" color={palette.teal} size={22} />
                          <Text selectable numberOfLines={2} style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.bold, flex: 1, minWidth: 0 }}>
                            Account connected
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={changeAccount}
                            style={({ pressed }) => ({
                              opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                              borderRadius: radii.pill,
                              backgroundColor: "#fff",
                              borderWidth: 1,
                              borderColor: palette.mintLight,
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                            })}
                          >
                            <Text style={{ color: palette.navy, fontSize: 13, fontFamily: fontFamily.bold }}>Change</Text>
                          </Pressable>
                        </View>
                        {settings.homeName || createdHomeName ? (
                          <View style={{ backgroundColor: "#fff", borderRadius: radii.lg, borderWidth: 1, borderColor: palette.mintLight, padding: 12, gap: 3 }}>
                            <Text selectable style={{ color: palette.muted, fontSize: 12, fontFamily: fontFamily.bold, textTransform: "uppercase" }}>
                              Current Home
                            </Text>
                            <Text selectable style={{ color: palette.text, fontSize: 17, fontFamily: fontFamily.black }}>
                              {settings.homeName || createdHomeName}
                            </Text>
                          </View>
                        ) : null}
                        {loadingHomes ? (
                          <View style={{ backgroundColor: palette.softTeal, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.mintLight, padding: 12, flexDirection: layout.isTiny ? "column" : "row", alignItems: layout.isTiny ? "flex-start" : "center", gap: 10 }}>
                            <MaterialCommunityIcons name="cloud-search-outline" color={palette.teal} size={20} />
                            <Text selectable numberOfLines={2} style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.bold }}>
                              Loading Home accounts...
                            </Text>
                          </View>
                        ) : homeAccounts.length ? (
                          <View style={{ gap: 8 }}>
                            <Text selectable style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.black }}>
                              Existing Homes
                            </Text>
                            {homeAccounts.map((home) => (
                              <View key={home.homeId} style={{ gap: 8 }}>
                                <View
                                  style={{
                                    backgroundColor: "#fff",
                                    borderRadius: radii.lg,
                                    borderWidth: 1.5,
                                    borderColor: pendingDeleteHomeId === home.homeId ? "#FECACA" : palette.borderLight,
                                    padding: 12,
                                    gap: 12,
                                  }}
                                >
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <View style={{ width: 42, height: 42, borderRadius: radii.pill, backgroundColor: palette.softTeal, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <MaterialCommunityIcons name="home-heart" color={palette.teal} size={20} />
                                    </View>
                                    <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                                      <Text selectable numberOfLines={2} style={{ color: palette.text, fontSize: 17, lineHeight: 22, fontFamily: fontFamily.black }}>
                                        {home.homeName}
                                      </Text>
                                      <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                                        {home.role === "owner" ? "Created by you" : "Shared with you"}
                                      </Text>
                                    </View>
                                  </View>

                                  {home.role === "owner" && home.inviteCode ? (
                                    <View style={{ alignSelf: "flex-start", borderRadius: radii.pill, backgroundColor: palette.softTeal, borderWidth: 1, borderColor: palette.mintLight, paddingHorizontal: 11, paddingVertical: 6 }}>
                                      <Text selectable style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.black }}>
                                        Invite: {home.inviteCode}
                                      </Text>
                                    </View>
                                  ) : null}

                                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={`Open ${home.homeName}`}
                                      disabled={busy}
                                      onPress={() => enterHome(home)}
                                      style={({ pressed }) => ({
                                        opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                                        minHeight: 40,
                                        borderRadius: radii.pill,
                                        backgroundColor: palette.teal,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 6,
                                        paddingHorizontal: 14,
                                      })}
                                    >
                                      <MaterialCommunityIcons name="login-variant" color="#fff" size={16} />
                                      <Text style={{ color: "#fff", fontSize: 13, fontFamily: fontFamily.black }}>Open</Text>
                                    </Pressable>
                                    {home.role === "owner" ? (
                                      <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Share invite for ${home.homeName}`}
                                        disabled={busy}
                                        onPress={() => shareInvite(home)}
                                        style={({ pressed }) => ({
                                          opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                                          minHeight: 40,
                                          borderRadius: radii.pill,
                                          backgroundColor: palette.softTeal,
                                          borderWidth: 1,
                                          borderColor: palette.mintLight,
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 6,
                                          paddingHorizontal: 12,
                                        })}
                                      >
                                        <MaterialCommunityIcons name="share-variant-outline" color={palette.teal} size={16} />
                                        <Text style={{ color: palette.teal, fontSize: 13, fontFamily: fontFamily.black }}>Invite</Text>
                                      </Pressable>
                                    ) : null}
                                    {home.role === "owner" ? (
                                      <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Delete ${home.homeName}`}
                                      disabled={busy}
                                      onPress={() => requestDeleteHome(home)}
                                      style={({ pressed }) => ({
                                        opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                                        minHeight: 40,
                                        borderRadius: radii.pill,
                                        backgroundColor: palette.dangerSoft,
                                        borderWidth: 1,
                                        borderColor: "#FECACA",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 6,
                                        paddingHorizontal: 12,
                                      })}
                                    >
                                      <MaterialCommunityIcons name="trash-can-outline" color={palette.danger} size={18} />
                                      <Text style={{ color: palette.danger, fontSize: 13, fontFamily: fontFamily.black }}>Delete</Text>
                                    </Pressable>
                                  ) : null}
                                  </View>
                                </View>
                                {pendingDeleteHomeId === home.homeId ? (
                                  <View style={{ borderRadius: radii.lg, backgroundColor: "#FFF7F7", borderWidth: 1.5, borderColor: "#FECACA", padding: 12, gap: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 }}>
                                      <MaterialCommunityIcons name="alert-circle-outline" color={palette.danger} size={18} />
                                      <Text selectable numberOfLines={2} style={{ color: palette.text, fontSize: 14, lineHeight: 18, fontFamily: fontFamily.black, flex: 1, minWidth: 0 }}>
                                        Delete Home?
                                      </Text>
                                    </View>
                                    <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                                      {home.homeName} and its synced care data will be removed for every device.
                                    </Text>
                                    <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                      <Pressable
                                        accessibilityRole="button"
                                        disabled={busy}
                                        onPress={() => {
                                          setPendingDeleteHomeId(null);
                                          setMessage("Choose an existing Home or create a new one.");
                                        }}
                                        style={({ pressed }) => ({
                                          opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                                          borderRadius: radii.pill,
                                          borderWidth: 1,
                                          borderColor: palette.border,
                                          backgroundColor: "#fff",
                                          paddingHorizontal: 16,
                                          paddingVertical: 9,
                                        })}
                                      >
                                        <Text style={{ color: palette.navy, fontSize: 13, fontFamily: fontFamily.bold }}>Cancel</Text>
                                      </Pressable>
                                      <Pressable
                                        accessibilityRole="button"
                                        disabled={busy}
                                        onPress={() => confirmDeleteHome(home)}
                                        style={({ pressed }) => ({
                                          opacity: busy ? 0.55 : pressed ? 0.75 : 1,
                                          borderRadius: radii.pill,
                                          backgroundColor: palette.danger,
                                          paddingHorizontal: 16,
                                          paddingVertical: 9,
                                        })}
                                      >
                                        <Text style={{ color: "#fff", fontSize: 13, fontFamily: fontFamily.bold }}>
                                          {busy ? "Deleting" : "Delete"}
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                ) : null}
                              </View>
                            ))}
                          </View>
                        ) : null}
                        <View style={{ gap: 8, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.mintLight, backgroundColor: palette.softTeal, padding: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <MaterialCommunityIcons name="account-multiple-plus-outline" color={palette.teal} size={19} />
                            <Text selectable style={{ color: palette.text, fontSize: 15, fontFamily: fontFamily.black }}>
                              Join Fur Home
                            </Text>
                          </View>
                          <Text selectable style={{ color: palette.muted, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium }}>
                            Enter the invite code from the Fur Home creator.
                          </Text>
                          <Field label="Invite Code" value={inviteCode} placeholder="ABC12345" onChangeText={(text) => setInviteCode(text.toUpperCase())} />
                          <PaperActionButton label={busy ? "Joining..." : "Join Fur Home"} icon="login-variant" secondary disabled={busy} onPress={joinFurHome} />
                        </View>
                        <Field label="Home Name" value={homeName} placeholder="Garcia Fur Home" onChangeText={setHomeName} />
                        <PaperActionButton label={busy ? "Creating Home..." : "Create Home"} icon="home-plus-outline" disabled={busy} onPress={createHome} />
                      </View>
                    )}

                    {message ? (
                      <Text selectable style={{ color: message.includes("Creating") || message.includes("Check") || message.includes("verified") || message.includes("connected") || message.includes("created") ? palette.teal : palette.danger, fontSize: 13, fontFamily: fontFamily.bold, lineHeight: 19 }}>
                        {message}
                      </Text>
                    ) : null}
                  </Panel>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
