import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from '@/context/GameContext';

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#E8F7FF' } }}>
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
