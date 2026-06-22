// Décor de Dim-Dong : ambiance "salon de dim-sum" asiatique.
// Mur chaud + lanternes rouges qui se balancent + vapeur qui s'élève, et le
// personnage posé dans un panier vapeur en bambou (la bande du bas). Les
// décorations achetées se posent sur le rebord du panier.
//
// Animations : API `Animated` de React Native (cohérent avec le reste de l'app,
// useNativeDriver partout → tourne sur le thread d'UI, négligeable en fond).
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { DecorView } from '@/components/Decor';
import { Item } from '@/data/items';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const STEAMER_RATIO = 0.4; // part basse occupée par le panier vapeur

export function Scene({
  children,
  decor = [],
}: {
  children?: React.ReactNode;
  decor?: Item[];
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* mur chaud */}
      <LinearGradient colors={[Palette.wallTop, Palette.wallBottom]} style={StyleSheet.absoluteFill} />

      {/* lueurs d'ambiance : chaleur en haut + halo de la fenêtre-lune */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="ambiance" cx="50%" cy="6%" r="70%">
            <Stop offset="0" stopColor="#FFF7E8" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#FFF7E8" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFDF6" stopOpacity={0.9} />
            <Stop offset="0.7" stopColor="#FFF1D6" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#FFF1D6" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="6%" r={SCREEN_W} fill="url(#ambiance)" />
        <Circle cx="50%" cy={145} r={130} fill="url(#moonGlow)" />
      </Svg>

      {/* fenêtre lune (cercle décoratif avec cadre fin) */}
      <View style={styles.moonGate} />
      <View style={styles.moonGateInner} />

      {/* lanternes suspendues qui se balancent */}
      <Lantern left={42} drop={64} scale={1} period={2600} />
      <Lantern left={SCREEN_W - 92} drop={104} scale={0.85} period={3200} />

      {/* vapeur qui s'élève du panier */}
      <SteamColumn left={SCREEN_W * 0.36} delay={0} />
      <SteamColumn left={SCREEN_W * 0.6} delay={1300} />

      {/* panier vapeur en bambou */}
      <View style={styles.steamer}>
        <LinearGradient
          colors={[Palette.steamerLight, Palette.steamer, Palette.steamerDark]}
          style={StyleSheet.absoluteFill}
        />
        {/* tressage horizontal bicolore (texture bambou) */}
        {Array.from({ length: 7 }).map((_, i) => (
          <React.Fragment key={i}>
            <View style={[styles.weave, { top: 34 + i * 18, backgroundColor: Palette.weave, opacity: 0.45 }]} />
            <View style={[styles.weave, { top: 37 + i * 18, backgroundColor: Palette.steamerDark, opacity: 0.3 }]} />
          </React.Fragment>
        ))}
        {/* reflets verticaux (galbe des lattes) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`hl-${i}`} style={[styles.weaveHighlight, { left: (i + 0.5) * (SCREEN_W / 6) }]} />
        ))}

        {/* ombre interne sous le rebord (là où la vapeur sort) */}
        <LinearGradient
          colors={['rgba(74,53,38,0.28)', 'rgba(74,53,38,0)']}
          style={styles.innerShadow}
          pointerEvents="none"
        />

        {/* rebord du panier (lattes verticales) + reflet du haut */}
        <View style={styles.rim}>
          {Array.from({ length: Math.ceil(SCREEN_W / 18) }).map((_, i) => (
            <View key={i} style={styles.slat} />
          ))}
          <View style={styles.rimHighlight} />
        </View>

        {/* décorations posées sur le rebord */}
        {decor.map((item) => {
          const w = item.w ?? 90;
          return (
            <View
              key={item.id}
              style={{ position: 'absolute', top: 26, left: (item.x ?? 0.5) * SCREEN_W - w / 2 }}>
              <DecorView item={item} size={w} />
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

// Lanterne suspendue : se balance doucement autour de son point d'accroche (haut).
function Lantern({ left, drop, scale, period }: { left: number; drop: number; scale: number; period: number }) {
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = period / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sway, period]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-3.5deg', '3.5deg'] });

  return (
    <View style={{ position: 'absolute', top: 0, left, alignItems: 'center', transform: [{ scale }] }} pointerEvents="none">
      <View style={styles.lanternString} />
      {/* pivot near string : translateY + rotate + translateY inverse */}
      <Animated.View style={{ marginTop: drop, transform: [{ translateY: 34 }, { rotate }, { translateY: -34 }] }}>
        {/* halo lumineux derrière le corps */}
        <Svg width={92} height={92} style={styles.lanternGlow} pointerEvents="none">
          <Defs>
            <RadialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={Palette.lanternGold} stopOpacity={0.55} />
              <Stop offset="0.55" stopColor={Palette.lantern} stopOpacity={0.22} />
              <Stop offset="1" stopColor={Palette.lantern} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={46} cy={46} r={46} fill="url(#lanternGlow)" />
        </Svg>
        <View style={styles.lanternCap} />
        <View style={styles.lanternBody}>
          <View style={styles.lanternSheen} />
          <View style={[styles.lanternRib, { left: '32%' }]} />
          <View style={[styles.lanternRib, { left: '50%' }]} />
          <View style={[styles.lanternRib, { left: '68%' }]} />
        </View>
        <View style={styles.lanternCap} />
        <View style={styles.lanternTassel} />
      </Animated.View>
    </View>
  );
}

// Colonne de vapeur : 3 bouffées qui montent et s'estompent en boucle (décalées).
function SteamColumn({ left, delay }: { left: number; delay: number }) {
  return (
    <View style={{ position: 'absolute', bottom: `${STEAMER_RATIO * 100}%`, left }} pointerEvents="none">
      <Puff delay={delay} x={0} />
      <Puff delay={delay + 1000} x={12} />
      <Puff delay={delay + 2000} x={-6} />
    </View>
  );
}

function Puff({ delay, x }: { delay: number; x: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(t, { toValue: 1, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  // opacité 0 aux deux extrémités → le reset de la boucle (1 → 0) est invisible.
  const opacity = t.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 0.3, 0.16, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -78] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.5] });

  return <Animated.View style={[styles.steamPuff, { left: x, opacity, transform: [{ translateY }, { scale }] }]} />;
}

const styles = StyleSheet.create({
  moonGate: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Palette.wallTop,
    borderWidth: 6,
    borderColor: '#F0D2AE',
    opacity: 0.45,
  },
  moonGateInner: {
    position: 'absolute',
    top: 82,
    alignSelf: 'center',
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: '#FFFDF6',
    opacity: 0.4,
  },

  steamer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${STEAMER_RATIO * 100}%`,
    overflow: 'hidden',
  },
  weave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  weaveHighlight: {
    position: 'absolute',
    top: 26,
    bottom: 0,
    width: 10,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
    borderRadius: 5,
  },
  innerShadow: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 30,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    flexDirection: 'row',
    backgroundColor: Palette.steamerRim,
    alignItems: 'center',
  },
  rimHighlight: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
  },
  slat: {
    width: 14,
    height: 26,
    marginRight: 4,
    backgroundColor: Palette.steamerDark,
    borderRadius: 3,
    opacity: 0.6,
  },

  lanternString: { width: 2, height: 40, backgroundColor: Palette.lanternDark, opacity: 0.5 },
  lanternGlow: { position: 'absolute', top: -16, left: -20, zIndex: -1 },
  lanternCap: {
    width: 26,
    height: 8,
    backgroundColor: Palette.lanternGold,
    borderRadius: 3,
    alignSelf: 'center',
  },
  lanternBody: {
    width: 52,
    height: 44,
    backgroundColor: Palette.lantern,
    borderRadius: 26,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lanternSheen: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 16,
    height: 26,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
  },
  lanternRib: {
    position: 'absolute',
    top: 4,
    width: 1.5,
    height: 36,
    backgroundColor: Palette.lanternDark,
    opacity: 0.5,
  },
  lanternTassel: {
    width: 4,
    height: 16,
    backgroundColor: Palette.lanternGold,
    alignSelf: 'center',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  steamPuff: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.steam,
  },
});
