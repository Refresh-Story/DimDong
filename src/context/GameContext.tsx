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
import { BELTS, SENSEI_BELT, dayKey, levelFromXp, levelProgress } from '@/game/rules';
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
import {
  EMPTY_PROFILES,
  ProfileRecord,
  ProfilesState,
  addProfile,
  getProfile,
  migrateLegacyPlayer,
  newProfileId,
  removeProfile,
  updateProfile,
} from '@/game/profiles';

export type { BrushResult, PlayerState } from '@/game/economy';
export type { ProfileRecord } from '@/game/profiles';

const PROFILES_KEY = 'dimdong.profiles';
// Ancien joueur unique, migré comme premier profil au démarrage.
const LEGACY_PLAYER_KEY = 'dimdong.player';
// Ancien cache du catalogue distant (Firebase) ; purgé au démarrage.
const LEGACY_CATALOG_KEY = 'dimdong.catalog';

type GameContextValue = {
  ready: boolean;
  player: PlayerState;
  catalog: Item[];
  level: number;
  progress: number;
  profiles: ProfileRecord[];
  activeProfileId: string | null;
  createProfile: (name: string) => Promise<string | null>;
  selectProfile: (id: string) => Promise<void>;
  clearActiveProfile: () => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
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
    selectedBelt: [...BELTS, SENSEI_BELT].some((b) => b.label === data?.selectedBelt)
      ? data.selectedBelt
      : null,
  };
}

function sanitizeProfiles(data: any): ProfilesState {
  const records = Array.isArray(data?.profiles) ? data.profiles : [];
  return {
    version: 1,
    profiles: records
      .filter((r: any) => typeof r?.id === 'string' && r.id.length > 0)
      .map((r: any) => ({
        id: r.id,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0,
        player: sanitize(r.player),
      })),
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [profilesState, setProfilesState] = useState<ProfilesState>(EMPTY_PROFILES);
  // Jamais persisté : à chaque lancement, l'écran de sélection s'affiche.
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const catalog: Item[] = FALLBACK_CATALOG;
  const [ready, setReady] = useState(false);

  const profilesRef = useRef<ProfilesState>(EMPTY_PROFILES);
  const activeIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILES_KEY);
        if (raw) {
          const s = sanitizeProfiles(JSON.parse(raw));
          profilesRef.current = s;
          setProfilesState(s);
        } else {
          // Migration de l'ancien joueur unique vers le premier profil.
          const legacyRaw = await AsyncStorage.getItem(LEGACY_PLAYER_KEY);
          const legacy = legacyRaw ? sanitize(JSON.parse(legacyRaw)) : null;
          if (legacy?.onboarded) {
            const s = migrateLegacyPlayer(legacy, newProfileId(), Date.now());
            await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(s));
            await AsyncStorage.removeItem(LEGACY_PLAYER_KEY);
            profilesRef.current = s;
            setProfilesState(s);
          }
        }
      } catch (e) {
        console.warn('Lecture des profils locaux échouée', e);
      } finally {
        setReady(true);
      }
      AsyncStorage.removeItem(LEGACY_CATALOG_KEY).catch(() => {});
    })();
  }, []);

  // Débounce : le timer lit profilesRef au moment du tir, jamais un snapshot.
  const persist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profilesRef.current)).catch((e) =>
        console.warn('Sauvegarde locale échouée', e)
      );
    }, 300);
  }, []);

  const persistNow = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profilesRef.current)).catch((e) =>
      console.warn('Sauvegarde locale échouée', e)
    );
  }, []);

  const flush = useCallback(() => {
    if (!saveTimer.current) return;
    persistNow();
  }, [persistNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const currentPlayer = useCallback(
    () => getProfile(profilesRef.current, activeIdRef.current)?.player ?? DEFAULT_PLAYER,
    []
  );

  const commit = useCallback(
    (next: PlayerState) => {
      const id = activeIdRef.current;
      if (!id) return; // Aucun profil actif (deep link) : aucune écriture.
      const s = updateProfile(profilesRef.current, id, next);
      profilesRef.current = s;
      setProfilesState(s);
      persist();
    },
    [persist]
  );

  const createProfile = useCallback(
    async (name: string): Promise<string | null> => {
      const id = newProfileId();
      const s = addProfile(profilesRef.current, id, name, Date.now());
      if (!s) return null;
      profilesRef.current = s;
      setProfilesState(s);
      activeIdRef.current = id;
      setActiveProfileId(id);
      await persistNow();
      return id;
    },
    [persistNow]
  );

  const selectProfile = useCallback(
    async (id: string) => {
      if (!getProfile(profilesRef.current, id)) return;
      await persistNow();
      activeIdRef.current = id;
      setActiveProfileId(id);
    },
    [persistNow]
  );

  // Retour au sélecteur sans quitter l'app : index.tsx redirige dès que l'id est null.
  const clearActiveProfile = useCallback(async () => {
    if (!activeIdRef.current) return;
    await persistNow();
    activeIdRef.current = null;
    setActiveProfileId(null);
  }, [persistNow]);

  const deleteProfile = useCallback(
    async (id: string) => {
      const s = removeProfile(profilesRef.current, id);
      profilesRef.current = s;
      setProfilesState(s);
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
        setActiveProfileId(null);
      }
      await persistNow();
    },
    [persistNow]
  );

  const setName = useCallback(
    async (name: string) => {
      commit(setNameOp(currentPlayer(), name));
    },
    [commit, currentPlayer]
  );

  const setEmotion = useCallback(
    async (emotion: Emotion) => {
      commit(setEmotionOp(currentPlayer(), emotion));
    },
    [commit, currentPlayer]
  );

  const selectBelt = useCallback(
    async (label: string | null) => {
      commit(selectBeltOp(currentPlayer(), label));
    },
    [commit, currentPlayer]
  );

  const brushCompleted = useCallback(async (): Promise<BrushResult> => {
    const { player, result } = brushOp(currentPlayer(), dayKey(new Date()));
    commit(player);
    return result;
  }, [commit, currentPlayer]);

  const buyItem = useCallback(
    async (item: Item): Promise<BuyStatus> => {
      const { player, status } = buyOp(currentPlayer(), item);
      if (status === 'ok') commit(player);
      return status;
    },
    [commit, currentPlayer]
  );

  const grantItem = useCallback(
    async (item: Item) => {
      commit(grantOp(currentPlayer(), item));
    },
    [commit, currentPlayer]
  );

  const equipItem = useCallback(
    async (item: Item) => {
      commit(equipOp(currentPlayer(), item));
    },
    [commit, currentPlayer]
  );

  const unequipCategory = useCallback(
    async (category: ItemCategory) => {
      commit(unequipOp(currentPlayer(), category));
    },
    [commit, currentPlayer]
  );

  const toggleDecor = useCallback(
    async (item: Item) => {
      commit(toggleDecorOp(currentPlayer(), item));
    },
    [commit, currentPlayer]
  );

  const player = getProfile(profilesState, activeProfileId)?.player ?? DEFAULT_PLAYER;

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      player,
      catalog,
      level: levelFromXp(player.xp),
      progress: levelProgress(player.xp),
      profiles: profilesState.profiles,
      activeProfileId,
      createProfile,
      selectProfile,
      clearActiveProfile,
      deleteProfile,
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
    [ready, player, catalog, profilesState, activeProfileId, createProfile, selectProfile, clearActiveProfile, deleteProfile, setName, setEmotion, selectBelt, brushCompleted, buyItem, grantItem, equipItem, unequipCategory, toggleDecor]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
