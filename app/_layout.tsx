import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { AppProvider, useAppData } from "@/context/AppContext";
import { paperTheme } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready } = useAppData();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <AppProvider>
        <RootStack />
      </AppProvider>
    </PaperProvider>
  );
}
