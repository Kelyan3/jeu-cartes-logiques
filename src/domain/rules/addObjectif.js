import { copyGameArray } from "../gameSolver";

/**
 * Variante "=> dans objectif" : la carte sélectionnée (dans le deck objectif, liaison
 * "=>") devient un objectif secondaire : sa partie droite reste dans l'objectif, sa
 * partie gauche est déposée dans un nouveau deck LPU intermédiaire à compléter.
 */
function addObjectifDepuisObjectif(deckI, cardI, deps)
{
	const {
		game, mode, numero, tabObjectif,
		setTabObjectif, setIndentationDemonstration, setSavedGame, setMessageTutorial,
		saveGame, addToGame, addLineDemonstration, allFalse,
	} = deps;

	// Copie du jeu actuel
	let tmp = copyGameArray(game);

	// Sauvegarde du jeu actuel
	saveGame();

	// Message en mode tutoriel
	if (mode === "Tutorial" && numero === 3)
	{
		setMessageTutorial([
			"Vous devez maintenant compléter l’objectif secondaire.",
			"Si vous complétez l’objectif secondaire cela créera la carte d’où il a été créé dans deck avant, dans notre cas dans le deck départ cela complétera l’objectif principal.",
		]);
	}

	// Copie de la partie droite de la carte sélectionnée
	let secondObjectif = game[deckI][cardI].right.copy();

	// Rajoute le second objectif dans le deck objectif
	if (!addToGame(tmp, tmp.length - 1, secondObjectif))
		return;

	// Copie de la partie gauche de la carte sélectionnée
	let tmpCard = tmp[deckI][cardI].left.copy();

	// Rajoute le deck intermediaire
	tmp.splice(tmp.length - 1, 0, []);

	// Ajoute cette partie dans le deck qui vient d'etre créer
	addToGame(tmp, tmp.length - 2, tmpCard);

	// Copie du tableau objectif
	let tmpObj = [...tabObjectif];

	// Ajoute l'objectif secondaire dans le tableau objectif
	tmpObj.push([tabObjectif.length, tmp[tmp.length - 1].length - 1, true,]);

	// Met à jour le tableau objectif
	setTabObjectif(tmpObj);
	addLineDemonstration([["Supposons ", tmpCard.copy(), ". Montrons ", secondObjectif.copy(), ".",], ], [0]);
	setIndentationDemonstration((prev) => prev + 1);

	// Met à jour le jeu & désélectionne toutes les cartes
	allFalse(tmp);
	setSavedGame(tmp);
}

/**
 * Variante "=> dans LPU" : la carte sélectionnée (dans une LPU, liaison "=>", partie
 * gauche elle-même munie d'une liaison "=>") a sa partie gauche déposée directement
 * dans le deck objectif. Ce n'est pas considéré comme un objectif secondaire.
 */
function addObjectifDepuisLPU(deckI, cardI, deps)
{
	const { game, setSavedGame, saveGame, addToGame, addLineDemonstration, allFalse } = deps;

	// Copie du jeu actuel
	let tmp = copyGameArray(game);

	// Sauvegarde du jeu actuel
	saveGame();

	// Copie de la partie gauche de la carte sélectionnée
	let secondObjectif = tmp[deckI][cardI].left.copy();

	// Met la carte copiée dans le deck objectif (ce n'est pas un objectif secondaire)
	if (!addToGame(tmp, tmp.length - 1, secondObjectif))
		return;

	addLineDemonstration([["Montrons ", secondObjectif.copy(), ".", ], ], [0]);

	// Met à jour le jeu & désélectionne toutes les cartes
	allFalse(tmp);
	setSavedGame(tmp);
}

/**
 * Variante "et" : la carte sélectionnée (dans le deck objectif, carte "et") a chacune
 * de ses deux parties ajoutée comme nouvel objectif à démontrer, pour celles qui ont
 * elles-mêmes une liaison "=>".
 */
