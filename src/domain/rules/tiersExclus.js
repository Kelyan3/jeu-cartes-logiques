import { copyGameArray } from "../gameSolver";

/**
 * Applique la règle du "tiers exclus" (¬(¬Carte) devient Carte) sur la carte
 * actuellement sélectionnée seule, si les conditions sont réunies.
 *
 * @param {Object} deps
 * @param {boolean} deps.navigation
 * @param {boolean} deps.win
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.secondSelectedCardIndex
 * @param {number} deps.firstSelectedDeckIndex
 * @param {number} deps.secondSelectedDeckIndex
 * @param {Card[][]} deps.game
 * @param {Function} deps.transformIntoNonCard - appelée si la carte sélectionnée est dans le deck d'objectif
 * @param {Function} deps.error - error(message: string)
 * @param {Function} deps.addToGame - addToGame(gameState, deckIndex, card, onError, defaultEmitError=true) => boolean
 * @param {Function} deps.isWin - isWin(msgArray, indentArray, gameState)
 */
export function runTiersExclus(deps)
{
	const { navigation, win, firstSelectedCardIndex, secondSelectedCardIndex, firstSelectedDeckIndex, secondSelectedDeckIndex, game, transformIntoNonCard, error, addToGame, isWin } = deps;

	if (navigation || win)
		return;

	// S'il n'y a qu'une carte de sélectionné
	if ((firstSelectedCardIndex !== -1 && secondSelectedCardIndex === -1 && firstSelectedDeckIndex !== -1 && secondSelectedDeckIndex === -1) ||
		(firstSelectedCardIndex === -1 && secondSelectedCardIndex !== -1 && firstSelectedDeckIndex === -1 && secondSelectedDeckIndex !== -1))
	{
		// Prend la carte sélectionnée
		let deckI = Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex);
		let cardI = Math.max(firstSelectedCardIndex, secondSelectedCardIndex);
		let workingGame = copyGameArray(game);
		let selectedCard = workingGame[deckI][cardI];
		if (deckI === workingGame.length - 1)
		{
			transformIntoNonCard();
			return;
		}

		if (!selectedCard.canUseTiersExclus())
		{
			error(`La carte${selectedCard.toString()} n'est pas une carte non(non(Carte))`);
			return;
		}

		let cardToAdd = selectedCard.left.left;
		if (!addToGame(workingGame, deckI, cardToAdd))
			return;

		// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
		isWin([["Puisque ", selectedCard.copy(), ", on a ", cardToAdd.copy(), ".", ], ], [0], workingGame);
	}
}