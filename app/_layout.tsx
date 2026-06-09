import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { AppProvider, useAppData } from "@/context/AppContext";
import { paperTheme } from "@/constants/theme";
import { MIN_OWNER_AGE } from "@/constants/owner";
import { OwnerOnboarding } from "@/components/owner-onboarding";
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

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready, owner, settings } = useAppData();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const ownerCanProceed = owner.fullName.trim() && isValidIsoDate(owner.birthday) && getAgeYears(owner.birthday) >= MIN_OWNER_AGE && settings.careMode;
  if (!ownerCanProceed) return <OwnerOnboarding />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
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
    <PaperProvider theme={paperTheme}>
      <AppProvider>
        <RootStack />
      </AppProvider>
    </PaperProvider>
  );
}
