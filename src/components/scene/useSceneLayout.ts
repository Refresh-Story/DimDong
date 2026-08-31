import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { sceneGeom, type SceneGeom } from '@/art/sceneGeom';

/**
 * Géométrie de la scène courante.
 *
 * `useWindowDimensions` et non un `Dimensions.get` figé au chargement du module : la scène
 * suit désormais la rotation, le split view et tout redimensionnement.
 * `override` permet à la modale d'aperçu de rendre la scène à la taille réelle de sa carte
 * plutôt que de la dessiner en plein écran pour la réduire ensuite.
 */
export function useSceneLayout(override?: SceneGeom): SceneGeom {
  const { width, height } = useWindowDimensions();
  return useMemo(() => override ?? sceneGeom(width, height), [override, width, height]);
}
