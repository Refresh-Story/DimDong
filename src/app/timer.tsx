import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const router = useRouter();
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

  // tremblement de Dim pendant le brossage
  const shake = useRef(new Animated.Value(0)).current;
  // animation de célébration (fin de brossage)
  const pop = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;

  // Quand on arrive sur l'écran "done" : Dim saute + le badge "pop".
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
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 120, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, paused, shake]);

  function start() {
    setLeft(BRUSH_DURATION_SEC);
    setCount(3);
    setPaused(false);
    setPhase('countdown');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  // Compte à rebours 3 → 2 → 1 avant le démarrage du minuteur.
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

  // Minuteur du brossage : tourne tant qu'on est en cours et non en pause.
  useEffect(() => {
    if (phase !== 'running' || paused) return;
    intervalRef.current = setInterval(() => {
      setLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, paused]);

  // Guidage par zones (vibration) + fin de brossage : géré hors des updaters de
  // state pour éviter "Cannot update a component while rendering".
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

  // Empêche la mise en veille de l'écran tant que le brossage est actif
  // (compte à rebours + minuteur). On désactive dès qu'on en sort.
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
  const zoneIndex = Math.min(BRUSH_ZONES.length - 1, Math.floor(elapsed / ZONE_SEC));
  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] });
  const background = getItemById(catalog, player.equipped.background)?.background;

  return (
    <View style={{ flex: 1 }}>
      <Scene background={background} />
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.close} onPress={goBack}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {phase === 'countdown' ? (
          <>
            <Text style={styles.getReady}>Prépare-toi&nbsp;!</Text>
            <Text style={styles.countdownNum}>{count}</Text>
            <View style={styles.stage}>
              <DimAvatar size={190} equipped={player.equipped} catalog={catalog} level={level} />
            </View>
          </>
        ) : phase !== 'done' ? (
          <>
            <Text style={styles.bigTime}>{fmt(left)}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            {phase === 'running' && (
              <Text style={styles.zone}>
                {paused ? 'En pause ⏸️' : `Brosse : ${BRUSH_ZONES[zoneIndex]} 🦷`}
              </Text>
            )}

            <View style={styles.stage}>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <DimAvatar size={190} equipped={player.equipped} catalog={catalog} level={level} />
              </Animated.View>
            </View>

            {phase === 'ready' ? (
              <PrimaryButton label="Démarrer le brossage" onPress={start} />
            ) : (
              <>
                {paused ? (
                  <PrimaryButton
                    label="Reprendre"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setPaused(false);
                    }}
                  />
                ) : (
                  <PrimaryButton
                    label="Pause"
                    color={Palette.gemDark}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setPaused(true);
                    }}
                  />
                )}
                <Text style={styles.hint}>Continue jusqu'au bout pour gagner tes gemmes&nbsp;!</Text>
              </>
            )}
          </>
        ) : (
          <View style={styles.doneWrap}>
            <Animated.Text style={[styles.doneTitle, { transform: [{ scale: pop }] }]}>
              Bravo&nbsp;! 🎉
            </Animated.Text>
            <View style={styles.stage}>
              <Animated.View style={{ transform: [{ translateY: jump }] }}>
                <DimAvatar size={190} equipped={player.equipped} catalog={catalog} level={level} />
              </Animated.View>
              {result?.rewarded && <GemBurst />}
            </View>
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
                Super brossage&nbsp;! Tu as déjà gagné toutes tes gemmes pour aujourd'hui. Reviens
                ce soir&nbsp;!
              </Text>
            )}
            <PrimaryButton label="Retour" onPress={goBack} style={{ marginTop: Spacing.lg }} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  close: { position: 'absolute', top: Spacing.xxl, right: Spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  closeText: { fontSize: 18, fontWeight: '800', color: Palette.ink },
  bigTime: { fontSize: 80, fontFamily: Fonts.display, color: Palette.primary, letterSpacing: 2 },
  getReady: { fontSize: 30, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  countdownNum: { fontSize: 150, fontFamily: Fonts.display, color: Palette.primary, lineHeight: 160 },
  track: { width: '100%', height: 18, backgroundColor: Palette.white, borderRadius: Radius.pill, borderWidth: 2.5, borderColor: Palette.outline, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Palette.accent2 },
  zone: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Palette.ink },
  stage: { alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md },
  hint: { fontSize: 15, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
  doneWrap: { alignItems: 'center', gap: Spacing.sm },
  doneTitle: { fontSize: 44, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  doneText: { fontSize: 18, color: Palette.ink, textAlign: 'center', fontFamily: Fonts.bodyBold },
  smallText: { fontSize: 14, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
});
