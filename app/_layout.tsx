import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, ReactNode, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { AppProvider, useAppData } from "@/context/AppContext";
import { fontFamily, palette, getPaperTheme, radii } from "@/constants/theme";
import { MIN_OWNER_AGE } from "@/constants/owner";
import { OwnerOnboarding } from "@/components/owner-onboarding";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { getAgeYears, isValidIsoDate } from "@/utils/date";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: palette.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 20, fontFamily: fontFamily.bold, color: palette.text, textAlign: "center" }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fontFamily.regular, color: palette.muted, textAlign: "center", maxWidth: 400 }}>
            {this.state.error?.message || "An unexpected error occurred while loading PetNexa AI."}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: palette.teal, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radii.pill }}
          >
            <Text style={{ color: "#fff", fontFamily: fontFamily.bold, fontSize: 14 }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootStack() {
  const { ready, owner, settings } = useAppData();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  const ownerCanProceed = owner.fullName.trim() && isValidIsoDate(owner.birthday) && getAgeYears(owner.birthday) >= MIN_OWNER_AGE && settings.careMode;
  if (!ownerCanProceed) return <OwnerOnboarding />;
  if (!settings.hasCompletedTutorial) return <OnboardingTutorial />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function DynamicPaperProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppData();
  const theme = getPaperTheme(settings.themeMode);
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Fonts are ready — splash hide is controlled by RootStack
    }
  }, [fontsLoaded]);

  return (
    <RootErrorBoundary>
      <AppProvider>
        <DynamicPaperProvider>
          <RootStack />
        </DynamicPaperProvider>
      </AppProvider>
    </RootErrorBoundary>
  );
}
