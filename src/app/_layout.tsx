import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from '@/context/GameContext';
import { Palette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    MangaDisplay: require('@/assets/fonts/Bangers-Regular.ttf'),
    MangaBody: require('@/assets/fonts/Baloo2-SemiBold.ttf'),
    MangaBodyBold: require('@/assets/fonts/Baloo2-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              contentStyle: { backgroundColor: Palette.panel },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="timer"
              options={{ presentation: 'card', gestureEnabled: false, fullScreenGestureEnabled: false }}
            />
            <Stack.Screen name="shop" options={{ presentation: 'card' }} />
            <Stack.Screen name="inventory" options={{ presentation: 'card' }} />
          </Stack>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
