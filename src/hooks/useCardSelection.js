import { useState } from "react";


/**
 * Gère l'état de sélection de cartes (jusqu'à 2 cartes sélectionnées simultanément)
 * ainsi que les cartes "d'aide" mises en surbrillance par le solveur.
 *
 * @returns {Object} état de sélection + fonctions selectCard / resetSelection
 */
export function useCardSelection()
{
	const [selectedCardCount, setSelectedCardCount] = useState(0);
	const [firstSelectedDeckIndex, setFirstSelectedDeckIndex] = useState(-1);
	const [firstSelectedCardIndex, setFirstSelectedCardIndex] = useState(-1);
	const [secondSelectedDeckIndex, setSecondSelectedDeckIndex] = useState(-1);
	const [secondSelectedCardIndex, setSecondSelectedCardIndex] = useState(-1);
	const [cardHelp, setCardHelp] = useState(null);
	const [cardHelp2, setCardHelp2] = useState(null);

	/**
	 * Sélectionne ou désélectionne la carte [i][j] du jeu temporaire `tmp` reçu
	 * (mute directement la carte concernée via `currentCard.select(...)`, comme dans
	 * le comportement d'origine). Réinitialise aussi les cartes d'aide.
	 *
	 * @param {number} i - indice du deck
	 * @param {number} j - indice de la carte dans le deck
	 * @param {Card[][]} tmp - tableau du jeu temporaire (sera muté sur tmp[i][j])
	 *
	 * @returns {{selectedCardCount: number, firstSelectedDeckIndex: number, firstSelectedCardIndex: number, secondSelectedDeckIndex: number, secondSelectedCardIndex: number}}
	 *          le nouvel état de sélection (utile à l'appelant pour ses propres besoins, ex. tutoriel/popup)
	 */
	const selectCard = (i, j, tmp) => {
		setCardHelp(null);
		setCardHelp2(null);

		let currentCard = tmp[i][j];

		let nextSelectedCardCount = selectedCardCount;
		let nextFirstSelectedDeckIndex = firstSelectedDeckIndex;
		let nextFirstSelectedCardIndex = firstSelectedCardIndex;
		let nextSecondSelectedDeckIndex = secondSelectedDeckIndex;
		let nextSecondSelectedCardIndex = secondSelectedCardIndex;

		if (nextFirstSelectedDeckIndex === i && nextFirstSelectedCardIndex === j)
		{
			// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (1ère carte)
			nextFirstSelectedCardIndex = -1;
			nextFirstSelectedDeckIndex = -1;
			nextSelectedCardCount--;
			currentCard.select(!currentCard.active);
		}
		else if (nextSecondSelectedDeckIndex === i && nextSecondSelectedCardIndex === j)
		{
			// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (2ème carte)
			nextSecondSelectedCardIndex = -1;
			nextSecondSelectedDeckIndex = -1;
			nextSelectedCardCount--;
			currentCard.select(!currentCard.active);
		}
		else if (nextFirstSelectedDeckIndex === -1 && nextFirstSelectedCardIndex === -1)
		{
			// Aucune carte n'est sélectionnée
			nextFirstSelectedDeckIndex = i;
			nextFirstSelectedCardIndex = j;
			nextSelectedCardCount++;
			currentCard.select(!currentCard.active);
		}
		else if (nextSelectedCardCount < 2)
		{
			// Une seule & unique carte est sélectionnée
			nextSecondSelectedDeckIndex = i;
			nextSecondSelectedCardIndex = j;
			nextSelectedCardCount++;
			currentCard.select(!currentCard.active);
		}

		setSelectedCardCount(nextSelectedCardCount);
		setFirstSelectedCardIndex(nextFirstSelectedCardIndex);
		setSecondSelectedCardIndex(nextSecondSelectedCardIndex);
		setFirstSelectedDeckIndex(nextFirstSelectedDeckIndex);
		setSecondSelectedDeckIndex(nextSecondSelectedDeckIndex);

		tmp[i][j] = currentCard;

		return {
			selectedCardCount: nextSelectedCardCount,
			firstSelectedDeckIndex: nextFirstSelectedDeckIndex,
			firstSelectedCardIndex: nextFirstSelectedCardIndex,
			secondSelectedDeckIndex: nextSecondSelectedDeckIndex,
			secondSelectedCardIndex: nextSecondSelectedCardIndex,
		};
	};

	/**
	 * Désélectionne toutes les cartes (remet les indices de sélection à -1/0).
	 * Ne touche pas au tableau `game` lui-même — c'est à l'appelant de désélectionner
	 * visuellement les cartes et d'appeler setGame.
	 */
	const resetSelection = () => {
		setSelectedCardCount(0);
		setFirstSelectedCardIndex(-1);
		setFirstSelectedDeckIndex(-1);
		setSecondSelectedCardIndex(-1);
		setSecondSelectedDeckIndex(-1);
	};

	return {
		selectedCardCount, firstSelectedDeckIndex, firstSelectedCardIndex,
		secondSelectedDeckIndex, secondSelectedCardIndex,
		cardHelp, setCardHelp, cardHelp2, setCardHelp2,
		selectCard, resetSelection,
	};
}