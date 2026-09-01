import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { darken } from '@/art/dimArt';
import type { Belt } from '@/game/rules';
import { Fonts, Palette, Radius, Spacing } from '@/theme';

export type BeltPickerProps = {
  // Toutes les ceintures dans l'ordre de progression (+ Sensei si le nom s'y prête).
  allBelts: Belt[];
  // Labels des ceintures déjà obtenues : les autres s'affichent verrouillées.
  earnedLabels: string[];
  // Ceinture effectivement portée (beltForPlayer).
  currentLabel: string;
  // player.selectedBelt ; null = ceinture du niveau courant.
  selected: string | null;
  // Le parent gère le retour à l'automatique (re-taper la ceinture portée).
  onPick: (label: string) => void;
};

// Sélecteur de ceinture de la fiche du kimono : les ceintures futures restent
// visibles mais verrouillées, pour donner envie de progresser.
export function BeltPicker({ allBelts, earnedLabels, currentLabel, selected, onPick }: BeltPickerProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Ta ceinture</Text>
      <View style={styles.row}>
        {allBelts.map((b) => {
          const earned = earnedLabels.includes(b.label);
          const worn = b.label === currentLabel;
          return (
            <Pressable
              key={b.label}
              disabled={!earned}
              onPress={() => onPick(b.label)}
              accessibilityRole="button"
              accessibilityLabel={`Ceinture ${b.label}`}
              accessibilityState={{ selected: worn, disabled: !earned }}
              style={({ pressed }) => [
                styles.ribbon,
                { backgroundColor: b.color },
                worn && styles.ribbonOn,
                !earned && styles.ribbonLocked,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}>
              <View style={[styles.seam, { backgroundColor: darken(b.color, 0.25) }]} />
              {b.accent && <View style={[styles.accentBand, { backgroundColor: b.accent }]} />}
              {!earned && <Text style={styles.lock}>🔒</Text>}
              {worn && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.caption}>
        {selected === null
          ? `Ceinture ${currentLabel} — celle de ton niveau.`
          : `Ceinture ${currentLabel} — retouche-la pour revenir à celle de ton niveau.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.xs, alignItems: 'center' },
  title: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Palette.ink },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  ribbon: {
    width: 44,
    height: 26,
    borderRadius: Radius.sharp + 4,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonOn: { borderWidth: 3.5, borderColor: Palette.primaryDark, transform: [{ scale: 1.1 }] },
  ribbonLocked: { opacity: 0.35 },
  seam: { position: 'absolute', left: 3, right: 3, top: 10, height: 2, borderRadius: 1 },
  accentBand: { position: 'absolute', left: 3, right: 3, top: 6, height: 9, borderRadius: 2 },
  lock: { fontSize: 12 },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.primaryDark,
    borderWidth: 2,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Palette.white, fontSize: 10, fontFamily: Fonts.bodyBold, lineHeight: 12 },
  caption: { fontSize: 13, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
});

export default BeltPicker;
