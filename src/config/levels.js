/**
 * Replis utilisés tant que public/json/manifest.json n'est pas chargé
 * (ou en cas d'échec réseau).
 */
export const DEFAULT_LEVEL_COUNTS = {
	Play: 50,
	Tutorial: 7,
};

/**
 * Catégories d'affichage du mode Tutorial uniquement.
 * Format : [premierNiveau, dernierNiveau, libellé].
 * Le dernierNiveau est étendu dynamiquement si le manifeste annonce plus de niveaux que prévu (voir Choice.jsx).
 */
export const TUTORIAL_DIFFICULTY = [
	[1, DEFAULT_LEVEL_COUNTS.Tutorial, "Tutoriels"],
];