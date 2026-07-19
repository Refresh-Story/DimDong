import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import type { Emotion } from '@/art/dimArt';
import { isEmotion } from '@/data/emotions';
import { FALLBACK_CATALOG, Item, ItemCategory, KIMONO_ID } from '@/data/items';
import { BELTS, dayKey, levelFromXp, levelProgress } from '@/game/rules';
import {
  BrushResult,
  BuyStatus,
  DEFAULT_PLAYER,
  PlayerState,
  brush as brushOp,
  buy as buyOp,
  equip as equipOp,
  grant as grantOp,
  selectBelt as selectBeltOp,
  setEmotion as setEmotionOp,
  setName as setNameOp,
  toggleDecor as toggleDecorOp,
  unequip as unequipOp,
} from '@/game/economy';

export type { BrushResult, PlayerState } from '@/game/economy';

const PLAYER_KEY = 'dimdong.player';
// Ancien cache du catalogue distant (Firebase) ; purgé au démarrage.
const LEGACY_CATALOG_KEY = 'dimdong.catalog';

type GameContextValue = {
  ready: boolean;
  player: PlayerState;
  catalog: Item[];
  level: number;
  progress: number;
  setName: (name: string) => Promise<void>;
  setEmotion: (emotion: Emotion) => Promise<void>;
  selectBelt: (label: string | null) => Promise<void>;
  brushCompleted: () => Promise<BrushResult>;
  buyItem: (item: Item) => Promise<'ok' | 'owned' | 'insufficient'>;
  grantItem: (item: Item) => Promise<void>;
  equipItem: (item: Item) => Promise<void>;
  unequipCategory: (category: ItemCategory) => Promise<void>;
  toggleDecor: (item: Item) => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

function sanitize(data: any): PlayerState {
  return {
    ...DEFAULT_PLAYER,
    ...data,
    equipped: data?.equipped ?? {},
    ownedItems: Array.from(new Set([KIMONO_ID, ...(data?.ownedItems ?? [])])),
    placedDecor: data?.placedDecor ?? [],
    emotion: isEmotion(data?.emotion) ? data.emotion : DEFAULT_PLAYER.emotion,
    selectedBelt: BELTS.some((b) => b.label === data?.selectedBelt) ? data.selectedBelt : null,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(DEFAULT_PLAYER);
  const catalog: Item[] = FALLBACK_CATALOG;
  const [ready, setReady] = useState(false);

  const playerRef = useRef<PlayerState>(DEFAULT_PLAYER);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLAYER_KEY);
        const p = raw ? sanitize(JSON.parse(raw)) : DEFAULT_PLAYER;
        playerRef.current = p;
        setPlayer(p);
      } catch (e) {
        console.warn('Lecture du joueur local échouée', e);
      } finally {
        setReady(true);
      }
      AsyncStorage.removeItem(LEGACY_CATALOG_KEY).catch(() => {});
    })();
  }, []);

  const persist = useCallback((p: PlayerState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(p)).catch((e) =>
        console.warn('Sauvegarde locale échouée', e)
      );
    }, 300);
  }, []);

  const flush = useCallback(() => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(playerRef.current)).catch((e) =>
      console.warn('Sauvegarde locale échouée', e)
    );
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const commit = useCallback(
    (next: PlayerState) => {
      playerRef.current = next;
      setPlayer(next);
      persist(next);
    },
    [persist]
  );

  const setName = useCallback(
    async (name: string) => {
      commit(setNameOp(playerRef.current, name));
    },
    [commit]
  );

  const setEmotion = useCallback(
    async (emotion: Emotion) => {
      commit(setEmotionOp(playerRef.current, emotion));
    },
    [commit]
  );

  const selectBelt = useCallback(
    async (label: string | null) => {
      commit(selectBeltOp(playerRef.current, label));
    },
    [commit]
  );

  const brushCompleted = useCallback(async (): Promise<BrushResult> => {
    const { player, result } = brushOp(playerRef.current, dayKey(new Date()));
    commit(player);
    return result;
  }, [commit]);

  const buyItem = useCallback(
    async (item: Item): Promise<BuyStatus> => {
      const { player, status } = buyOp(playerRef.current, item);
      if (status === 'ok') commit(player);
      return status;
    },
    [commit]
  );

  const grantItem = useCallback(
    async (item: Item) => {
      commit(grantOp(playerRef.current, item));
    },
    [commit]
  );

  const equipItem = useCallback(
    async (item: Item) => {
      commit(equipOp(playerRef.current, item));
    },
    [commit]
  );

  const unequipCategory = useCallback(
    async (category: ItemCategory) => {
      commit(unequipOp(playerRef.current, category));
    },
    [commit]
  );

  const toggleDecor = useCallback(
    async (item: Item) => {
      commit(toggleDecorOp(playerRef.current, item));
    },
    [commit]
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      player,
      catalog,
      level: levelFromXp(player.xp),
      progress: levelProgress(player.xp),
      setName,
      setEmotion,
      selectBelt,
      brushCompleted,
      buyItem,
      grantItem,
      equipItem,
      unequipCategory,
      toggleDecor,
    }),
    [ready, player, catalog, setName, setEmotion, selectBelt, brushCompleted, buyItem, grantItem, equipItem, unequipCategory, toggleDecor]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
