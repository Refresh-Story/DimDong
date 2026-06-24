import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from '@/context/GameContext';
import { Palette } from '@/theme';

// On masque les avertissements réseau attendus (hors-ligne / simulateur sans réseau),
// ce ne sont pas des bugs — l'app fonctionne et se synchronise quand le réseau revient.
LogBox.ignoreLogs([
  'Connexion anonyme',
  'Lecture du joueur',
  'Persistance',
  '@firebase',
  'WebChannelConnection',
  'Could not reach Cloud Firestore',
  'auth/network-request-failed',
]);

// On garde le splash affiché tant que les polices manga ne sont pas prêtes,
// pour éviter un "flash" de police système au démarrage.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Familles exposées par src/theme.ts → Fonts
    MangaDisplay: require('@/assets/fonts/Bangers-Regular.ttf'),
    MangaBody: require('@/assets/fonts/Baloo2-SemiBold.ttf'),
    MangaBodyBold: require('@/assets/fonts/Baloo2-ExtraBold.ttf'),
  });

  useEffect(() => {
    // Dès que les polices sont chargées (ou en cas d'erreur de chargement,
    // pour ne pas bloquer l'app), on masque le splash.
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.panel } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
            <Stack.Screen name="timer" options={{ presentation: 'modal' }} />
            <Stack.Screen name="shop" options={{ presentation: 'card' }} />
            <Stack.Screen name="inventory" options={{ presentation: 'card' }} />
          </Stack>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
