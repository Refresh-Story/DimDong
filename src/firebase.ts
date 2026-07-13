import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

let instance: ReturnType<typeof getFirestore> | null = null;

// Initialisation paresseuse : sur web il n'y a pas d'app Firebase native,
// l'appelant doit gérer l'échec (le fetch catalogue a déjà son try/catch).
export function getDb() {
  if (!instance) instance = getFirestore(getApp());
  return instance;
}
