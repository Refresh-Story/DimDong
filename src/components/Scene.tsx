// Scène de Dim-Dong, façon MANGA : fond papier + trame (screentone) + traits de
// vitesse derrière le héros, éléments hauts, ambiance animée et sol.
//
// Depuis les décors d'arrière-plan achetables, Scene est un shell de composition
// paramétré par une BackgroundConfig (cf. src/data/backgrounds.ts) :
//  - sans prop `background` (ou kind inconnu) → salon de dim-sum historique ;
//  - les variantes visuelles vivent dans src/components/scene/{Floor,Upper,Ambient}.
// Invariants : le sol occupe la part basse FLOOR_RATIO, les décorations achetées se
// posent toujours sur son rebord (positions inchangées : item.x / item.w), et le
// personnage ({children}) ne bouge pas d'un décor à l'autre.
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { DecorView } from '@/components/Decor';
import { Ambient } from '@/components/scene/Ambient';
import { Floor } from '@/components/scene/Floor';
import { Upper } from '@/components/scene/Upper';
import { SpeedLines } from '@/components/ui';
import { FLOOR_RATIO, getBackground } from '@/data/backgrounds';
import { Item } from '@/data/items';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

// Trame manga (screentone) : champ de petits points réguliers, faible contraste.
function Halftone({ opacity = 0.5, dot = Palette.screentoneMid }: { opacity?: number; dot?: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="halftone" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <Circle cx="3" cy="3" r="2" fill={dot} opacity={opacity} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#halftone)" />
    </Svg>
  );
}

export function Scene({
  children,
  decor = [],
  background,
}: {
  children?: React.ReactNode;
  decor?: Item[];
  // Clé du décor d'arrière-plan équipé (Item.background) ; absent = décor par défaut.
  background?: string;
}) {
  const cfg = getBackground(background);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* fond papier manga */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.paper }]} />

      {/* trame de fond, légère, sur toute la surface */}
      <Halftone opacity={cfg.halftone.opacity} dot={cfg.halftone.dot} />

      {/* traits de vitesse derrière le héros (cadrage central, dynamisme manga) */}
      <View style={styles.speed} pointerEvents="none">
        <SpeedLines size={SCREEN_W * 1.3} color={cfg.speed.color} count={34} innerRatio={0.34} opacity={cfg.speed.opacity} />
      </View>

      {/* "case ronde" qui encadre le personnage (spotlight manga) */}
      <View style={[styles.spotlight, { backgroundColor: cfg.spotlight.fill, opacity: cfg.spotlight.fillOpacity }]} />
      <View style={[styles.spotlightRing, { borderColor: cfg.spotlight.ring, opacity: cfg.spotlight.ringOpacity }]} />

      {/* éléments hauts : lanternes, noren, skyline… selon le décor */}
      <Upper upper={cfg.upper} />

      {/* ambiance animée : vapeur, pétales, étoiles… selon le décor */}
      <Ambient ambient={cfg.ambient} />

      {/* sol (panier vapeur, tatamis, comptoir…) + décorations posées sur le rebord */}
      <View style={styles.floor}>
        <Floor floor={cfg.floor} />
        {decor.map((item) => {
          const w = item.w ?? 90;
          return (
            <View
              key={item.id}
              style={{ position: 'absolute', top: 30, left: (item.x ?? 0.5) * SCREEN_W - w / 2 }}>
              <DecorView item={item} size={w} />
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  speed: {
    position: 'absolute',
    top: -SCREEN_W * 0.2,
    alignSelf: 'center',
    left: SCREEN_W * 0.5 - SCREEN_W * 0.65,
  },

  // Spotlight rond derrière le héros (case ronde manga, contour encre).
  spotlight: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    width: 196,
    height: 196,
    borderRadius: 98,
  },
  spotlightRing: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 3,
  },

  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${FLOOR_RATIO * 100}%`,
    overflow: 'hidden',
    borderTopWidth: 3,
    borderColor: Palette.outline,
  },
});
