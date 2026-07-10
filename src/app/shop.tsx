import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundThumb } from '@/components/BackgroundThumb';
import { DecorView } from '@/components/Decor';
import { DimAvatar } from '@/components/DimAvatar';
import { GemBadge } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { CATEGORY_LABELS, CATEGORY_ORDER, Item } from '@/data/items';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

const RARITY_LABEL: Record<Item['rarity'], string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export default function ShopScreen() {
  const router = useRouter();
  const { player, catalog, level, buyItem, grantItem } = useGame();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Secret : 10 appuis d'affilée sur la Rainbow → débloquée gratuitement.
  const secretTaps = useRef(0);
  const secretTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (secretTimer.current) clearTimeout(secretTimer.current);
  }, []);

  function secretTap(it: Item) {
    if (!it.rainbow || player.ownedItems.includes(it.id)) return;
    Haptics.selectionAsync().catch(() => {});
    secretTaps.current += 1;
    if (secretTimer.current) clearTimeout(secretTimer.current);
    secretTimer.current = setTimeout(() => {
      secretTaps.current = 0;
    }, 1500);
    if (secretTaps.current >= 10) {
      secretTaps.current = 0;
      if (secretTimer.current) clearTimeout(secretTimer.current);
      grantItem(it);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      flash('🌈 Secret débloqué ! Rainbow offert !');
    }
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const toastScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    toastScale.setValue(0.6);
    Animated.spring(toastScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, [toast, toastScale]);

  async function handleBuy(item: Item) {
    setBusy(item.id);
    const res = await buyItem(item);
    setBusy(null);
    if (res === 'ok') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      flash(`${item.name} acheté !`);
    } else if (res === 'owned') {
      flash('Tu as déjà cet objet.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      flash('Pas assez de gemmes 💎');
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={goBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Boutique</Text>
        <GemBadge count={player.gems} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {CATEGORY_ORDER.map((cat) => {
          const items = catalog.filter((i) => i.category === cat);
          if (!items.length) return null;
          return (
            <View key={cat} style={{ marginBottom: Spacing.lg }}>
              <Text style={styles.section}>{CATEGORY_LABELS[cat]}</Text>
              <View style={styles.grid}>
                {items.map((item) => {
                  const owned = player.ownedItems.includes(item.id);
                  const canAfford = player.gems >= item.price;
                  const legendary = item.rarity === 'legendary';
                  return (
                    <View key={item.id} style={[styles.card, legendary && styles.cardLegendary]}>
                      {item.rainbow ? (
                        <Pressable style={styles.preview} onPress={() => secretTap(item)}>
                          <DimAvatar size={72} equipped={{ [item.category]: item.id }} catalog={catalog} level={level} />
                        </Pressable>
                      ) : (
                        <View style={styles.preview}>
                          {item.category === 'decor' ? (
                            <DecorView item={item} size={62} />
                          ) : item.category === 'background' ? (
                            <BackgroundThumb item={item} size={72} />
                          ) : (
                            <DimAvatar size={72} equipped={{ [item.category]: item.id }} catalog={catalog} level={level} />
                          )}
                        </View>
                      )}
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.rarity, legendary && styles.rarityLegendary]}>
                        {legendary ? '★ ' : ''}{RARITY_LABEL[item.rarity]}
                      </Text>
                      {owned ? (
                        <View style={[styles.buy, styles.owned]}>
                          <Text style={styles.ownedText}>Possédé ✓</Text>
                        </View>
                      ) : (
                        <Pressable
                          disabled={busy === item.id || !canAfford}
                          onPress={() => handleBuy(item)}
                          style={({ pressed }) => [
                            styles.buy,
                            { backgroundColor: canAfford ? Palette.primary : Palette.locked },
                            pressed && canAfford && { transform: [{ scale: 0.96 }] },
                          ]}>
                          <View style={styles.gemSmall} />
                          <Text style={styles.buyText}>{item.price}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {toast && (
        <Animated.View style={[styles.toast, { transform: [{ scale: toastScale }] }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.panel, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  backText: { fontSize: 28, fontWeight: '800', color: Palette.ink, marginTop: -4 },
  title: { flex: 1, fontSize: 30, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1 },
  section: { fontSize: 20, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5, marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    width: '47%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.card,
  },
  cardLegendary: { backgroundColor: '#FFFBEF', borderColor: Palette.gold },
  preview: { height: 96, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Palette.ink },
  rarity: { fontSize: 12, fontFamily: Fonts.body, color: Palette.inkSoft, marginBottom: 4 },
  rarityLegendary: { color: '#C8901A' },
  buy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'stretch',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    borderColor: Palette.outline,
  },
  gemSmall: { width: 14, height: 14, backgroundColor: Palette.white, borderRadius: 3, transform: [{ rotate: '45deg' }], borderWidth: 1.5, borderColor: Palette.ink },
  buyText: { color: Palette.white, fontSize: 18, fontFamily: Fonts.display, letterSpacing: 0.5 },
  owned: { backgroundColor: Palette.cardSoft },
  ownedText: { color: Palette.ink, fontFamily: Fonts.bodyBold },
  toast: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: Palette.ink,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    borderColor: Palette.outline,
  },
  toastText: { color: Palette.white, fontFamily: Fonts.bodyBold },
});
