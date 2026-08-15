import { copyGameArray } from "../gameSolver";

/**
 * Applique la règle du "tiers exclus" (¬(¬Carte) devient Carte) sur la carte
 * actuellement sélectionnée seule, si les conditions sont réunies.
 *
 * @param {Object} deps
 * @param {boolean} deps.navigation
 * @param {boolean} deps.win
 * @param {number} deps.selecCard1
 * @param {number} deps.selecCard2
 * @param {number} deps.selecDeck1
 * @param {number} deps.selecDeck2
 * @param {Card[][]} deps.game
 * @param {Function} deps.transformIntoNonCard - appelée si la carte sélectionnée est dans le deck d'objectif
 * @param {Function} deps.error - error(message: string)
 * @param {Function} deps.addToGame - addToGame(tmp, deckId, card) => boolean
 * @param {Function} deps.isWin - isWin(msgArray, indentArray, tmp)
 */
export function runTiersExclus({ navigation, win, selecCard1, selecCard2, selecDeck1, selecDeck2, game, transformIntoNonCard, error, addToGame, isWin })
{
	if (navigation || win)
		return;

	// S'il n'y a qu'une carte de sélectionné
	if ((selecCard1 !== -1 && selecCard2 === -1 && selecDeck1 !== -1 && selecDeck2 === -1) ||
		(selecCard1 === -1 && selecCard2 !== -1 && selecDeck1 === -1 && selecDeck2 !== -1))
	{
		// Prend la carte sélectionnée
		let deckI = Math.max(selecDeck1, selecDeck2);
		let cardI = Math.max(selecCard1, selecCard2);
		let tmp = copyGameArray(game);
		let cardTmp = tmp[deckI][cardI];
		if (deckI === tmp.length - 1)
		{
			transformIntoNonCard();
			return;
		}

		if (!cardTmp.canUseTiersExclus())
		{
			error(`La carte${cardTmp.toString()} n'est pas une carte non(non(Carte))`);
			return;
		}

		let cardToAdd = cardTmp.left.left;
		if (!addToGame(tmp, deckI, cardToAdd))
			return;

		// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
		isWin([["Puisque ", cardTmp.copy(), ", on a ", cardToAdd.copy(), ".", ], ], [0], tmp);
	}
}