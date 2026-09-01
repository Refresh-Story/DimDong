import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { FLOOR_RATIO, sceneGeom, type SceneGeom } from '@/art/sceneGeom';

/**
 * Géométrie de la scène courante.
 *
 * `useWindowDimensions` et non un `Dimensions.get` figé au chargement du module : la scène
 * suit désormais la rotation, le split view et tout redimensionnement.
 * `override` permet à la modale d'aperçu de rendre la scène à la taille réelle de sa carte
 * plutôt que de la dessiner en plein écran pour la réduire ensuite.
 * `topReserve` est la hauteur cédée au HUD : le ciel démarre sous lui au lieu d'être recouvert.
 * Une géométrie imposée gagne : elle décrit déjà sa boîte, `topReserve` ne s'y applique pas.
 */
export function useSceneLayout(override?: SceneGeom, topReserve = 0): SceneGeom {
  const { width, height } = useWindowDimensions();
  return useMemo(
    () => override ?? sceneGeom(width, height, FLOOR_RATIO, topReserve),
    [override, width, height, topReserve]
  );
}
