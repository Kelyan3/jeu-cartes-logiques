import Card from "../domain/Card";


/**
 * Transforme un objet JSON en instance {@link Card}.
 *
 * @param {JSON} obj - information mimimum pour créer une carte :
 *                     Carte simple = juste la couleur ;
 *                     Carte complexe = les 2 cartes qui la compose & la liaison
 * @param {number} i - numéro de l'id
 *
 * @returns {Card} une carte
 */
export const toClass = (obj, i) => {
	// Si c'est une carte complexe
	if (obj.color === undefined)
		return new Card(i, null, false, obj.link, toClass(obj.left, 0), toClass(obj.right, 1), true, false );

    // Si c'est une carte simple
	return new Card(i, obj.color, false, "", null, null, true, false);
};

/**
 * Reçoit un tableau d'un fichier JSON à qui on va appliquer la méthode {@link JSON.parse()} dans {@link openFile()}
 * ({@link JSON} ⇒ tableau d'{@link Object}) et renvoie un tableau qui peut être lu par notre site.
 *
 * @param {Object[]} data - tableau d'objets qui va servir pour l'initialisation
 *
 * @returns {Card[][]} un tableau de decks qui constitue le jeu
 */
export const gameInput = (data) => {
	let result = [[], []];

	// Création du deck de départ
	let i = 0;
	data[0].forEach((element) => {
		result[0].push(toClass(element, i));
		i++;
	});

    // Création du deck objectif
	i = 0;
	data[1].forEach((element) => {
		result[1].push(toClass(element, i));
		i++;
	});

	// Retourne le tableau du jeu
	return result;
};

/**
 * Compteur global utilisé pour attribuer un identifiant stable
 * à chaque nouveau tableau "deck" (colonne), au moment de sa création.
 */
let deckIdCounter = 0;

/**
 * Attribue un id stable (non énumérable, donc invisible dans les boucles
 * `for...in`/`Object.keys`/`JSON.stringify`) à chaque deck du tableau de jeu
 * reçu qui n'en a pas encore un.
 *
 * @param {Card[][]} game
 *
 * @returns {Card[][]} le même tableau (pour un usage en chaîne avec setGame)
 */
export function ensureDeckIds(game)
{
	game.forEach((deck) => {
		if (deck.__deckId === undefined)
		{
			deckIdCounter += 1;
			Object.defineProperty(deck, "__deckId", {
				value: "deck-" + deckIdCounter,
				enumerable: false,
			});
		}
	});

	return game;
}

/**
 * Calcule l'état de jeu initial (deck de départ + objectif, et première ligne de
 * démonstration) à partir des données JSON d'un exercice.
 *
 * @param {Object|undefined} ex - données JSON de l'exercice (undefined tant que non chargé)
 * @param {"Play"|"Tutorial"|"Create"} mode
 *
 * @returns {{game: Card[][], demonstration: Array}}
 */
export function buildInitialGameSetup(ex, mode)
{
	if (mode === "Create")
		return { game: ensureDeckIds([[], []]), demonstration: [] };

	if (ex === undefined)
		return { game: ensureDeckIds([[]]), demonstration: [] };

	try
	{
		const tmp = gameInput(ex);
		let res = [];
		tmp[0].forEach((element) => {
			res.push("On a ");
			res.push(element.copy());
			res.push(". ");
		});

		if (tmp.length === 2 && tmp[1].length > 0)
		{
			res.push("Montrons ");
			res.push(tmp[1][0].copy());
			res.push(".");
		}

		/**
		 * Équivalent à addLineDemonstration([res], [0], 0, true) : voir la fonction
		 * addLineDemonstration pour le détail du format [indentation, message].
		 */
		return { game: ensureDeckIds(tmp), demonstration: [[0, res]] };
	}
	catch (error)
	{
		console.error("Erreur lors du chargement de l'exercice :", error);
		return { game: ensureDeckIds([[]]), demonstration: [] };
	}
}

/**
 * Renvoie le message tutoriel à afficher au chargement d'un niveau, selon son numéro
 * (indépendant du mode, comme dans le comportement d'origine).
 *
 * @param {number} numero
 *
 * @returns {string|string[]} "" si aucun message n'est associé à ce numéro.
 */
