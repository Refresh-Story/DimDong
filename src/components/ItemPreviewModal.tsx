import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { DECOR_FRAME, type Emotion } from '@/art/dimArt';
import { DecorView } from '@/components/Decor';
import { DimAvatar } from '@/components/DimAvatar';
import { RainbowAura } from '@/components/RainbowAura';
import { Scene } from '@/components/Scene';
import { sceneGeom, type SceneGeom as SceneGeomT } from '@/art/sceneGeom';
import { Item, ItemCategory, actionVerbs, getItemById } from '@/data/items';
import type { Belt } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const CARD_W = Math.min(SCREEN_W - Spacing.lg * 2, 420);
const STAGE_W = CARD_W - Spacing.lg * 2;
// Hauteur du titre, de la rareté, de la légende, des boutons et des marges de la carte.
// L'inventaire empile une rangée de boutons de plus : sans ça la carte déborde sur petit écran.
const CARD_CHROME = { shop: 215, inventory: 275 } as const;

/** Le plus grand cadre que laisse le reste de la carte, en gardant un format lisible. */
function stageHeight(insetV: number, mode: Mode) {
  return Math.max(200, Math.min(SCREEN_H - insetV - Spacing.xl * 2 - CARD_CHROME[mode], STAGE_W * 1.25));
}

const RARITY_LABEL: Record<Item['rarity'], string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

type Mode = 'shop' | 'inventory';

/** Ce que la carte propose une fois l'objet mis en scène : l'acheter, ou en disposer. */
type ModeProps =
  | { mode: 'shop'; owned: boolean; onBuy: (item: Item) => void }
  | {
      mode: 'inventory';
      /** Objet actuellement équipé / actif / placé. */
      active: boolean;
      sellable: boolean;
      onToggle: (item: Item) => void;
      onSell: (item: Item) => void;
    };

type ItemPreviewModalProps = {
  item: Item | null;
  catalog: Item[];
  equipped: Partial<Record<ItemCategory, string>>;
  placedDecor: string[];
  emotion: Emotion;
  level: number;
  belt: Belt;
  gems: number;
  busy: boolean;
  onCancel: () => void;
} & ModeProps;

/**
 * La scène est rendue à la taille réelle de la carte : l'art étant généré pour sa boîte,
 * plus besoin de la dessiner en plein écran pour la réduire ensuite. Le rendu est net
 * (SVG à la résolution native) et la composition se recompose au format de la carte.
 */
function ScenePreview({
  height,
  background,
  decor,
  spotlight,
  children,
}: {
  height: number;
  background?: string;
  decor: Item[];
  spotlight?: Item | null;
  children?: React.ReactNode;
}) {
  const g = useMemo(() => sceneGeom(STAGE_W, height), [height]);
  return (
    <View style={[styles.stage, { height }]}>
      <Scene geom={g} scope="preview" background={background} decor={decor} stage={children}>
        {spotlight && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: g.groundY, zIndex: 1 }} pointerEvents="none">
            <DecorSpotlight item={spotlight} geom={g} />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: (spotlight.x ?? 0.5) * g.w - ((spotlight.w ?? 90) * g.u) / 2,
              }}>
              <DecorView item={spotlight} size={(spotlight.w ?? 90) * g.u} />
            </View>
          </View>
        )}
      </Scene>
    </View>
  );
}

/** Halo pulsé posé sur la décoration convoitée, pour qu'on la repère du premier coup d'œil. */
function DecorSpotlight({ item, geom: g }: { item: Item; geom: SceneGeomT }) {
  const w = (item.w ?? 90) * g.u;
  const h = (w * DECOR_FRAME.h) / DECOR_FRAME.w;
  const size = w * 2.4;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        // Centré sur l'objet, lui-même posé à -22 de la ligne d'horizon comme dans la scène.
        bottom: -22 + h / 2 - size / 2,
        left: (item.x ?? 0.5) * SCREEN_W - size / 2,
        opacity,
        transform: [{ scale }],
      }}
      pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="spotlight" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={Palette.accent} stopOpacity={0.85} />
            <Stop offset="0.55" stopColor={Palette.accent} stopOpacity={0.35} />
            <Stop offset="1" stopColor={Palette.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#spotlight)" />
      </Svg>
    </Animated.View>
  );
}

