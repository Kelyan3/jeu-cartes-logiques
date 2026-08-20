import { containCard } from "../gameSolver";


/**
 * Tente d'ajouter `card` au deck `deckIndex` du tableau `gameState` (muté en place, comme
 * dans le comportement d'origine). Refuse l'ajout (retourne false) si la carte existe
 * déjà dans ce deck, si elle existe déjà dans le deck de départ (cas particulier de
 * l'objectif), ou si sa profondeur dépasse 6.
 *
 * @param {Card[][]} gameState
 * @param {number} deckIndex
 * @param {Card} card
 * @param {Function} onError - callback(message: string) appelé en cas de refus (sauf si defaultEmitError=false)
 * @param {boolean} [defaultEmitError=true] - si false, refuse silencieusement sans appeler onError
 *
 * @returns {boolean} true si la carte a été ajoutée
 */
export function addToGame(gameState, deckIndex, card, onError, defaultEmitError=true)
{
	if (containCard(gameState, deckIndex, card))
	{
		if (!defaultEmitError)
			return false;

		let deckAffiche = deckIndex + 1;
		if (deckAffiche === gameState.length)
			deckAffiche = "des objectifs";

		onError(`La carte ${card} existe deja dans la LPU ${deckAffiche}`);
		return false;
	}

	if (deckIndex === gameState.length - 1 && containCard(gameState, 0, card))
	{
		if (!defaultEmitError)
			return false;

		onError(`La carte ${card} existe deja dans la LPU 1`);
		return false;
	}

	if (card.getProfondeur() > 6)
	{
		if (!defaultEmitError)
			return false;

		onError(`La carte ${card} est trop grosse`);
		return false;
	}

	card.id = gameState[deckIndex].length;
	card.setOld(true);
	gameState[deckIndex].push(card);

	return true;
}