import { Emotion } from '@/art/dimArt';

export const EMOTIONS: { id: Emotion; label: string; emoji: string }[] = [
  { id: 'joy', label: 'Joie', emoji: '😄' },
  { id: 'sad', label: 'Tristesse', emoji: '😢' },
  { id: 'angry', label: 'Colère', emoji: '😠' },
  { id: 'serene', label: 'Sérénité', emoji: '😌' },
  { id: 'scared', label: 'Peur', emoji: '😱' },
];

export function isEmotion(v: unknown): v is Emotion {
  return typeof v === 'string' && EMOTIONS.some((e) => e.id === v);
}
