import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundThumb } from '@/components/BackgroundThumb';
import { DecorView } from '@/components/Decor';
import { DimAvatar } from '@/components/DimAvatar';
import { useGame } from '@/context/GameContext';
import { CATEGORY_LABELS, CATEGORY_ORDER, Item, ItemCategory } from '@/data/items';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

export default function InventoryScreen() {
  const router = useRouter();
  const { player, catalog, level, equipItem, unequipCategory, toggleDecor } = useGame();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const owned = catalog.filter((i) => player.ownedItems.includes(i.id));

  function toggle(item: Item) {
    Haptics.selectionAsync().catch(() => {});
    if (item.category === 'decor') {
      toggleDecor(item);
    } else if (player.equipped[item.category] === item.id) {
      unequipCategory(item.category);
    } else {
      equipItem(item);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={goBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Mes objets</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* aperçu en direct */}
      <View style={styles.stage}>
        <DimAvatar size={150} equipped={player.equipped} catalog={catalog} level={level} />
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
          const equippedId = player.equipped[cat];
          return (
            <View key={cat} style={{ marginBottom: Spacing.lg }}>
              <Text style={styles.section}>{CATEGORY_LABELS[cat]}</Text>
              <View style={styles.grid}>
                {items.map((item) => {
                  const isOn = isDecor ? player.placedDecor.includes(item.id) : equippedId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(item)}
                      style={({ pressed }) => [
                        styles.card,
                        isOn && styles.cardOn,
                        pressed && { transform: [{ scale: 0.96 }] },
                      ]}>
                      <View style={styles.preview}>
                        {isDecor ? (
                          <DecorView item={item} size={56} />
                        ) : isBackground ? (
                          <BackgroundThumb item={item} size={64} />
                        ) : (
                          <DimAvatar size={64} equipped={{ [item.category]: item.id }} catalog={catalog} level={level} />
                        )}
                      </View>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.status, isOn && { color: Palette.primaryDark }]}>
                        {isOn
                          ? isDecor ? 'Placé ✓' : isBackground ? 'Actif ✓' : 'Équipé ✓'
                          : isDecor ? 'Toucher pour placer' : isBackground ? 'Toucher pour activer' : 'Toucher pour mettre'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.panel, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.white, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  backText: { fontSize: 28, fontWeight: '800', color: Palette.ink, marginTop: -4 },
  title: { flex: 1, fontSize: 30, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1, textAlign: 'center' },
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