export function ItemPreviewModal(props: ItemPreviewModalProps) {
  const { item, catalog, equipped, placedDecor, emotion, level, belt, gems, busy, onCancel } = props;
  const insets = useSafeAreaInsets();
  const stageH = stageHeight(insets.top + insets.bottom, props.mode);
  // Même proportion que sur l'accueil, bornée par la hauteur de ciel du cadre.
  const dimSize = Math.min(STAGE_W * 0.56, stageH * 0.42);

  // La revente se confirme en deux temps : un enfant ne doit pas s'en séparer d'un doigt distrait.
  const [confirmingSale, setConfirmingSale] = useState(false);

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!item) return;
    setConfirmingSale(false);
    pop.setValue(0.85);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 150, useNativeDriver: true }).start();
  }, [item, pop]);

  if (!item) return null;

  const isBackground = item.category === 'background';
  const isDecor = item.category === 'decor';

  // On rejoue la scène du joueur en n'y injectant que l'objet convoité.
  const previewEquipped = isBackground || isDecor ? equipped : { ...equipped, [item.category]: item.id };
  const previewBackground = isBackground
    ? item.background
    : getItemById(catalog, equipped.background)?.background;
  const previewDecor = catalog.filter((i) => placedDecor.includes(i.id) && i.id !== item.id);

  const isRainbow = !!getItemById(catalog, previewEquipped.color)?.rainbow;
  const missing = Math.max(0, item.price - gems);
  const canAfford = missing === 0;

  // Face à une décoration, le dim s'écarte du côté opposé pour ne pas la masquer.
  const dimX = isDecor ? ((item.x ?? 0.5) < 0.5 ? 0.68 : 0.32) : 0.5;

  const verbs = actionVerbs(item.category);
  const inStock = props.mode === 'inventory';
  const caption = isBackground
    ? inStock
      ? 'Voilà à quoi ressemble ta scène avec ce décor.'
      : 'Voilà à quoi ressemblera ta scène.'
    : isDecor
      ? inStock
        ? 'Voilà où il se pose dans ta scène.'
        : 'Voilà où il se posera dans ta scène.'
      : 'Voilà ton dim-sum avec cet objet.';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Fermer l'aperçu" />
        <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rarity, item.rarity === 'legendary' && styles.rarityLegendary]}>
            {item.rarity === 'legendary' ? '★ ' : ''}
            {RARITY_LABEL[item.rarity]}
          </Text>

          <ScenePreview
            height={stageH}
            background={previewBackground}
            decor={previewDecor}
            spotlight={isDecor ? item : null}>
            {/* L'aura se cale sur le coin haut-gauche de son parent : on l'enferme avec le dim. */}
            <View style={{ left: (dimX - 0.5) * STAGE_W, marginBottom: -dimSize * 0.13 }}>
              {isRainbow && <RainbowAura size={dimSize} />}
              <DimAvatar
                size={dimSize}
                equipped={previewEquipped}
                catalog={catalog}
                level={level}
                emotion={emotion}
                belt={belt}
              />
            </View>
          </ScenePreview>

          <Text style={styles.caption}>{caption}</Text>

          {props.mode === 'shop' ? (
            props.owned ? (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [styles.action, styles.actionGhost, pressed && styles.actionPressed]}>
                <Text style={styles.actionGhostText}>{"Tu l'as déjà — fermer"}</Text>
              </Pressable>
            ) : (
              <>
                {!canAfford && (
                  <Text style={styles.missing}>Il te manque {missing} gemmes.</Text>
                )}
                <View style={styles.actions}>
                  <Pressable
                    onPress={onCancel}
                    style={({ pressed }) => [styles.action, styles.actionGhost, pressed && styles.actionPressed]}>
                    <Text style={styles.actionGhostText}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    disabled={!canAfford || busy}
                    onPress={() => props.onBuy(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Acheter ${item.name} pour ${item.price} gemmes`}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: canAfford ? Palette.primary : Palette.locked },
                      pressed && canAfford && styles.actionPressed,
                    ]}>
                    <Text style={styles.actionText}>Acheter</Text>
                    <View style={styles.gem} />
                    <Text style={styles.actionPrice}>{item.price}</Text>
                  </Pressable>
                </View>
              </>
            )
          ) : confirmingSale ? (
            <>
              <Text style={styles.missing}>
                Tu ne l&apos;auras plus. On te rend {item.price} gemmes — tu en auras {gems + item.price}.
              </Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setConfirmingSale(false)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.action, styles.actionGhost, pressed && styles.actionPressed]}>
                  <Text style={styles.actionGhostText}>Non, je garde</Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => props.onSell(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Confirmer la revente de ${item.name} pour ${item.price} gemmes`}
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: Palette.danger },
                    pressed && styles.actionPressed,
                  ]}>
                  <Text style={styles.actionText}>Oui, revendre</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => props.onToggle(item)}
                accessibilityRole="button"
                accessibilityLabel={`${props.active ? verbs.off : verbs.on} ${item.name}`}
                style={({ pressed }) => [
                  styles.action,
                  props.active ? styles.actionGhost : { backgroundColor: Palette.primary },
                  pressed && styles.actionPressed,
                ]}>
                <Text style={props.active ? styles.actionGhostText : styles.actionText}>
                  {props.active ? verbs.off : verbs.on}
                </Text>
              </Pressable>
              {!props.sellable && (
                <Text style={styles.caption}>Cadeau de bienvenue : impossible à revendre.</Text>
              )}
              <View style={styles.actions}>
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [styles.action, styles.actionGhost, pressed && styles.actionPressed]}>
                  <Text style={styles.actionGhostText}>Fermer</Text>
                </Pressable>
                {props.sellable && (
                  <Pressable
                    onPress={() => setConfirmingSale(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Revendre ${item.name} pour ${item.price} gemmes`}
                    style={({ pressed }) => [
                      styles.action,
                      // Le rouge est réservé à la confirmation : ici l'action rapporte des gemmes.
                      { backgroundColor: Palette.gemDark },
                      pressed && styles.actionPressed,
                    ]}>
                    <Text style={styles.actionText}>Revendre</Text>
                    <View style={styles.gem} />
                    <Text style={styles.actionPrice}>{item.price}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,22,29,0.55)' },
  card: {
    width: CARD_W,
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  title: { fontSize: 26, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5, textAlign: 'center' },
  rarity: { fontSize: 13, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center', marginTop: -6 },
  rarityLegendary: { color: '#C8901A' },
  stage: {
    width: STAGE_W,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: Palette.outline,
    backgroundColor: Palette.paper,
    overflow: 'hidden',
  },
  caption: { fontSize: 13, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center' },
  missing: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Palette.primaryDark, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.md },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    borderColor: Palette.outline,
  },
  actionPressed: { transform: [{ scale: 0.96 }] },
  actionGhost: { backgroundColor: Palette.cardSoft },
  actionGhostText: { color: Palette.ink, fontFamily: Fonts.bodyBold, fontSize: 16 },
  actionText: { color: Palette.white, fontFamily: Fonts.bodyBold, fontSize: 16 },
  actionPrice: { color: Palette.white, fontSize: 18, fontFamily: Fonts.digits, letterSpacing: 0.5 },
  gem: {
    width: 14,
    height: 14,
    backgroundColor: Palette.white,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    borderColor: Palette.ink,
  },
});

export default ItemPreviewModal;
