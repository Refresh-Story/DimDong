import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { BRUSH_FRAME, DRAW_FRAME, toothbrushDoc } from '@/art/dimArt';
import { GemBurst } from '@/components/GemBurst';
import { DimAvatar } from '@/components/DimAvatar';
import { Scene } from '@/components/Scene';
import { GemBadge, PrimaryButton } from '@/components/ui';
import { BrushResult, useGame } from '@/context/GameContext';
import { getItemById } from '@/data/items';
import { BRUSH_DURATION_SEC, BRUSH_ZONES } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

type Phase = 'ready' | 'countdown' | 'running' | 'done';

const ZONE_SEC = BRUSH_DURATION_SEC / BRUSH_ZONES.length;
const KEEP_AWAKE_TAG = 'dim-dong-brushing';

// À size 200, 1 unité du viewBox 200x260 = 1 px ; la bouche de Dim est vers (100, 184).
const AVATAR_SIZE = 200;
const BRUSH_WIDTH = 110;
const BRUSH_HEIGHT = (BRUSH_WIDTH * BRUSH_FRAME.h) / BRUSH_FRAME.w;
const BRUSH_LEFT = 72;
const BRUSH_TOP = 171;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player, catalog, level, brushCompleted } = useGame();
  const [phase, setPhase] = useState<Phase>('ready');
  const [left, setLeft] = useState(BRUSH_DURATION_SEC);
  const [count, setCount] = useState(3);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<BrushResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastZone = useRef(-1);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const sway = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const scrub = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'done') return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(jump, { toValue: -28, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(jump, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [phase, pop, jump]);

  const finish = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const r = await brushCompleted();
    setResult(r);
  }, [brushCompleted]);

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    const swayEase = Easing.inOut(Easing.sin);
    const scrubEase = Easing.inOut(Easing.quad);
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(sway, { toValue: 1, duration: 600, easing: swayEase, useNativeDriver: true }),
          Animated.timing(sway, { toValue: -1, duration: 1200, easing: swayEase, useNativeDriver: true }),
          Animated.timing(sway, { toValue: 0, duration: 600, easing: swayEase, useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ),
      // Frottements en rafales de 4 allers-retours, puis courte pause.
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrub, { toValue: 1, duration: 140, easing: scrubEase, useNativeDriver: true }),
          Animated.timing(scrub, { toValue: -1, duration: 140, easing: scrubEase, useNativeDriver: true }),
          Animated.timing(scrub, { toValue: 1, duration: 140, easing: scrubEase, useNativeDriver: true }),
          Animated.timing(scrub, { toValue: -1, duration: 140, easing: scrubEase, useNativeDriver: true }),
          Animated.timing(scrub, { toValue: 0, duration: 140, easing: scrubEase, useNativeDriver: true }),
          Animated.delay(380),
        ])
      ),
    ];
    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
      sway.setValue(0);
      bob.setValue(0);
      scrub.setValue(0);
    };
  }, [phase, paused, sway, bob, scrub]);

  function start() {
    setLeft(BRUSH_DURATION_SEC);
    setCount(3);
    setPaused(false);
    setPhase('countdown');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  useEffect(() => {
    if (phase !== 'countdown') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    countdownRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          lastZone.current = 0;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setPhase('running');
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    intervalRef.current = setInterval(() => {
      setLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== 'running') return;
    const elapsed = BRUSH_DURATION_SEC - left;
    const zone = Math.min(BRUSH_ZONES.length - 1, Math.floor(elapsed / ZONE_SEC));
    if (zone !== lastZone.current) {
      lastZone.current = zone;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (left <= 0) finish();
  }, [left, phase, finish]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    const active = phase === 'countdown' || phase === 'running';
    if (active) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      };
    }
  }, [phase]);

  const elapsed = BRUSH_DURATION_SEC - left;
  const progress = elapsed / BRUSH_DURATION_SEC;
  const swayRotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-2.5deg', '2.5deg'] });
  const scrubX = scrub.interpolate({ inputRange: [-1, 1], outputRange: [-13, 13] });
  const scrubRotate = scrub.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] });
  const brushXml = useMemo(() => toothbrushDoc(Palette.primary), []);
  const background = getItemById(catalog, player.equipped.background)?.background;

  return (
    <View style={{ flex: 1 }}>
      <Scene background={background} />
      <SafeAreaView style={styles.safe}>
        <Pressable style={[styles.close, { top: insets.top + Spacing.md }]} onPress={goBack}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {phase === 'countdown' ? (
          <>
            <Text style={styles.getReady}>Prépare-toi&nbsp;!</Text>
            <Text style={styles.countdownNum}>{count}</Text>
            <View style={styles.stage}>
              <DimAvatar size={190} equipped={player.equipped} catalog={catalog} level={level} emotion={player.emotion} />
            </View>
          </>
        ) : phase !== 'done' ? (
          <>
            <View style={styles.stageGrow}>
              <View style={{ width: AVATAR_SIZE, height: (AVATAR_SIZE * DRAW_FRAME.h) / DRAW_FRAME.w }}>
                <Animated.View style={{ transform: [{ translateY: bob }, { rotate: swayRotate }] }}>
                  <DimAvatar size={AVATAR_SIZE} equipped={player.equipped} catalog={catalog} level={level} emotion={player.emotion} />
                </Animated.View>
                {phase === 'running' && !paused && (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: BRUSH_LEFT,
                      top: BRUSH_TOP,
                      transform: [{ translateX: scrubX }, { rotate: scrubRotate }],
                    }}
                  >
                    <SvgXml xml={brushXml} width={BRUSH_WIDTH} height={BRUSH_HEIGHT} />
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={styles.timerCard}>
              <Text style={[styles.bigTime, paused && styles.bigTimePaused]}>{fmt(left)}</Text>
              <View style={styles.track}>
                {BRUSH_ZONES.map((z, i) => {
                  const segFill = Math.min(1, Math.max(0, progress * BRUSH_ZONES.length - i));
                  return (
                    <View key={z} style={styles.seg}>
                      <View style={[styles.segFill, { width: `${segFill * 100}%` }]} />
                    </View>
                  );
                })}
              </View>
              {phase === 'ready' ? (
                <PrimaryButton label="Démarrer le brossage" onPress={start} style={styles.cardButton} />
              ) : paused ? (
                <PrimaryButton
                  label="Reprendre"
                  style={styles.cardButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setPaused(false);
                  }}
                />
              ) : (
                <PrimaryButton
                  label="Pause"
                  color={Palette.gemDark}
                  style={styles.cardButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setPaused(true);
                  }}
                />
              )}
              <Text style={styles.hint}>
                {phase === 'ready'
                  ? '2 minutes pour un sourire tout propre !'
                  : paused
                    ? 'En pause ⏸️'
                    : "Continue jusqu'au bout pour gagner tes gemmes !"}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.stageGrow}>
              <Animated.View style={{ transform: [{ translateY: jump }] }}>
                <DimAvatar size={200} equipped={player.equipped} catalog={catalog} level={level} emotion={player.emotion} />
              </Animated.View>
              {result?.rewarded && <GemBurst />}
            </View>

            <View style={styles.timerCard}>
              <Animated.Text style={[styles.doneTitle, { transform: [{ scale: pop }] }]}>
                Bravo&nbsp;! 🎉
              </Animated.Text>
              {result?.rewarded ? (
                <>
                  <Text style={styles.doneText}>Tu as gagné</Text>
                  <Animated.View style={{ transform: [{ scale: pop }] }}>
                    <GemBadge count={result.gained} size="lg" />
                  </Animated.View>
                  <Text style={styles.smallText}>
                    Encore {result.remainingToday} brossage(s) récompensé(s) aujourd'hui.
                  </Text>
                </>
              ) : (
                <Text style={styles.doneText}>
                  Super brossage&nbsp;! Tu as déjà gagné toutes tes gemmes pour aujourd'hui.
                  Reviens ce soir&nbsp;!
                </Text>
              )}
              <PrimaryButton label="Terminé" onPress={goBack} style={styles.cardButton} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  close: { position: 'absolute', right: Spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...Shadow.card },
  closeText: { fontSize: 18, fontWeight: '800', color: Palette.ink },
  bigTime: { fontSize: 64, fontFamily: Fonts.display, color: Palette.primary, letterSpacing: 2, lineHeight: 68 },
  bigTimePaused: { color: Palette.inkSoft },
  getReady: { fontSize: 30, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  countdownNum: { fontSize: 150, fontFamily: Fonts.display, color: Palette.primary, lineHeight: 160 },
  track: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  seg: { flex: 1, height: 14, backgroundColor: Palette.cardSoft, borderRadius: Radius.pill, borderWidth: 2.5, borderColor: Palette.outline, overflow: 'hidden' },
  segFill: { height: '100%', backgroundColor: Palette.accent2 },
  stage: { alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md },
  stageGrow: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Spacing.md },
  timerCard: {
    alignSelf: 'stretch',
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  cardButton: { alignSelf: 'stretch', marginTop: Spacing.xs },
  hint: { fontSize: 15, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
  doneTitle: { fontSize: 40, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  doneText: { fontSize: 18, color: Palette.ink, textAlign: 'center', fontFamily: Fonts.bodyBold },
  smallText: { fontSize: 14, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
});
