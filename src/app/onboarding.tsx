import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DimAvatar } from '@/components/DimAvatar';
import { Scene } from '@/components/Scene';
import { PrimaryButton } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { Palette, Radius, Shadow, Spacing } from '@/theme';

export default function OnboardingScreen() {
  const { setName, catalog } = useGame();
  const router = useRouter();
  const [name, setLocalName] = useState('Dim');
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (saving) return;
    Keyboard.dismiss();
    setSaving(true);
    await setName(name.trim() || 'Dim');
    router.replace('/');
  }

  return (
    <View style={{ flex: 1 }}>
      <Scene />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SafeAreaView style={styles.safe}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text style={styles.title}>Bienvenue&nbsp;!</Text>
              <Text style={styles.subtitle}>Voici ton petit compagnon. Comment veux-tu l'appeler&nbsp;?</Text>

              <View style={styles.stage}>
                <DimAvatar size={180} equipped={{}} catalog={catalog} />
              </View>

              <View style={styles.card}>
                <TextInput
                  value={name}
                  onChangeText={setLocalName}
                  placeholder="Nom du personnage"
                  placeholderTextColor={Palette.inkSoft}
                  style={styles.input}
                  maxLength={16}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={confirm}
                  submitBehavior="blurAndSubmit"
                />
                <PrimaryButton label={saving ? '...' : "C'est parti !"} onPress={confirm} disabled={saving} />
              </View>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
  title: { fontSize: 30, fontWeight: '900', color: Palette.ink, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    color: Palette.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  stage: { alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.xl },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  input: {
    borderWidth: 2,
    borderColor: Palette.cardSoft,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    fontWeight: '700',
    color: Palette.ink,
    textAlign: 'center',
  },
});
