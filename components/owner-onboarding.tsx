import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { Card, Field, GhostButton, PrimaryButton, BrandMark } from "@/components/ui";
import { MIN_OWNER_AGE } from "@/constants/owner";
import { gradients, palette, radii, shadow } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { getAgeYears, isValidIsoDate } from "@/utils/date";
import { LinearGradient } from "expo-linear-gradient";

function validateOwnerProfile(fullName: string, birthday: string) {
  const name = fullName.trim();
  const birthDate = birthday.trim();
  if (!name) return "Enter your full name so PetNexa AI can greet you properly.";
  if (!isValidIsoDate(birthDate)) return "Enter a valid birthday using YYYY-MM-DD.";
  if (getAgeYears(birthDate) < MIN_OWNER_AGE) return `You must be at least ${MIN_OWNER_AGE} years old to use PetNexa AI.`;
  return "";
}

export function OwnerOnboarding() {
  const { owner, settings, saveOwner, chooseSoloMode, sendHomeOtp, verifyHomeOtp, createHomeAccount, joinHomeAccount } = useAppData();
  const [fullName, setFullName] = useState(owner.fullName);
  const [birthday, setBirthday] = useState(owner.birthday);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [homeName, setHomeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const ownerIsValid = fullName.trim() && isValidIsoDate(birthday) && getAgeYears(birthday) >= MIN_OWNER_AGE;
  const needsProfile = !ownerIsValid;
  const needsMode = ownerIsValid && !settings.careMode;

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

  const requestOtp = async () => {
    if (!email.trim()) return setMessage("Enter your email address.");
    setBusy(true);
    try {
      await sendHomeOtp(email);
      setOtpSent(true);
      setMessage("Check your email for the verification code.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send verification code.");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp.trim()) return setMessage("Enter the verification code from your email.");
    setBusy(true);
    try {
      await verifyHomeOtp(email, otp);
      setVerified(true);
      setMessage("Email verified. Create or join a Home account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const createHome = async () => {
    setBusy(true);
    try {
      await createHomeAccount(homeName || `${fullName.split(" ")[0] || "PetNexa"} Home`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create Home account.");
    } finally {
      setBusy(false);
    }
  };

  const joinHome = async () => {
    if (!inviteCode.trim()) return setMessage("Enter the Home invite code.");
    Alert.alert(
      "Join existing Home?",
      "Joining a Home will replace this device's local care data with the shared Home data after sync.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join Home",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await joinHomeAccount(inviteCode);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Could not join Home account.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <LinearGradient colors={gradients.calm} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 22, gap: 20 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <BrandMark />
              <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>{needsProfile ? "Set up your owner profile" : "Choose your care mode"}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 330 }}>
                {needsProfile ? "PetNexa AI needs your name for greetings and your birthday to confirm age eligibility." : "Use PetNexa AI solo on this device or sync shared pet care with your household."}
              </Text>
            </View>

            {needsProfile ? (
              <Card style={{ borderRadius: 24, boxShadow: shadow.md }}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 46, height: 46, borderRadius: radii.pill, backgroundColor: palette.softTeal, alignItems: "center", justifyContent: "center" }}>
                      <MaterialCommunityIcons name="account-heart-outline" color={palette.teal} size={25} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text selectable style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}>Owner Details</Text>
                      <Text selectable style={{ color: palette.muted, fontSize: 12 }}>Required before entering the app</Text>
                    </View>
                  </View>
                  <Field label="Full Name" value={fullName} onChangeText={(text) => { setFullName(text); setMessage(""); }} />
                  <Field label="Birthday" value={birthday} placeholder="YYYY-MM-DD" onChangeText={(text) => { setBirthday(text); setMessage(""); }} />
                  {message ? <Text selectable style={{ color: palette.danger, fontSize: 13, fontWeight: "800", lineHeight: 19 }}>{message}</Text> : null}
                  <PrimaryButton label={busy ? "Saving..." : "Continue"} icon="arrow-right" disabled={busy} onPress={saveProfile} />
                </View>
              </Card>
            ) : null}

            {needsMode ? (
              <>
                <Card style={{ backgroundColor: palette.softTeal, borderColor: palette.mint }}>
                  <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>Solo Furparent</Text>
                  <Text selectable style={{ color: palette.muted, lineHeight: 21 }}>Keep PetNexa AI private on this device. No sign-in required.</Text>
                  <PrimaryButton label="Use Solo Mode" icon="cellphone" disabled={busy} onPress={startSolo} />
                </Card>

                <Card>
                  <Text selectable style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>Home Furparent</Text>
                  <Text selectable style={{ color: palette.muted, lineHeight: 21 }}>Share pet care with your household across devices.</Text>
                  <Field label="Email" value={email} keyboardType="email-address" onChangeText={(text) => { setEmail(text); setMessage(""); }} />
                  {otpSent ? <Field label="Verification Code" value={otp} onChangeText={(text) => { setOtp(text); setMessage(""); }} /> : null}
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    {!otpSent ? <GhostButton label={busy ? "Sending..." : "Send Code"} onPress={requestOtp} /> : null}
                    {otpSent && !verified ? <PrimaryButton label={busy ? "Verifying..." : "Verify Email"} icon="email-check-outline" disabled={busy} onPress={confirmOtp} /> : null}
                  </View>
                  {verified ? (
                    <>
                      <Field label="Home Name" value={homeName} placeholder="Garcia Fur Home" onChangeText={setHomeName} />
                      <PrimaryButton label="Create Home" icon="home-plus-outline" disabled={busy} onPress={createHome} />
                      <Field label="Invite Code" value={inviteCode} placeholder="ABC12345" onChangeText={setInviteCode} />
                      <GhostButton label="Join Existing Home" onPress={joinHome} />
                    </>
                  ) : null}
                  {message ? <Text selectable style={{ color: message.includes("Check") || message.includes("verified") ? palette.teal : palette.danger, fontSize: 13, fontWeight: "800", lineHeight: 19 }}>{message}</Text> : null}
                </Card>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
