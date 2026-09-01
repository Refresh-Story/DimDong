import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimalView } from '@/components/AnimalView';
import { BackgroundThumb } from '@/components/BackgroundThumb';
import { DecorView } from '@/components/Decor';
import { DimAvatar } from '@/components/DimAvatar';
import { ItemPreviewModal } from '@/components/ItemPreviewModal';
import { GemBadge, Toast, useToast } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { CATEGORY_LABELS, CATEGORY_ORDER, Item, ItemCategory, KIMONO_ID, actionVerbs } from '@/data/items';
import { canSell } from '@/game/economy';
import { BELTS, SENSEI_BELT, availableBelts, beltForPlayer, isSenseiName } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

export default function InventoryScreen() {
  const router = useRouter();
  const { player, catalog, level, equipItem, unequipCategory, toggleDecor, selectBelt, sellItem } = useGame();
  const [preview, setPreview] = useState<Item | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast, flash } = useToast();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const owned = catalog.filter((i) => player.ownedItems.includes(i.id));

  const belt = beltForPlayer(player.name, level, player.selectedBelt);
  const belts = availableBelts(player.name, level);

  /** Un objet est « en service » s'il est équipé, actif ou posé dans la scène. */
  function isActive(item: Item) {
    return item.category === 'decor'
      ? player.placedDecor.includes(item.id)
      : player.equipped[item.category] === item.id;
  }

  function openPreview(item: Item) {
    Haptics.selectionAsync().catch(() => {});
    setPreview(item);
  }

  function toggle(item: Item) {
    Haptics.selectionAsync().catch(() => {});
    if (item.category === 'decor') {
      toggleDecor(item);
    } else if (player.equipped[item.category] === item.id) {
      unequipCategory(item.category);
    } else {
      equipItem(item);
    }
    setPreview(null);
  }

  async function handleSell(item: Item) {
    setBusy(item.id);
    const res = await sellItem(item);
    setBusy(null);
    setPreview(null);
    if (res === 'ok') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      flash(`${item.name} revendu — +${item.price} gemmes`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      flash('Cet objet ne peut pas être revendu.');
    }
  }

  function pickBelt(label: string) {
    Haptics.selectionAsync().catch(() => {});
    selectBelt(player.selectedBelt === label ? null : label);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={goBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Mes objets</Text>
        <GemBadge count={player.gems} />
      </View>

      <View style={styles.stage}>
        <DimAvatar size={150} equipped={player.equipped} catalog={catalog} level={level} emotion={player.emotion} belt={belt} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {owned.length === 0 && (
          <Text style={styles.empty}>
            Tu n'as pas encore d'objets. Va dans la Boutique pour en acheter avec tes gemmes&nbsp;!
          </Text>
        )}

        {CATEGORY_ORDER.map((cat: ItemCategory) => {
          const items = owned.filter((i) => i.category === cat);
          if (!items.length) return null;
          const isDecor = cat === 'decor';
          const isBackground = cat === 'background';
          return (
            <View key={cat} style={{ marginBottom: Spacing.lg }}>
              <Text style={styles.section}>{CATEGORY_LABELS[cat]}</Text>
              <View style={styles.grid}>
                {items.map((item) => {
                  const isOn = isActive(item);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => openPreview(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name} — voir la fiche`}
                      style={({ pressed }) => [
                        styles.card,
                        isOn && styles.cardOn,
                        pressed && { transform: [{ scale: 0.96 }] },
                      ]}>
                      <View style={styles.preview}>
                        {cat === 'animal' ? (
                          <AnimalView item={item} size={60} />
                        ) : isDecor ? (
                          <DecorView item={item} size={56} />
                        ) : isBackground ? (
                          <BackgroundThumb item={item} size={64} />
                        ) : (
                          <DimAvatar size={64} equipped={{ [item.category]: item.id }} catalog={catalog} level={level} />
                        )}
                      </View>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.status, isOn && { color: Palette.primaryDark }]}>
                        {/* La ceinture se choisit dans la fiche du kimono : la tuile l'annonce. */}
                        {isOn ? actionVerbs(cat).state : item.id === KIMONO_ID ? `Ceinture ${belt.label}` : 'Toucher pour voir'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

      </ScrollView>

      <ItemPreviewModal
        mode="inventory"
        item={preview}
        catalog={catalog}
        equipped={player.equipped}
        placedDecor={player.placedDecor}
        emotion={player.emotion}
        level={level}
        belt={belt}
        gems={player.gems}
        active={!!preview && isActive(preview)}
        sellable={!!preview && canSell(preview)}
        beltPicker={
          preview?.id === KIMONO_ID
            ? {
                allBelts: isSenseiName(player.name) ? [...BELTS, SENSEI_BELT] : BELTS,
                earnedLabels: belts.map((b) => b.label),
                currentLabel: belt.label,
                selected: player.selectedBelt,
                onPick: pickBelt,
              }
            : undefined
        }
        busy={!!preview && busy === preview.id}
        onCancel={() => setPreview(null)}
        onToggle={toggle}
        onSell={handleSell}
      />

      <Toast message={toast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.panel, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  backText: { fontSize: 28, fontWeight: '800', color: Palette.ink, marginTop: -4 },
  // Même en-tête que la Boutique : retour / titre / solde.
  title: { flex: 1, fontSize: 30, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  stage: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, height: 200 },
  empty: { fontSize: 16, fontFamily: Fonts.body, color: Palette.inkSoft, textAlign: 'center', padding: Spacing.xl, lineHeight: 24 },
  section: { fontSize: 20, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5, marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    width: '47%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 3,
    borderColor: Palette.outline,
    ...Shadow.card,
  },
  cardOn: { backgroundColor: '#EAF1FF', shadowColor: Palette.accent2 },
  preview: { height: 88, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Palette.ink },
  status: { fontSize: 12, fontFamily: Fonts.body, color: Palette.inkSoft },
});
