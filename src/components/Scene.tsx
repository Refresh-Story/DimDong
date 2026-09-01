import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect, SvgXml } from 'react-native-svg';

import { sceneLayers } from '@/art/sceneCompose';
import type { SceneGeom } from '@/art/sceneGeom';
import { speedLinePaths } from '@/art/sceneGeom';
import { DecorView } from '@/components/Decor';
import { Ambient } from '@/components/scene/Ambient';
import { useSceneLayout } from '@/components/scene/useSceneLayout';
import { getBackground } from '@/data/backgrounds';
import { Item } from '@/data/items';
import { Palette } from '@/theme';

/** Amplitude de la dérive de chaque plan, en px. Le plan de premier plan reste fixe :
 *  c'est lui qui touche la ligne d'horizon, il ne doit jamais s'en décoller. */
const DRIFT = { back: 4, mid: 9 };

function useDrift() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

/**
 * Plan de ciel animé. Le `scaleX` de 1.06 donne la marge latérale que la dérive consomme,
 * sans toucher à la verticale — l'horizon ne bouge donc pas d'un pixel.
 */
function SkyLayer({
  xml,
  g,
  drift,
  amp,
}: {
  xml: string;
  g: SceneGeom;
  drift?: Animated.Value;
  amp?: number;
}) {
  const style = amp
    ? {
        transform: [
          { scaleX: 1.06 },
          { translateX: drift!.interpolate({ inputRange: [0, 1], outputRange: [-amp, amp] }) },
        ],
      }
    : undefined;
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: g.top, width: g.w, height: g.skyH }, style]}
      pointerEvents="none">
      <SvgXml xml={xml} width={g.w} height={g.skyH} />
    </Animated.View>
  );
}

function Halftone({ opacity, dot, g }: { opacity: number; dot: string; g: SceneGeom }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="halftone" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <Circle cx="3" cy="3" r="2" fill={dot} opacity={opacity * 0.55} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#halftone)" />
    </Svg>
  );
}

/** Faisceau de concentration, resserré derrière le personnage. */
function SceneSpeedLines({ g, color, opacity }: { g: SceneGeom; color: string; opacity: number }) {
  const size = g.w * 0.52;
  const lines = useMemo(() => speedLinePaths(size, 30, 0.42, 1.8), [size]);
  return (
    <Svg
      width={size}
      height={size}
      pointerEvents="none"
      style={{ position: 'absolute', left: g.w * 0.5 - size / 2, top: g.horizonY - size * 0.78, opacity: opacity * 0.5 }}>
      {lines.map((l, i) => (
        <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

export function Scene({
  children,
  decor = [],
  background,
  geom,
  scope = 'home',
  stage,
  topReserve = 0,
}: {
  children?: React.ReactNode;
  decor?: Item[];
  background?: string;
  /** Géométrie imposée (modale d'aperçu, vignette) ; sinon celle de la fenêtre. */
  geom?: SceneGeom;
  /** Namespace des ids SVG : une scène par scope. */
  scope?: string;
  /** Contenu posé sur la ligne d'horizon — le personnage. */
  stage?: React.ReactNode;
  /**
   * Hauteur cédée au HUD en haut de l'écran. Le ciel démarre sous cette bande au lieu d'être
   * recouvert par la barre de progression ; l'horizon, le sol et le personnage ne bougent pas.
   */
  topReserve?: number;
}) {
  const cfg = getBackground(background);
  const g = useSceneLayout(geom, topReserve);
  const drift = useDrift();
  const layers = useMemo(() => sceneLayers(cfg, g, { scope }), [cfg, g, scope]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.paper }]} />

      {/* Bande cédée au HUD : peinte de la couleur qu'a le ciel à son y = 0, sinon la carte de
          progression flotterait sur un aplat de papier qui jure avec le décor (matsuri, neon). */}
      {g.top > 0 ? (
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: g.top, backgroundColor: layers.cap }}
          pointerEvents="none"
        />
      ) : null}

      <SkyLayer xml={layers.back} g={g} drift={drift} amp={DRIFT.back} />
      <SkyLayer xml={layers.mid} g={g} drift={drift} amp={DRIFT.mid} />
      <SkyLayer xml={layers.front} g={g} />

      <Ambient ambient={cfg.ambient} geom={g} />

      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: g.floorH, overflow: 'hidden' }}
        pointerEvents="none">
        <SvgXml xml={layers.ground} width={g.w} height={g.floorH} />
      </View>

      {/* Une seule ligne d'horizon, en px appareil : elle reste nette sur tous les écrans. */}
      <View
        style={{ position: 'absolute', left: 0, right: 0, top: g.horizonY, height: 3, backgroundColor: Palette.outline }}
        pointerEvents="none"
      />

      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: g.groundY }} pointerEvents="none">
        {decor.map((item) => {
          const w = (item.w ?? 90) * g.u;
          return (
            <View
              key={item.id}
              style={{ position: 'absolute', bottom: 0, left: (item.x ?? 0.5) * g.w - w / 2, alignItems: 'center' }}>
              <DecorView item={item} size={w} />
              <View
                style={{
                  position: 'absolute',
                  bottom: -w * 0.05,
                  width: w * 0.84,
                  height: w * 0.22,
                  borderRadius: w * 0.42,
                  backgroundColor: Palette.ink,
                  opacity: 0.18,
                }}
              />
            </View>
          );
        })}
      </View>

      {stage ? (
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: g.groundY, alignItems: 'center', justifyContent: 'flex-end' }}
          pointerEvents="box-none">
          {stage}
        </View>
      ) : null}

      <SceneSpeedLines g={g} color={cfg.speed.color} opacity={cfg.speed.opacity} />
      <Halftone opacity={cfg.halftone.opacity} dot={cfg.halftone.dot} g={g} />

      {children}
    </View>
  );
}