export function buildInitialTutorialMessage(numero)
{
	switch (numero)
	{
		case 0:
			return [
				"Le but du jeu est de réussir à créer la carte qui est dans l'objectif dans le premier deck.",
				"Vous pouvez sélectionner une carte en cliquant dessus.",
			];

		case 1:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Implique".',
				"Ce bouton a besoin de deux cartes pour fonctionner.",
				"Sélectionnez deux cartes.",
			];

		case 2:
			return [
				'Dans ce niveau nous allons apprendre le quatrième bouton "Fusion".',
				"Ce bouton a besoin de deux cartes pour fonctionner.",
				"Sélectionnez deux cartes.",
			];

		case 3:
			return [
				'Dans ce niveau nous allons apprendre le bouton "+ Objectif".',
				"Pour faire fonctionner ce bouton on doit sélectionner l'objectif.",
			];

		case 4:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Transitivité" avec le connecteur "⟹", le bouton "Affichage Simplifié", ainsi que le fonctionnement de la carte blanche.',
				'Cliquer sur le bouton "Affichage Simplifié" pour faire apparaître la carte blanche. Lorsqu’on l’obtient, la partie est gagnée qu’importe l’objectif.',
				'Ensuite, le bouton "Transitivité" a besoin de deux cartes avec un connecteur "⟹" pour fonctionner. Il faut que ces cartes soient de la même forme que dans le symbole du bouton.',
				'On obtient alors une carte avec le connecteur "⟹".',
				"Sélectionnez deux cartes.",
			];

		case 5:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Transitivité" avec le connecteur "⟺".',
				'Il fonctionne de la même manière qu’avec le connecteur "⟹", il faut que les cartes sélectionnées soient de la même forme que dans le symbole du bouton.',
				'On obtient alors une carte avec le connecteur "⟺".',
				"Sélectionnez deux cartes.",
			];

		case 6:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Tiers Exclus".',
				'Il fonctionne avec une carte "¬(¬Rouge)" par exemple, qui est équivalente à la carte "Rouge ou Blanche", pour obtenir la carte "Rouge".',
				"Sélectionner une carte.",
			];

		default:
			return "";
	}
}

/**
 * Calcule le message tutoriel à afficher après une sélection de carte, selon le niveau
 * en cours et l'état de la sélection. Fonction pure : ne modifie rien, se contente de
 * décrire *quel* message afficher (ou aucun).
 *
 * @param {number} numero - numéro du niveau tutoriel en cours
 * @param {number} selectedCardCount - nombre de cartes actuellement sélectionnées
 * @param {number} firstSelectedDeckIndex
 * @param {number} secondSelectedDeckIndex
 * @param {number} gameLength - nombre de decks dans le jeu (game.length)
 *
 * @returns {string[]|null} le nouveau message tutoriel, ou null si rien ne doit changer.
 */
export function buildSelectionTutorialMessage(numero, selectedCardCount, firstSelectedDeckIndex, secondSelectedDeckIndex, gameLength)
{
	if (numero === 0)
	{
		return [
			"Une fois une carte sélectionnée elle aura un contour noir et une surbrillance jaune.",
			"Vous pouvez utiliser les boutons au-dessus pour effectuer une action.",
			'Dans ce niveau nous allons apprendre le fonctionnement du bouton "Séparation".',
			"Ce bouton a besoin de deux conditions :",
			"- Une seule carte doit être sélectionnée ;",
			'- La carte doit avoir une liaison "et".',
			"Quand les conditions sont validées la partie gauche et droite de la carte sont ajoutées au deck.",
		];
	}

	if (selectedCardCount === 2 && numero === 1)
	{
		return [
			"Ce bouton a besoin de trois conditions :",
			"- Avoir deux cartes sélectionnées",
			'- Une des deux cartes doit avoir une liaison "=>"',
			'- La partie gauche de la carte avec la liaison "=>" doit être identique à l’autre carte',
			'Quand les conditions sont validées la partie droite de la carte avec la liaison "=>" est créée dans le deck.',
		];
	}

	if (selectedCardCount === 2 && numero === 2)
	{
		return [
			"Ce bouton a besoin de deux conditions :",
			"- Avoir deux cartes sélectionnées ;",
			"- Les deux cartes sélectionnées doivent comporter une ou deux cartes.",
			'Quand les conditions sont validées une nouvelle carte est créée avec les deux autres cartes sélectionnées et cette carte aura une liaison "et"',
		];
	}

	if (selectedCardCount === 1 && numero === 3 && Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex) === gameLength - 1)
	{
		return [
			"Ce bouton a besoin de deux conditions :",
			"- Une seule carte doit être sélectionnée ;",
			"- La carte sélectionnée doit être dans le deck des objectifs.",
			'La carte sélectionnée doit avoir une liaison "=>"',
			"Quand les conditions sont validées un objectif secondaire est créée, l’objectif secondaire est la partie droite de la carte sélectionnée, un deck est créée avec la carte qui est à gauche de la carte sélectionnée.",
		];
	}

	return null;
}