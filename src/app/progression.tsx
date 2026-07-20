import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scene } from '@/components/Scene';
import { useGame } from '@/context/GameContext';
import { getItemById } from '@/data/items';
import { BELTS, Belt, SENSEI_BELT, beltForLevel, isSenseiName, xpForNextLevel } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

// Plage de niveaux couverte par la ceinture d'index i (Blanche 1-3, Jaune 4-6…).
function beltRange(i: number): string {
  const min = i === 0 ? 1 : BELTS[i - 1].maxLevel + 1;
  const max = BELTS[i].maxLevel;
  return Number.isFinite(max) ? `Niv. ${min} – ${max}` : `Niv. ${min}+`;
}

export default function ProgressionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player, catalog, level } = useGame();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const currentIdx = BELTS.indexOf(beltForLevel(level));
  const { current, needed } = xpForNextLevel(player.xp);
  const background = getItemById(catalog, player.equipped.background)?.background;

  return (
    <View style={{ flex: 1 }}>
      <Scene background={background} />
      <SafeAreaView style={styles.safe}>
        <Pressable style={[styles.close, { top: insets.top + Spacing.md }]} onPress={goBack}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Mon parcours</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {BELTS.map((b, i) =>
              i === currentIdx ? (
                <View key={b.label} style={styles.currentRow}>
                  <BeltDot belt={b} big />
                  <View style={styles.rowBody}>
                    <Text style={styles.beltNameCurrent}>Ceinture {b.label}</Text>
                    <Text style={styles.rangeText}>
                      Niveau {level} · {beltRange(i)}
                    </Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.round((current / needed) * 100)}%` }]} />
                    </View>
                    <Text style={styles.xpText}>
                      {current}/{needed} XP avant le niveau {level + 1}
                    </Text>
                  </View>
                </View>
              ) : (
                <View key={b.label} style={[styles.row, i > currentIdx && styles.rowFuture]}>
                  <View style={styles.dotColumn}>
                    {i === currentIdx + 1 && <View style={styles.connector} />}
                    <BeltDot belt={b} />
                    {i < currentIdx && <View style={styles.connector} />}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.beltName}>Ceinture {b.label}</Text>
                    <Text style={styles.rangeText}>{beltRange(i)}</Text>
                  </View>
                  {i < currentIdx ? (
                    <Text style={styles.earnedText}>Obtenue ✓</Text>
                  ) : (
                    <Text style={styles.futureText}>À venir</Text>
                  )}
                </View>
              )
            )}

            {isSenseiName(player.name) && (
              <View style={[styles.row, styles.senseiRow]}>
                <BeltDot belt={SENSEI_BELT} />
                <View style={styles.rowBody}>
                  <Text style={styles.beltName}>Ceinture {SENSEI_BELT.label}</Text>
                  <Text style={styles.rangeText}>Ceinture secrète</Text>
                </View>
                <Text style={styles.earnedText}>Obtenue ✓</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BeltDot({ belt, big }: { belt: Belt; big?: boolean }) {
  return (
    <View style={[styles.beltDot, big && styles.beltDotBig, { backgroundColor: belt.color }]}>
      {belt.accent && <View style={[styles.beltDotAccent, { backgroundColor: belt.accent }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  close: { position: 'absolute', right: Spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...Shadow.card },
  closeText: { fontSize: 18, fontWeight: '800', color: Palette.ink },

  card: {
    maxHeight: '82%',
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    color: Palette.ink,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  rowFuture: { opacity: 0.45 },
  rowBody: { flex: 1 },
  dotColumn: { alignItems: 'center' },
  connector: { width: 3, height: 12, backgroundColor: Palette.outline },

  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    backgroundColor: '#FFF6D6',
    borderWidth: 2.5,
    borderColor: Palette.primaryDark,
    borderRadius: Radius.lg,
  },

  beltDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    overflow: 'hidden',
  },
  beltDotBig: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  beltDotAccent: { position: 'absolute', left: 0, right: 0, top: 10, height: 10 },

  beltName: { fontSize: 16, fontFamily: Fonts.bodyBold, color: Palette.ink },
  beltNameCurrent: { fontSize: 17, fontFamily: Fonts.bodyBold, color: Palette.ink },
  rangeText: { fontSize: 13, fontFamily: Fonts.body, color: Palette.inkSoft },
  earnedText: { fontSize: 14, fontFamily: Fonts.bodyBold, color: '#3DA45A' },
  futureText: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Palette.inkSoft },

  track: {
    marginTop: 6,
    height: 11,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outline,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.accent2 },
  xpText: { marginTop: 2, fontSize: 12, fontFamily: Fonts.digits, color: Palette.inkSoft },

  senseiRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 2,
    borderTopColor: Palette.screentoneMid,
    borderStyle: 'dashed',
  },
});
