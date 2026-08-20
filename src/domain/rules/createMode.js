import Card from "../Card";
import { copyGameArray } from "../gameSolver";


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
 * @param {Function} deps.clearSelectionFromGameState
 */
export function runChoixCouleur(event, deps)
{
	const { game, indiceDeckAddCard, saveGame, addToGame, clearSelectionFromGameState } = deps;

	// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
	saveGame();

	// Copie du jeu actuel
	let tmp = copyGameArray(game);

	// Dé-check le bouton radio
	event.target.checked = false;

	// Ajoute la carte dans le deck (indiceDeckAddCard est affecté avant de rentrer dans la fonction)
	let cardToAdd = new Card(game[indiceDeckAddCard].length, event.target.value, false, "", null, null, true, false);
	if (!addToGame(tmp, indiceDeckAddCard, cardToAdd))
		return;

	// Actualise le jeu et désélectionne tout
	clearSelectionFromGameState(tmp);
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
 * @param {number} deps.firstSelectedDeckIndex
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.secondSelectedDeckIndex
 * @param {number} deps.secondSelectedCardIndex
 * @param {Function} deps.setPopupFusion
 * @param {Function} deps.saveGame
 * @param {Function} deps.addToGame
 * @param {Function} deps.clearSelectionFromGameState
 */
export function runChoixLiaison(event, deps)
{
	const { game, firstSelectedDeckIndex, firstSelectedCardIndex, secondSelectedDeckIndex, secondSelectedCardIndex, setPopupFusion, saveGame, addToGame, clearSelectionFromGameState } = deps;

	// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
	saveGame();

	// Copie du jeu actuel
	let tmp = copyGameArray(game);

	// Dé-check le bouton radio
	event.target.checked = false;

	// Liaison reçu avec le bouton radio
	const l = event.target.value;

	// Copie les 2 cartes séléctionnées
	let c1 = game[firstSelectedDeckIndex][firstSelectedCardIndex].copy();
	let c2 = game[secondSelectedDeckIndex][secondSelectedCardIndex].copy();
	c1.id = 0;
	c2.id = 1;

	let cardToAdd;
	if (l === "<=>")
	{
		cardToAdd = new Card(
			game[firstSelectedDeckIndex].length, // id
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
			game[firstSelectedDeckIndex].length, // id
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
			game[firstSelectedDeckIndex].length, // id
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
	if (!addToGame(tmp, firstSelectedDeckIndex, cardToAdd))
		return;

	// Actualise le jeu et désélectionne tout
	clearSelectionFromGameState(tmp);
}

/**
 * Mode Création : supprime la carte sélectionnée (appelée après confirmation du
 * popup de suppression), ou désélectionne tout s'il n'y a pas de carte sélectionnée.
 *
 * ⚠️ Ne doit être appelée qu'en mode Create (ou pour des tests).
 *
 * @param {Object} deps
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.firstSelectedDeckIndex
 * @param {Card[][]} deps.game
 * @param {Function} deps.setPopupDeleteCard
 * @param {Function} deps.saveGame
 * @param {Function} deps.clearSelectionFromGameState
 * @param {Function} deps.clearCurrentGameSelection
 * @param {Function} deps.delCard
 */
export function runDeleteCard(deps)
{
	const { firstSelectedCardIndex, firstSelectedDeckIndex, game, setPopupDeleteCard, saveGame, clearSelectionFromGameState, clearCurrentGameSelection, delCard } = deps;

	// Enlève le popup
	setPopupDeleteCard(false);

	// Si la carte sélectionnée n'est pas la carte 1 : tout désélectionner
	if (!(firstSelectedCardIndex === -1 && firstSelectedDeckIndex === -1))
	{
		// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
		saveGame();

		// Copie du jeu actuel
		let tmp = copyGameArray(game);

		// Supprime la carte
		tmp[firstSelectedDeckIndex] = delCard(tmp[firstSelectedDeckIndex], firstSelectedCardIndex);

		// Actualise le jeu et désélectionne tout
		clearSelectionFromGameState(tmp);
	}
	else
		clearCurrentGameSelection();
}

/**
 * Mode Création : ouvre la popup de confirmation avant de supprimer une carte.
 * Si aucune carte n'est sélectionnée, désélectionne simplement tout.
 *
 * @param {Object} deps
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.firstSelectedDeckIndex
 * @param {Function} deps.setPopupDeleteCard
 * @param {Function} deps.clearCurrentGameSelection
 */
export function runConfirmDeleteCard(deps)
{
	const { firstSelectedCardIndex, firstSelectedDeckIndex, setPopupDeleteCard, clearCurrentGameSelection } = deps;

	if (firstSelectedCardIndex === -1 && firstSelectedDeckIndex === -1)
	{
		clearCurrentGameSelection();
		return;
	}

	setPopupDeleteCard(true);
}