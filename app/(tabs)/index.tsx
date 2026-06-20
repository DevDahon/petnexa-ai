import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import {
  Card,
  EmptyState,
  GradientCard,
  HeaderActionButton,
  IconBubble,
  PetAvatar,
  ResponsiveScrollView,
  ReminderPill,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatCard,
  StatusNotice,
  StatusRail,
  useResponsiveLayout,
} from "@/components/ui";
import { fontFamily, palette } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import {
  calculateAge,
  formatFriendlyDate,
  getReminderStatus,
} from "@/utils/date";

type PetInfoPillTone = "teal" | "navy";

function PetInfoPill({
  label,
  tone = "teal",
  icon,
}: {
  label: string;
  tone?: PetInfoPillTone;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  const color = tone === "navy" ? palette.navy : "#fff";
  const backgroundColor = tone === "navy" ? "#fff" : palette.teal;
  const borderColor = tone === "navy" ? "#C9D7F7" : palette.teal;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        alignSelf: "flex-start",
        borderRadius: 999,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 11,
        paddingVertical: 7,
        minHeight: 34,
        flexShrink: 0,
      }}
    >
      {icon ? <MaterialCommunityIcons name={icon} color={color} size={15} /> : null}
      <Text
        selectable
        numberOfLines={1}
        style={{
          color,
          fontSize: 12,
          lineHeight: 16,
          fontFamily: fontFamily.bold,
          fontVariant: ["tabular-nums"],
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { owner, pets, reminders, records, settings } = useAppData();
  const layout = useResponsiveLayout();
  const due = reminders.filter((item) => getReminderStatus(item) === "Due Today");
  const overdue = reminders.filter((item) => getReminderStatus(item) === "Overdue");
  const upcoming = reminders.filter((item) => getReminderStatus(item) === "Upcoming");
  const nextReminder = [...due, ...upcoming][0];
  const featuredPet = pets[0];
  const ownerName = owner.fullName.split(" ")[0] || "Pet Parent";
  const urgentCount = due.length + overdue.length;
  const nextBestAction =
    pets.length === 0
      ? {
          title: "Add your first pet",
          message: "Create a profile so care tasks, records, and AI guidance have the right context.",
          icon: "paw" as const,
          tone: "teal" as const,
        }
      : overdue.length > 0
        ? {
            title: `${overdue.length} overdue care item${overdue.length === 1 ? "" : "s"}`,
            message: "Open Care and update the overdue tasks before adding new follow-ups.",
            icon: "alert-outline" as const,
            tone: "danger" as const,
          }
        : due.length > 0
          ? {
              title: `${due.length} care item${due.length === 1 ? "" : "s"} due today`,
              message: "Complete today's task or adjust the due date if the schedule has changed.",
              icon: "calendar-alert" as const,
              tone: "warning" as const,
            }
          : records.length === 0
            ? {
                title: "Add a first health record",
                message: "Record vaccinations, checkups, medications, or lab results for better history.",
                icon: "clipboard-plus-outline" as const,
                tone: "navy" as const,
              }
            : !settings.privacyAcknowledgedAt || !settings.aiDisclaimerAcceptedAt
              ? {
                  title: "Review trust settings",
                  message: "Acknowledge the privacy policy and AI safety notice in Settings when ready.",
                  icon: "shield-check-outline" as const,
                  tone: "warning" as const,
                }
              : {
                  title: "Care is on track",
                  message: "No urgent action right now. Keep profiles and records current after vet visits.",
                  icon: "check-circle-outline" as const,
                  tone: "success" as const,
                };

  return (
    <Screen>
      <ResponsiveScrollView>
        {/* ── Header ── */}
        <ScreenHeader
          title="Home"
          subtitle={`${greeting()}, ${ownerName}!`}
          right={
            <HeaderActionButton
              icon="cog-outline"
              label="Open settings"
              active
              onPress={() => router.push("/settings")}
            />
          }
        />

        {/* ── Hero Banner ── */}
        <GradientCard variant="hero">
          <View
            style={{
              flexDirection: layout.shouldStack ? "column" : "row",
              alignItems: layout.shouldStack ? "flex-start" : "center",
              gap: 14,
            }}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <Text
                selectable
                style={{
                  color: "rgba(255,255,255,0.80)",
                  fontSize: 12,
                  fontFamily: fontFamily.bold,
                  letterSpacing: 1.2,
                }}
              >
                TODAY'S CARE SUMMARY
              </Text>
              <Text
                selectable
                style={{
                  color: "#fff",
                  fontSize: 23,
                  lineHeight: 30,
                  fontFamily: fontFamily.black,
                  letterSpacing: 0,
                }}
              >
                {pets.length} {pets.length === 1 ? "pet" : "pets"} tracked
              </Text>
              <Text
                selectable
                style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, fontFamily: fontFamily.medium, lineHeight: 20 }}
              >
                {urgentCount > 0
                  ? `${urgentCount} care ${urgentCount === 1 ? "item needs" : "items need"} attention today`
                  : "All care is up to date — great job!"}
              </Text>
              {urgentCount > 0 ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(255,255,255,0.22)",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.38)",
                  }}
                >
                  <Text selectable style={{ color: "#fff", fontSize: 13, fontFamily: fontFamily.bold }}>
                    {urgentCount} urgent
                  </Text>
                </View>
              ) : null}
            </View>
            <View
              accessibilityLabel="PetNexa AI logo"
              accessible
              style={{
                width: layout.isCompact ? 66 : 76,
                height: layout.isCompact ? 66 : 76,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.94)",
                  alignItems: "center",
                  justifyContent: "center",
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.70)",
                boxShadow: "0 8px 18px rgba(0, 51, 92, 0.16)",
              }}
            >
              <Image
                source={require("../../assets/images/icon.png")}
                resizeMode="contain"
                style={{
                  width: layout.isCompact ? 58 : 68,
                  height: layout.isCompact ? 58 : 68,
                  borderRadius: 18,
                }}
              />
            </View>
          </View>
        </GradientCard>

        {/* ── Stat Row ── */}
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <StatCard label="Due Today" value={due.length} icon="calendar-alert" tone="warning" />
          <StatCard label="Overdue" value={overdue.length} icon="alert-outline" tone="danger" />
          <StatCard label="Upcoming" value={upcoming.length} icon="calendar-check-outline" tone="teal" />
        </View>

        <SectionHeader title="Next Best Action" />
        <StatusNotice
          title={nextBestAction.title}
          message={nextBestAction.message}
          icon={nextBestAction.icon}
          tone={nextBestAction.tone}
        />

        {/* ── Featured Pet ── */}
        {featuredPet ? (
          <>
            <SectionHeader title="Featured Pet" />
            <Card
              style={{
                backgroundColor: featuredPet.species === "Cat" ? palette.softPeach : palette.softTeal,
                borderColor: featuredPet.species === "Cat" ? "#FFE1CC" : palette.mintLight,
              }}
            >
              <View style={{ flexDirection: layout.isCompact ? "column" : "row", alignItems: layout.isCompact ? "flex-start" : "center", gap: 16 }}>
                <PetAvatar pet={featuredPet} size={layout.isCompact ? 78 : 90} />
                <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                  <Text selectable style={{ color: palette.text, fontSize: 22, fontFamily: fontFamily.black, letterSpacing: 0 }}>
                    {featuredPet.name}
                  </Text>
                  <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.semiBold }}>
                    {featuredPet.breed || featuredPet.species}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: layout.isTiny ? "wrap" : "nowrap", alignItems: "center", maxWidth: "100%" }}>
                    <PetInfoPill label={calculateAge(featuredPet.birthday).replace(" old", "")} icon="check-circle" />
                    <PetInfoPill label={`${featuredPet.weightKg} kg`} tone="navy" />
                    <PetInfoPill label={featuredPet.sex} tone="navy" />
                  </View>
                </View>
              </View>
            </Card>
          </>
        ) : null}

        {/* ── My Pets ── */}
        <SectionHeader title="My Pets" action={`${pets.length} saved`} />
        {pets.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {pets.map((pet) => (
              <Card
                key={pet.id}
                style={{
                  width: layout.isCompact ? 152 : layout.isTablet ? 180 : 162,
                  height: layout.isCompact ? 190 : 196,
                  justifyContent: "center",
                }}
                noAnimation
              >
                <View style={{ alignItems: "center", justifyContent: "center", gap: 8, minHeight: layout.isCompact ? 158 : 164 }}>
                  <PetAvatar pet={pet} size={68} />
                  <Text
                    selectable
                    numberOfLines={1}
                    style={{ color: palette.text, fontFamily: fontFamily.black, fontSize: 14, lineHeight: 18, textAlign: "center", maxWidth: "100%" }}
                  >
                    {pet.name}
                  </Text>
                  <Text
                    selectable
                    numberOfLines={1}
                    style={{ color: palette.muted, fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium, textAlign: "center", marginTop: -4, maxWidth: "100%" }}
                  >
                    {pet.breed || pet.species}
                  </Text>
                  <View style={{ backgroundColor: palette.softNavy, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: "100%" }}>
                    <Text selectable numberOfLines={1} style={{ color: palette.navy, fontSize: 12, lineHeight: 16, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"] }}>
                      {calculateAge(pet.birthday).replace(" old", "")}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            title="No pets yet"
            message="Add your first pet to start tracking care."
            icon="paw"
          />
        )}

        {/* ── Next Care ── */}
        <SectionHeader title="Next Care" />
        {nextReminder ? (
          <Card>
            <View
              style={{
                flexDirection: layout.shouldStack ? "column" : "row",
                alignItems: layout.shouldStack ? "flex-start" : "center",
                gap: 12,
              }}
            >
              <StatusRail tone={getReminderStatus(nextReminder) === "Due Today" ? "warning" : "teal"} />
              <IconBubble icon="calendar-clock" size={48} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text selectable style={{ color: palette.text, fontFamily: fontFamily.black, fontSize: 15 }}>
                  {nextReminder.title}
                </Text>
                <Text selectable style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.medium }}>
                  {formatFriendlyDate(nextReminder.dueDate)}
                </Text>
              </View>
              <View style={{ alignSelf: layout.shouldStack ? "flex-start" : "auto" }}>
                <ReminderPill reminder={nextReminder} />
              </View>
            </View>
          </Card>
        ) : (
          <EmptyState
            title="No upcoming care"
            message="You are all caught up for now."
            icon="check-circle-outline"
          />
        )}

        {/* ── Recent Activity ── */}
        <SectionHeader title="Recent Activity" action={records.length > 0 ? `${records.length} total` : undefined} />
        {records.length === 0 ? (
          <EmptyState
            title="No recent activity"
            message="New health records will appear here."
            icon="clipboard-text-outline"
          />
        ) : null}
        {records.slice(0, 3).map((record, idx) => {
          const pet = pets.find((item) => item.id === record.petId);
          const isVaccination = record.type === "Vaccination";
          return (
            <Card key={record.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 }}>
                <StatusRail tone={isVaccination ? "teal" : "navy"} />
                <IconBubble
                  icon={isVaccination ? "needle" : "clipboard-pulse-outline"}
                  tone={isVaccination ? "teal" : "navy"}
                  size={44}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text selectable style={{ color: palette.text, fontFamily: fontFamily.bold, fontSize: 14 }}>
                    {record.type}
                  </Text>
                  <Text selectable numberOfLines={2} style={{ color: palette.muted, fontSize: 13, fontFamily: fontFamily.medium }}>
                    {pet?.name ?? "Pet"} • {formatFriendlyDate(record.date)}
                  </Text>
                  {record.clinic ? (
                    <Text selectable style={{ color: palette.navy, fontSize: 12, fontFamily: fontFamily.semiBold }}>
                      {record.clinic}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons name="chevron-right" color={palette.mintLight} size={22} />
              </View>
            </Card>
          );
        })}
      </ResponsiveScrollView>
    </Screen>
  );
}
