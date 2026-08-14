/**
 * Retourne les coordonnées [deckIndex, cardIndex] de l'unique carte actuellement
 * sélectionnée, ou null si zéro ou plusieurs cartes sont sélectionnées (auquel cas
 * un message d'erreur adapté est émis via `onError`).
 *
 * @param {Object} deps
 * @param {number} deps.selecCard1
 * @param {number} deps.selecCard2
 * @param {number} deps.selecDeck1
 * @param {number} deps.selecDeck2
 * @param {number} deps.nbSelec
 * @param {Function} deps.onError - onError(message: string)
 *
 * @returns {[number, number]|null}
 */
export function getSingleSelectedCard({ selecCard1, selecCard2, selecDeck1, selecDeck2, nbSelec, onError })
{
	// S'il n'y a qu'une carte de sélectionné
	if ((selecCard1 !== -1 && selecCard2 === -1 && selecDeck1 !== -1 && selecDeck2 === -1) ||
		(selecCard1 === -1 && selecCard2 !== -1 && selecDeck1 === -1 && selecDeck2 !== -1))
		return [Math.max(selecDeck1, selecDeck2), Math.max(selecCard1, selecCard2)];

	if (nbSelec > 1)
		onError("Vous devez sélectionner une seule carte !");
	else if (nbSelec === 0)
		onError("Vous devez sélectionner une carte !");

	return null;
}