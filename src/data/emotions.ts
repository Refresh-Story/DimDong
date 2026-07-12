import { Emotion } from '@/art/dimArt';

export const EMOTIONS: { id: Emotion; label: string }[] = [
  { id: 'joy', label: 'Joie' },
  { id: 'sad', label: 'Tristesse' },
  { id: 'angry', label: 'Colère' },
  { id: 'serene', label: 'Sérénité' },
  { id: 'scared', label: 'Peur' },
];

export function isEmotion(v: unknown): v is Emotion {
  return typeof v === 'string' && EMOTIONS.some((e) => e.id === v);
}