function addObjectifEt(deckI, cardI, deps)
{
	const { game, setSavedGame, saveGame, addToGame, addLineDemonstration, allFalse } = deps;

	let tmp = copyGameArray(game);

	// Sauvegarde du jeu actuel
	saveGame();

	// Copie de les deux parties de la carte sélectionnée
	let secondObjectif1 = game[deckI][cardI].left.copy();
	let secondObjectif2 = game[deckI][cardI].right.copy();
	let firstArrayDemo = [];
	let secondArrayDemo = [];
	if (secondObjectif1.haveImpliqueLinkRecur())
	{
		if (addToGame(tmp, tmp.length - 1, secondObjectif1, false))
			firstArrayDemo = ["Montrons ", secondObjectif1.copy(), ". ",];
	}

	if (secondObjectif2.haveImpliqueLinkRecur())
	{
		if (addToGame(tmp, tmp.length - 1, secondObjectif2, false))
			secondArrayDemo = ["Montrons ", secondObjectif2.copy(), ".",];
	}

	addLineDemonstration([firstArrayDemo.concat(secondArrayDemo)], [0]);

	// Met à jour le jeu & désélectionne toutes les cartes
	allFalse(tmp);
	setSavedGame(tmp);
}

/**
 * Fonction appelée après avoir choisi une des 3 options du menu "+ Objectif".
 *
 * @param {"objectif"|"lpu"|"et"} variant - la sous-fonctionnalité choisie :
 *   "objectif" : la carte sélectionnée doit être dans le deck objectif, liaison "=>".
 *   "lpu"      : la carte sélectionnée doit être dans une LPU, liaison "=>" et partie
 *                gauche elle-même munie d'une liaison "=>".
 *   "et"       : la carte sélectionnée doit être dans le deck objectif, carte "et".
 *
 * Une seule & unique carte doit être sélectionnée, sinon un popup d'erreur apparaît.
 * Si la carte sélectionnée ne correspond pas à la variante choisie, un message
 * d'erreur spécifique à cette variante est affiché plutôt qu'un message générique.
 *
 * @param {Object} deps - regroupe toutes les dépendances nécessaires (état + callbacks)
 *                        du composant Game (voir chaque sous-fonction pour le détail).
 */
export function runAddObjectif(variant, deps)
{
	const { game, navigation, win, error, deckContain, getSingleSelectedCard } = deps;

	if (navigation || win)
		return;

	const selection = getSingleSelectedCard();
	if (selection === null)
		return;

	const [deckI, cardI] = selection;
	const isObjectifDeck = deckI === game.length - 1;

	// Si le 1er sous-objectif choisi n'est pas créé à partir de l'objectif principal
	if (!isObjectifDeck && game.length <= 2)
	{
		error("Le premier objectif secondaire doit être créé à l'aide de l'objectif principal !");
		return;
	}

	// Si le sous-objectif existe déjà
	if (deckContain(deckI, cardI))
	{
		error("Cet objectif existe déjà !");
		return;
	}

	const card = game[deckI][cardI];

	if (variant === "objectif")
	{
		if (!isObjectifDeck)
			error("Ce bouton ne fonctionne que sur une carte de l'objectif !");
		else if (card.link !== "=>")
			error('L\'objectif secondaire doit avoir une liaison "=>" !');
		else
			addObjectifDepuisObjectif(deckI, cardI, deps);
	}
	else if (variant === "lpu")
	{
		if (isObjectifDeck)
			error("Ce bouton ne fonctionne que sur une carte de la LPU !");
		else if (card.link !== "=>")
			error('L\'objectif secondaire doit avoir une liaison "=>" !');
		else if (!card.left.haveImpliqueLinkRecur())
			error('La partie gauche de l\'objectif secondaire doit avoir une liaison "=>" !');
		else
			addObjectifDepuisLPU(deckI, cardI, deps);
	}
	else if (variant === "et")
	{
		if (!isObjectifDeck)
			error("Ce bouton ne fonctionne que sur une carte de l'objectif !");
		else if (!card.isCardEtObjectif())
			error('La carte sélectionnée doit être une carte "et" contenant au moins une liaison "=>" !');
		else
			addObjectifEt(deckI, cardI, deps);
	}
}