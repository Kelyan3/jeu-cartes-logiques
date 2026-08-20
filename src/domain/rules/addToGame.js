import { containCard } from "../gameSolver";


/**
 * Tente d'ajouter `card` au deck `deckId` du tableau `tmp` (muté en place, comme
 * dans le comportement d'origine). Refuse l'ajout (retourne false) si la carte existe
 * déjà dans ce deck, si elle existe déjà dans le deck de départ (cas particulier de
 * l'objectif), ou si sa profondeur dépasse 6.
 *
 * @param {Card[][]} tmp
 * @param {number} deckIndex
 * @param {Card} card
 * @param {Function} onError - callback(message: string) appelé en cas de refus (sauf si defaultEmitError=false)
 * @param {boolean} [defaultEmitError=true] - si false, refuse silencieusement sans appeler onError
 *
 * @returns {boolean} true si la carte a été ajoutée
 */
export function addToGame(tmp, deckIndex, card, onError, defaultEmitError=true)
{
	if (containCard(tmp, deckIndex, card))
	{
		if (!defaultEmitError)
			return false;

		let deckAffiche = deckIndex + 1;
		if (deckAffiche === tmp.length)
			deckAffiche = "des objectifs";

		onError(`La carte ${card} existe deja dans la LPU ${deckAffiche}`);
		return false;
	}

	if (deckIndex === tmp.length - 1 && containCard(tmp, 0, card))
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

	card.id = tmp[deckIndex].length;
	card.setOld(true);
	tmp[deckIndex].push(card);

	return true;
}