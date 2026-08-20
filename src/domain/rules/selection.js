/**
 * Retourne les coordonnées [deckIndex, cardIndex] de l'unique carte actuellement
 * sélectionnée, ou null si zéro ou plusieurs cartes sont sélectionnées (auquel cas
 * un message d'erreur adapté est émis via `onError`).
 *
 * @param {Object} deps
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.secondSelectedCardIndex
 * @param {number} deps.firstSelectedDeckIndex
 * @param {number} deps.secondSelectedDeckIndex
 * @param {number} deps.selectedCardCount
 * @param {Function} deps.onError - onError(message: string)
 *
 * @returns {[number, number]|null}
 */
export function getSingleSelectedCard({ firstSelectedCardIndex, secondSelectedCardIndex, firstSelectedDeckIndex, secondSelectedDeckIndex, selectedCardCount, onError })
{
	// S'il n'y a qu'une carte de sélectionné
	if ((firstSelectedCardIndex !== -1 && secondSelectedCardIndex === -1 && firstSelectedDeckIndex !== -1 && secondSelectedDeckIndex === -1) ||
		(firstSelectedCardIndex === -1 && secondSelectedCardIndex !== -1 && firstSelectedDeckIndex === -1 && secondSelectedDeckIndex !== -1))
		return [Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex), Math.max(firstSelectedCardIndex, secondSelectedCardIndex)];

	if (selectedCardCount > 1)
		onError("Vous devez sélectionner une seule carte !");
	else if (selectedCardCount === 0)
		onError("Vous devez sélectionner une carte !");

	return null;
}