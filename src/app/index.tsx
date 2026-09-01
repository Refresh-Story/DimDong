import { Redirect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DimAvatar } from '@/components/DimAvatar';
import { RainbowAura } from '@/components/RainbowAura';
import { Scene } from '@/components/Scene';
import { GemBadge, LevelMedallion, PrimaryButton, SpeedLines } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { EMOTIONS } from '@/data/emotions';
import { getItemById } from '@/data/items';
import { sceneGeom } from '@/art/sceneGeom';
import { beltForPlayer } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

/** Hauteur de la carte de progression : médaillon de 46 + 2×12 de padding + 2×3 de bordure. */
const TOP_ROW_H = 46 + Spacing.md * 2 + 6;

export default function HomeScreen() {
  const { ready, player, catalog, level, progress, activeProfileId, clearActiveProfile, setName, setEmotion } =
    useGame();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Hauteur mesurée de la carte de progression. L'estimation initiale évite que le ciel
  // s'affiche pleine hauteur pendant une frame ; `onLayout` la corrige si la taille de police
  // système fait grandir la carte.
  const [hudH, setHudH] = useState(TOP_ROW_H);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  function openNameEditor() {
    setDraftName(player.name);
    setEditing(true);
  }

  async function saveName() {
    Keyboard.dismiss();
    await setName(draftName.trim() || 'Dim');
    setEditing(false);
  }

  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  // Entrée du dim-sum après la sélection : rebond + flash de speed lines.
  const enterScale = useRef(new Animated.Value(0.5)).current;
  const enterFlash = useRef(new Animated.Value(0)).current;
  const hasProfile = activeProfileId !== null;
  useEffect(() => {
    if (!hasProfile) return;
    Animated.parallel([
      Animated.spring(enterScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(enterFlash, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(enterFlash, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();
  }, [hasProfile, enterScale, enterFlash]);

  // Bande rendue au décor : encoche + carte de progression + son ombre portée. Le ciel démarre
  // en dessous, sinon la barre masque l'élément signature de chaque fond (lune, Fuji, lanterne).
  // Arrondi : `insets.top` peut être fractionnaire, et une réserve qui bouge d'un dixième de px
  // change la géométrie, donc régénère et re-parse les trois SVG de ciel pour rien.
  const topReserve = Math.round(insets.top + hudH + Spacing.sm);

  if (!ready) {
    return (
      <View style={styles.loading}>
        {/* Même réserve qu'une fois chargé : le ciel ne saute pas au moment où le HUD arrive. */}
        <Scene topReserve={topReserve} />
        <ActivityIndicator size="large" color={Palette.primaryDark} />
      </View>
    );
  }

  if (!hasProfile) {
    return <Redirect href="/profiles" />;
  }

  const placedDecor = catalog.filter((i) => player.placedDecor.includes(i.id));
  const isRainbow = !!catalog.find((i) => i.id === player.equipped.color)?.rainbow;
  const background = getItemById(catalog, player.equipped.background)?.background;
  const companion = getItemById(catalog, player.equipped.animal);
  // La taille du dim suit la hauteur de ciel disponible : il ne peut plus percuter le HUD
  // ni le bouton de brossage sur un petit écran.
  const geom = sceneGeom(win.width, win.height);
  const dimSize = Math.max(150, Math.min(210, geom.skyH * 0.44));

  return (
    <View style={{ flex: 1 }}>
      <Scene
        decor={placedDecor}
        background={background}
        companion={companion}
        topReserve={topReserve}
        stage={
          <Animated.View
            style={{ marginBottom: -dimSize * 0.12, transform: [{ translateY: bob }, { scale: enterScale }] }}>
            {/* Ombre de contact : c'est elle qui pose le dim au sol plutôt que de le laisser flotter. */}
            <View
              style={{
                position: 'absolute',
                alignSelf: 'center',
                bottom: dimSize * 0.14,
                width: dimSize * 0.6,
                height: dimSize * 0.15,
                borderRadius: dimSize * 0.3,
                backgroundColor: Palette.ink,
                opacity: 0.18,
              }}
            />
            {isRainbow && <RainbowAura size={dimSize} />}
            <DimAvatar
              size={dimSize}
              equipped={player.equipped}
              catalog={catalog}
              level={level}
              emotion={player.emotion}
              belt={beltForPlayer(player.name, level, player.selectedBelt)}
            />
          </Animated.View>
        }
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View
          style={styles.topRow}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h !== hudH) setHudH(h);
          }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/progression');
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Niveau ${level}, voir la progression`}
            style={({ pressed }) => pressed && { transform: [{ scale: 0.92 }] }}>
            <LevelMedallion level={level} />
          </Pressable>
          <Pressable
            style={styles.namePlate}
            onPress={openNameEditor}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Modifier le nom (${player.name})`}>
            <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </Pressable>
          <GemBadge count={player.gems} tone="chip" />
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              clearActiveProfile();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Changer de dim-sum (profil actuel : ${player.name})`}
            style={({ pressed }) => [styles.switchBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
            <DimAvatar
              size={32}
              equipped={player.equipped}
              catalog={catalog}
              level={level}
              emotion={player.emotion}
              belt={beltForPlayer(player.name, level, player.selectedBelt)}
            />
          </Pressable>
        </View>

        {/* Le personnage est posé sur l'horizon par la scène ; cette zone ne fait que
            réserver sa place dans la colonne d'UI. */}
        <View style={styles.stage} pointerEvents="none">
          <Animated.View style={[styles.flashWrap, { opacity: enterFlash }]} pointerEvents="none">
            <SpeedLines size={300} opacity={0.55} />
          </Animated.View>
        </View>

        <View style={styles.emotionRow}>
          {EMOTIONS.map((e) => {
            const isOn = player.emotion === e.id;
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={e.label}
                accessibilityState={{ selected: isOn }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setEmotion(e.id);
                }}
                style={({ pressed }) => [
                  styles.emotionChip,
                  isOn && styles.emotionChipOn,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}>
                <Text style={styles.emotionLabel}>{e.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.brushBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/timer')}>
          <Text style={styles.brushText}>Se brosser les dents</Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <NavCard label="Boutique" onPress={() => router.push('/shop')} />
          <NavCard label="Mes objets" onPress={() => router.push('/inventory')} />
        </View>
      </SafeAreaView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setEditing(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau nom</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nom du personnage"
              placeholderTextColor={Palette.inkSoft}
              style={styles.input}
              maxLength={16}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
              submitBehavior="blurAndSubmit"
            />
            <PrimaryButton label="Enregistrer" onPress={saveName} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function NavCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navCard, pressed && { transform: [{ scale: 0.97 }] }]}>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
  },
  namePlate: { flex: 1, gap: 6 },
  switchBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.cardSoft,
    borderWidth: 3,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadow.card,
  },
  name: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Palette.ink },
  track: {
    height: 11,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outline,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.accent2 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flashWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emotionChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  emotionChipOn: {
    backgroundColor: Palette.accent,
  },
  emotionLabel: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Palette.ink },

  brushBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  brushText: { color: Palette.white, fontSize: 26, fontFamily: Fonts.display, letterSpacing: 1 },

  bottomRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  navCard: {
    flex: 1,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadow.card,
  },
  navLabel: { fontSize: 18, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5 },

  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Fonts.display,
    color: Palette.ink,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2.5,
    borderColor: Palette.outline,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    textAlign: 'center',
  },
});
