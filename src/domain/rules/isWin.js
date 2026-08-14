import { containCard } from "../gameSolver";
import { CreatTabObj, findObjectifRelative, checkSubObj, delCard, delDeck, delCardWithEquals } from "./goals";


/**
 * Vérifie si l'exercice est résolu (objectif principal atteint) et fait progresser
 * la démonstration en conséquence (retire les objectifs secondaires satisfaits,
 * remonte les LPU intermédiaires...). Fonction récursive : peut s'appeler elle-même
 * pour re-vérifier l'objectif principal après qu'un objectif secondaire ait été résolu.
 *
 * @param {Array} arrayMsg
 * @param {number[]} arrayIndent
 * @param {Card[][]} tmp
 * @param {boolean} [originel=true] - true pour l'appel initial (déclenche les effets
 *                                    de bord : mise à jour du jeu, popup de victoire...).
 *                                    false pour les appels récursifs internes.
 * @param {Object} deps
 * @param {Function} deps.addToGame
 * @param {Function} deps.addLineDemonstration
 * @param {Function} deps.setSavedGame
 * @param {Function} deps.allFalse
 * @param {Function} deps.setTabObjectif
 * @param {Function} deps.setWin
 * @param {Function} deps.setPopupWin
 * @param {Function} deps.saveProgress
 *
 * @returns {[Card[][], boolean, Array, number[]]} [tmp, bool, arrayMsg, arrayIndent]
 */
export function runIsWin(arrayMsg, arrayIndent, tmp, originel, deps)
{
	if (originel === undefined)
		originel = true;

	const { addToGame, addLineDemonstration, setSavedGame, allFalse, setTabObjectif, setWin, setPopupWin, saveProgress } = deps;

	let tmpTabObjectif = CreatTabObj(tmp);
	const listObjectif = [];
	for (let numObjectif of tmpTabObjectif)
		listObjectif.push([tmp[tmp.length - 1][numObjectif[1]], numObjectif,]);

	let bool = false;
	let modif = false;

	const findIntermediateDeckFor = (cardObj) => {
		const findObj = findObjectifRelative(cardObj, tmp);
		if (findObj === -1)
			return -1;

		const hypothesis = tmp[tmp.length - 1][findObj].left;
		for (let d = 1; d < tmp.length - 1; d++)
		{
			if (containCard(tmp, d, hypothesis))
				return d;
		}

		return -1;
	};

	const checkWinForEveryObjectif = (cardArray) => {
		const cardObj = cardArray[0];
		const numObj = cardArray[1][0];
		const isLinked = cardArray[1][2];

		const intermediaireDeck = numObj === 0 ? 0 : findIntermediateDeckFor(cardObj);

		const checkWin = (card, deckIndex) => {
			if (card == null || cardObj == null)
				return;

			if (modif || bool)
				return;

			if (!card.equals(cardObj) && card.color !== "white")
				return;

			// Objectif principal.
			if (numObj === 0)
			{
				bool = true;
				return;
			}

			// La carte doit être dans la bonne LPU ou dans le deck de départ.
			if (deckIndex !== 0 && deckIndex !== intermediaireDeck)
				return;

			if (intermediaireDeck === -1)
				return;

			const findObj = findObjectifRelative(cardObj, tmp);
			if (findObj === -1)
				return;

			modif = true;

			const tmpCard = tmp[tmp.length - 1][findObj].copy();

			// Remonte "A ⇒ B" dans le deck juste au-dessus de la LPU
			if (!addToGame(tmp, intermediaireDeck - 1, tmpCard))
				return;

			// Retire B des objectifs.
			tmp[tmp.length - 1] = delCardWithEquals(tmp[tmp.length - 1], cardObj);

			// Retire "A ⇒ B" du deck objectif s'il était lié.
			if (findObj !== 0 && isLinked)
				tmp[tmp.length - 1] = delCard(tmp[tmp.length - 1], findObj);

			// Supprime la LPU intermédiaire trouvée (plus delDeck(tmp, numObj))
			tmp = delDeck(tmp, intermediaireDeck);

			arrayMsg.push(["On a ", tmpCard.copy(), "."]);
			arrayIndent.push(-1);
		};

		// Parcourt tous les decks utiles : départ + LPU intermédiaires.
		for (let d = 0; d < tmp.length - 1; d++)
			tmp[d].forEach((card) => checkWin(card, d));

		return bool;
	};

	listObjectif.forEach((e) => {
		if (!bool && !modif)
			checkWinForEveryObjectif(e);
	});

	/**
	 * Objectifs secondaires issus d'un "et" (bouton Objectif sur (A=>B)∧(C=>D)) :
	 * ce sont des cartes "Montrons X" ajoutées au deck objectif sans LPU intermédiaire.
	 * Dès que X est présent dans une LPU, on retire la carte correspondante des objectifs.
	 */
	if (!bool && !modif)
	{
		const objDeckIndex = tmp.length - 1;
		for (let i = tmp[objDeckIndex].length - 1; i >= 1; i--)
		{
			const goalCard = tmp[objDeckIndex][i];
			if (goalCard == null || goalCard === undefined)
				continue;

			if (checkSubObj(tmp[objDeckIndex], goalCard))
				continue;

			let foundInLPU = false;
			for (let d = 0; d < objDeckIndex; d++)
			{
				if (containCard(tmp, d, goalCard))
				{
					foundInLPU = true;
					break;
				}
			}

			if (foundInLPU)
			{
				tmp[objDeckIndex] = delCardWithEquals(tmp[objDeckIndex], goalCard);
				arrayMsg.push(["On a ", goalCard.copy(), "."]);
				arrayIndent.push(0);
				modif = true;
			}
		}
	}

	/**
	 * Regarde l'objectif précédent pour voir si le fait d'ajouter l'objectif secondaire ne l'a pas validé.
	 * Si cela valide l'objectif principal : bool = true
	 * Sinon : bool = false
	 */
	if (!bool && modif)
	{
		let tmpRes = runIsWin(arrayMsg, arrayIndent, tmp, false, deps);
		tmp = tmpRes[0];
		bool = tmpRes[1];
		arrayMsg = tmpRes[2];
		arrayIndent = tmpRes[3];
	}

	if (originel)
	{
		addLineDemonstration(arrayMsg, arrayIndent);
		setSavedGame(tmp);
		allFalse(tmp);
		let tmpVar = CreatTabObj(tmp);
		setTabObjectif(tmpVar);
	}

	if (originel && bool)
	{
		setWin(true);
		setPopupWin(true);
		saveProgress();
	}

	return [tmp, bool, arrayMsg, arrayIndent];
}