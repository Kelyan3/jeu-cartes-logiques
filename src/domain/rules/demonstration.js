import { stringToLogicText } from "./goals";


/**
 * Construit le texte affiché pour une ligne de démonstration à partir de son tableau
 * de segments (mélange de chaînes et de {@link Card}).
 *
 * @param {Array<string|Card>} tab
 * @param {boolean} affichageSimple - si true, chaque carte est affichée sous sa forme
 *                                    simplifiée ({@link Card#displayGoodCardRecur})
 *
 * @returns {string}
 */
export function constructDemonstration(tab, affichageSimple)
{
	let res = "";
	tab.forEach((element) => {
		if (typeof element === "string")
			res += element;
		else
		{
			let displayCard = element;
			if (affichageSimple)
				displayCard = displayCard.displayGoodCardRecur();

			res += displayCard.toString();
		}
	});

	return stringToLogicText(res);
}

/**
 * Calcule le nouvel état de démonstration (lignes affichées, indentation, indexation
 * pour "revenir en arrière") après l'ajout d'un ou plusieurs messages. Fonction pure :
 * ne modifie aucun état, retourne les nouvelles valeurs à enregistrer par l'appelant.
 *
 * @param {Object} currentState
 * @param {Array}    currentState.demonstration
 * @param {number[]} currentState.tabIndentation
 * @param {number}   currentState.indentationDemonstration
 * @param {number[]} currentState.tabIndiceDemonstration
 * @param {number}   currentState.lastGameLength - longueur actuelle de l'historique (lastGame.length)
 *
 * @param {Array} msgArray - tableau de messages à ajouter (chaque message est lui-même
 *                           un tableau de textes/cartes, voir {@link constructDemonstration})
 * @param {number[]} indentationArray - indentation associée à chaque message de msgArray
 *
 * @returns {{demonstration: Array, tabIndentation: number[], indentationDemonstration: number, tabIndiceDemonstration: number[]}}
 */
export function computeAddLineDemonstration(currentState, msgArray, indentationArray)
{
	const { demonstration, tabIndentation, indentationDemonstration, tabIndiceDemonstration, lastGameLength } = currentState;

	// Repart de l'état actuel de la démonstration (aucun appelant ne demande de reset).
	let tmpTabIndentation = [...tabIndentation];
	let tmpDemonstration = [...demonstration];
	let indentation = indentationDemonstration;
	let tmpTabIndiceDemonstration = [...tabIndiceDemonstration];

	// Indice d'historique partagé par toutes les lignes de cet appel.
	const historyIndex = lastGameLength;

	msgArray.forEach((msg, index) => {
		if (msg == null || msg.length === 0)
			return;

		if (indentationArray[index] === undefined)
			indentationArray[index] = 0;

		indentation += indentationArray[index];

		tmpTabIndentation.push(indentation);
		tmpDemonstration.push([indentation, msg]);

		// Même tag pour toutes les lignes de cette action.
		tmpTabIndiceDemonstration.push(historyIndex);
	});

	return {
		demonstration: tmpDemonstration,
		tabIndentation: tmpTabIndentation,
		indentationDemonstration: indentation,
		tabIndiceDemonstration: tmpTabIndiceDemonstration,
	};
}