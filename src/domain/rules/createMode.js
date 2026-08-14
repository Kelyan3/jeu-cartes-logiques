import Card from "../Card";


/**
 * Mode Création : ajoute une carte simple de la couleur choisie dans le popup
 * "Choisir une couleur", au deck indiqué par `indiceDeckAddCard`.
 *
 * ⚠️ Ne doit être appelée qu'en mode Create (ou pour des tests).
 *
 * @param {Event} event - reçoit la couleur cliquée (event.target.value) ; on remet
 *                        `checked` à false pour pouvoir choisir plusieurs fois la même couleur.
 * @param {Object} deps
 * @param {Card[][]} deps.game
 * @param {number} deps.indiceDeckAddCard
 * @param {Function} deps.saveGame
 * @param {Function} deps.addToGame
 * @param {Function} deps.allFalse
 */
export function runChoixCouleur(event, deps)
{
	const { game, indiceDeckAddCard, saveGame, addToGame, allFalse } = deps;

	// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
	saveGame();

	// Copie du jeu actuel
	let tmp = [...game];

	// Dé-check le bouton radio
	event.target.checked = false;

	// Ajoute la carte dans le deck (indiceDeckAddCard est affecté avant de rentrer dans la fonction)
	let cardToAdd = new Card(game[indiceDeckAddCard].length, event.target.value, false, "", null, null, true, false);
	if (!addToGame(tmp, indiceDeckAddCard, cardToAdd))
		return;

	// Actualise le jeu et désélectionne tout
	allFalse(tmp);
}

/**
 * Mode Création : crée une carte complexe à partir des 2 cartes sélectionnées et de
 * la liaison choisie dans le popup "Choisir une liaison".
 *
 * ⚠️ Ne doit être appelée qu'en mode Create (ou pour des tests).
 *
 * @param {Event} event - reçoit la liaison cliquée (event.target.value)
 * @param {Object} deps
 * @param {Card[][]} deps.game
 * @param {number} deps.selecDeck1
 * @param {number} deps.selecCard1
 * @param {number} deps.selecDeck2
 * @param {number} deps.selecCard2
 * @param {Function} deps.setPopupFusion
 * @param {Function} deps.saveGame
 * @param {Function} deps.addToGame
 * @param {Function} deps.allFalse
 */
export function runChoixLiaison(event, deps)
{
	const { game, selecDeck1, selecCard1, selecDeck2, selecCard2, setPopupFusion, saveGame, addToGame, allFalse } = deps;

	// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
	saveGame();

	// Copie du jeu actuel
	let tmp = [...game];

	// Dé-check le bouton radio
	event.target.checked = false;

	// Liaison reçu avec le bouton radio
	const l = event.target.value;

	// Copie les 2 cartes séléctionnées
	let c1 = game[selecDeck1][selecCard1].copy();
	let c2 = game[selecDeck2][selecCard2].copy();
	c1.id = 0;
	c2.id = 1;

	let cardToAdd;
	if (l === "<=>")
	{
		cardToAdd = new Card(
			game[selecDeck1].length, // id
			null, // color
			false, // active
			"et", // link
			new Card(0, null, false, "=>", c1.copy(), c2.copy()), // left
			new Card(0, null, false, "=>", c2.copy(), c1.copy()), // right
			true,
			false
		);
	}
	else if (l === "ou")
	{
		cardToAdd = new Card(
			game[selecDeck1].length, // id
			null, // color
			false, // active
			"=>", // link
			new Card(
				c1.id,
				null,
				false,
				"=>",
				c1,
				new Card(1, "white", false, null, null, null, true, false)
			), // left
			c2, // right
			true,
			false
		);
	}
	else
	{
		// Ajoute la carte fusionnée dans le deck de la 1ère carte séléctionnée
		cardToAdd = new Card(
			game[selecDeck1].length, // id
			null, // color
			false, // active
			l, // link
			c1, // left
			c2, // right
			true,
			false
		);
	}

	// Enlève le popup
	setPopupFusion(false);
	if (!addToGame(tmp, selecDeck1, cardToAdd))
		return;

	// Actualise le jeu et désélectionne tout
	allFalse(tmp);
}

/**
 * Mode Création : supprime la carte sélectionnée (appelée après confirmation du
 * popup de suppression), ou désélectionne tout s'il n'y a pas de carte sélectionnée.
 *
 * ⚠️ Ne doit être appelée qu'en mode Create (ou pour des tests).
 *
 * @param {Object} deps
 * @param {number} deps.selecCard1
 * @param {number} deps.selecDeck1
 * @param {Card[][]} deps.game
 * @param {Function} deps.setPopupDeleteCard
 * @param {Function} deps.saveGame
 * @param {Function} deps.allFalse
 * @param {Function} deps.allFalseGame
 * @param {Function} deps.delCard
 */
export function runDeleteCard(deps)
{
	const { selecCard1, selecDeck1, game, setPopupDeleteCard, saveGame, allFalse, allFalseGame, delCard } = deps;

	// Enlève le popup
	setPopupDeleteCard(false);

	// Si la carte sélectionnée n'est pas la carte 1 : tout désélectionner
	if (!(selecCard1 === -1 && selecDeck1 === -1))
	{
		// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
		saveGame();

		// Copie du jeu actuel
		let tmp = [...game];

		// Supprime la carte
		tmp[selecDeck1] = delCard(game[selecDeck1], selecCard1);

		// Actualise le jeu et désélectionne tout
		allFalse(tmp);
	}
	else
		allFalseGame();
}

/**
 * Mode Création : ouvre la popup de confirmation avant de supprimer une carte.
 * Si aucune carte n'est sélectionnée, désélectionne simplement tout.
 *
 * @param {Object} deps
 * @param {number} deps.selecCard1
 * @param {number} deps.selecDeck1
 * @param {Function} deps.setPopupDeleteCard
 * @param {Function} deps.allFalseGame
 */
export function runConfirmDeleteCard(deps)
{
	const { selecCard1, selecDeck1, setPopupDeleteCard, allFalseGame } = deps;

	if (selecCard1 === -1 && selecDeck1 === -1)
	{
		allFalseGame();
		return;
	}

	setPopupDeleteCard(true);
}