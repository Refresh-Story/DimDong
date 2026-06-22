// Firebase natif (@react-native-firebase) — projet "dim-dong".
// Le SDK s'initialise automatiquement depuis GoogleService-Info.plist (iOS) ;
// aucune config JS à fournir. On n'utilise QUE Firestore, en LECTURE SEULE, pour
// le catalogue partagé. Pas d'auth : les données joueur sont locales à l'iPhone.
import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

export const db = getFirestore(getApp());
