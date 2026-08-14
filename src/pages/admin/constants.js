export const MENUS = ["base", "objectif", "transitivite", "tiers_exclus"];

export const SECTIONS = [
	{ id: "feedback", label: "Avis reçus" },
	{ id: "categories", label: "Catégories" },
	{ id: "chapters", label: "Chapitres" },
	{ id: "scoring", label: "Gestion du score" },
	{ id: "levels", label: "Niveaux" },
	{ id: "quests", label: "Quêtes" },
];

export const SCORING_FIELDS = [
	{ key: "score_max", label: "Score max" },
	{ key: "score_min", label: "Score min" },
	{ key: "time_grace_s", label: "Délai de grâce (s)" },
	{ key: "time_interval_s", label: "Palier temps (s)" },
	{ key: "time_penalty", label: "Pénalité / palier temps" },
	{ key: "moves_threshold", label: "Seuil de coups" },
	{ key: "moves_rate", label: "Pénalité / coup" },
];

export const DEVICE_LABELS = {
	ordinateur: "Ordinateur",
	mobile: "Smartphone / Tablette",
	autre: "Autre",
};

export const RATING_LABELS = [
	"Pas du tout d'accord",
	"Pas d'accord",
	"Moyen",
	"D'accord",
	"Totalement d'accord",
];