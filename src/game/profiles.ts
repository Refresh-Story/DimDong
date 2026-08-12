import { DEFAULT_PLAYER, PlayerState, setName } from '@/game/economy';

export const MAX_PROFILES = 5;

export type ProfileRecord = { id: string; createdAt: number; player: PlayerState };
export type ProfilesState = { version: 1; profiles: ProfileRecord[] };

export const EMPTY_PROFILES: ProfilesState = { version: 1, profiles: [] };

// Impure (horloge + aléa) : appelée uniquement par le contexte, jamais dans les réducteurs.
export function newProfileId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function canCreateProfile(s: ProfilesState): boolean {
  return s.profiles.length < MAX_PROFILES;
}

// null si la limite est atteinte ou si le nom est vide : la création exige un vrai nom.
export function addProfile(s: ProfilesState, id: string, name: string, createdAt: number): ProfilesState | null {
  if (!canCreateProfile(s)) return null;
  if (!name.trim()) return null;
  const player = setName(DEFAULT_PLAYER, name);
  return { ...s, profiles: [...s.profiles, { id, createdAt, player }] };
}

export function removeProfile(s: ProfilesState, id: string): ProfilesState {
  if (!s.profiles.some((r) => r.id === id)) return s;
  return { ...s, profiles: s.profiles.filter((r) => r.id !== id) };
}

export function updateProfile(s: ProfilesState, id: string, player: PlayerState): ProfilesState {
  if (!s.profiles.some((r) => r.id === id)) return s;
  return { ...s, profiles: s.profiles.map((r) => (r.id === id ? { ...r, player } : r)) };
}

export function getProfile(s: ProfilesState, id: string | null): ProfileRecord | undefined {
  return id === null ? undefined : s.profiles.find((r) => r.id === id);
}

// Migration one-shot de l'ancien joueur unique ('dimdong.player') vers le premier profil.
export function migrateLegacyPlayer(player: PlayerState, id: string, createdAt: number): ProfilesState {
  return { version: 1, profiles: [{ id, createdAt, player }] };
}
