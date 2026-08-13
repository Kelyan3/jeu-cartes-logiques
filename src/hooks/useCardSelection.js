import { useState } from "react";


/**
 * Gère l'état de sélection de cartes (jusqu'à 2 cartes sélectionnées simultanément)
 * ainsi que les cartes "d'aide" mises en surbrillance par le solveur.
 *
 * @returns {Object} état de sélection + fonctions selectCard / resetSelection
 */
export function useCardSelection()
{
	const [nbSelec, setNbSelec] = useState(0);
	const [selecDeck1, setSelecDeck1] = useState(-1);
	const [selecCard1, setSelecCard1] = useState(-1);
	const [selecDeck2, setSelecDeck2] = useState(-1);
	const [selecCard2, setSelecCard2] = useState(-1);
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
	 * @returns {{nbSelec: number, selecDeck1: number, selecCard1: number, selecDeck2: number, selecCard2: number}}
	 *          le nouvel état de sélection (utile à l'appelant pour ses propres besoins, ex. tutoriel/popup)
	 */
	const selectCard = (i, j, tmp) => {
		setCardHelp(null);
		setCardHelp2(null);

		let currentCard = tmp[i][j];

		let tmpNbselec = nbSelec;
		let tmpSelecDeck1 = selecDeck1;
		let tmpSelecCard1 = selecCard1;
		let tmpSelecDeck2 = selecDeck2;
		let tmpSelecCard2 = selecCard2;

		if (tmpSelecDeck1 === i && tmpSelecCard1 === j)
		{
			// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (1ère carte)
			tmpSelecCard1 = -1;
			tmpSelecDeck1 = -1;
			tmpNbselec--;
			currentCard.select(!currentCard.active);
		}
		else if (tmpSelecDeck2 === i && tmpSelecCard2 === j)
		{
			// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (2ème carte)
			tmpSelecCard2 = -1;
			tmpSelecDeck2 = -1;
			tmpNbselec--;
			currentCard.select(!currentCard.active);
		}
		else if (tmpSelecDeck1 === -1 && tmpSelecCard1 === -1)
		{
			// Aucune carte n'est sélectionnée
			tmpSelecDeck1 = i;
			tmpSelecCard1 = j;
			tmpNbselec++;
			currentCard.select(!currentCard.active);
		}
		else if (tmpNbselec < 2)
		{
			// Une seule & unique carte est sélectionnée
			tmpSelecDeck2 = i;
			tmpSelecCard2 = j;
			tmpNbselec++;
			currentCard.select(!currentCard.active);
		}

		setNbSelec(tmpNbselec);
		setSelecCard1(tmpSelecCard1);
		setSelecCard2(tmpSelecCard2);
		setSelecDeck1(tmpSelecDeck1);
		setSelecDeck2(tmpSelecDeck2);

		tmp[i][j] = currentCard;

		return {
			nbSelec: tmpNbselec,
			selecDeck1: tmpSelecDeck1,
			selecCard1: tmpSelecCard1,
			selecDeck2: tmpSelecDeck2,
			selecCard2: tmpSelecCard2,
		};
	};

	/**
	 * Désélectionne toutes les cartes (remet les indices de sélection à -1/0).
	 * Ne touche pas au tableau `game` lui-même — c'est à l'appelant de désélectionner
	 * visuellement les cartes et d'appeler setGame.
	 */
	const resetSelection = () => {
		setNbSelec(0);
		setSelecCard1(-1);
		setSelecDeck1(-1);
		setSelecCard2(-1);
		setSelecDeck2(-1);
	};

	return {
		nbSelec, selecDeck1, selecCard1, selecDeck2, selecCard2,
		cardHelp, setCardHelp, cardHelp2, setCardHelp2,
		selectCard, resetSelection,
	};
}