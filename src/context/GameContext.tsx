// État global de Dim-Dong.
//
// Données JOUEUR : 100 % LOCALES à l'iPhone (AsyncStorage), pas d'auth, pas de cloud.
// Source de vérité = l'état en mémoire (playerRef) ; persistance débouncée en local.
//
// CATALOGUE (partagé) : lu en LECTURE SEULE depuis Firestore (@react-native-firebase),
// puis mis en cache local pour l'offline. Au démarrage on affiche le cache (instantané),
// puis on rafraîchit depuis Firestore si le réseau répond.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from '@react-native-firebase/firestore';
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

import { db } from '@/firebase';
import { FALLBACK_CATALOG, Item, ItemCategory, KIMONO_ID, mergeCatalog } from '@/data/items';
import { dayKey, levelFromXp, levelProgress } from '@/game/rules';
import {
  BrushResult,
  BuyStatus,
  DEFAULT_PLAYER,
  PlayerState,
  brush as brushOp,
  buy as buyOp,
  equip as equipOp,
  grant as grantOp,
  setName as setNameOp,
  toggleDecor as toggleDecorOp,
  unequip as unequipOp,
} from '@/game/economy';

export type { BrushResult, PlayerState } from '@/game/economy';

const PLAYER_KEY = 'dimdong.player';
const CATALOG_KEY = 'dimdong.catalog';

type GameContextValue = {
  ready: boolean;
  player: PlayerState;
  catalog: Item[];
  level: number;
  progress: number;
  setName: (name: string) => Promise<void>;
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
    // le kimono de judo est offert d'office, même aux joueurs déjà sauvegardés
    ownedItems: Array.from(new Set([KIMONO_ID, ...(data?.ownedItems ?? [])])),
    placedDecor: data?.placedDecor ?? [],
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(DEFAULT_PLAYER);
  const [catalog, setCatalog] = useState<Item[]>(FALLBACK_CATALOG);
  const [ready, setReady] = useState(false);

  // Source de vérité synchrone (évite les closures périmées en cas d'actions rapides).
  const playerRef = useRef<PlayerState>(DEFAULT_PLAYER);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Charger l'état joueur depuis le stockage local.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLAYER_KEY);
        if (raw) {
          const p = sanitize(JSON.parse(raw));
          playerRef.current = p;
          setPlayer(p);
        }
      } catch (e) {
        console.warn('Lecture du joueur local échouée', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 2) Catalogue : cache local immédiat, puis rafraîchissement Firestore (lecture seule).
  useEffect(() => {
    (async () => {
      // Le catalogue distant est toujours FUSIONNÉ avec le catalogue embarqué
      // (mergeCatalog) : un Firestore plus ancien que l'app ne doit pas masquer les
      // nouveaux objets embarqués (ex. décors de fond). On met en cache la version
      // brute Firestore, pour que le merge suive les évolutions du fallback.
      try {
        const cached = await AsyncStorage.getItem(CATALOG_KEY);
        if (cached) setCatalog(mergeCatalog(JSON.parse(cached) as Item[]));
      } catch {
        // pas de cache : on garde FALLBACK_CATALOG
      }
      try {
        const snap = await getDocs(collection(db, 'catalog'));
        if (!snap.empty) {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Item[];
          setCatalog(mergeCatalog(items));
          AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(items)).catch(() => {});
        }
      } catch {
        // hors-ligne : on garde le cache (ou le fallback)
      }
    })();
  }, []);

  // Persistance locale débouncée (évite d'écrire à chaque micro-action).
  const persist = useCallback((p: PlayerState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(p)).catch((e) =>
        console.warn('Sauvegarde locale échouée', e)
      );
    }, 300);
  }, []);

  // Force l'écriture en attente immédiatement (sans attendre le debounce).
  // Indispensable avant que l'OS ne suspende l'app : sinon les gemmes gagnées
  // juste avant de fermer/verrouiller l'app sont perdues.
  const flush = useCallback(() => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(playerRef.current)).catch((e) =>
      console.warn('Sauvegarde locale échouée', e)
    );
  }, []);

  // Dès que l'app passe en arrière-plan/inactif, on flush la sauvegarde en attente.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  // Mise à jour optimiste + persistance locale.
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
      brushCompleted,
      buyItem,
      grantItem,
      equipItem,
      unequipCategory,
      toggleDecor,
    }),
    [ready, player, catalog, setName, brushCompleted, buyItem, grantItem, equipItem, unequipCategory, toggleDecor]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
