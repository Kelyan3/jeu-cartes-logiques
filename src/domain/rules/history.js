import { buildObjectives } from "./goals";


/**
 * Calcule le nouvel état (jeu, démonstration, historique) après un "Retour arrière".
 *
 * @param {Object} state
 * @param {Card[][][]} state.gameHistory
 * @param {Array} state.demonstration
 * @param {number[]} state.tabIndentation
 * @param {number[]} state.tabIndiceDemonstration
 * @param {Array} state.initialDemonstration - démonstration à restaurer si l'historique est vidé
 *
 * @returns {{
 *   hasHistory: boolean,
 *   futureGame: Card[][]|null,
 *   indentationDemonstration: number,
 *   demonstration: Array,
 *   tabIndentation: number[],
 *   tabIndiceDemonstration: number[],
 *   gameHistory: Card[][][],
 * }}
 */
export function computeUndo(state)
{
	const { gameHistory, demonstration, tabIndentation, tabIndiceDemonstration, initialDemonstration } = state;

	// Aucune sauvegarde disponible : on revient à l'état initial.
	if (gameHistory.length === 0)
	{
		return {
			hasHistory: false,
			futureGame: null,
			indentationDemonstration: 0,
			demonstration: initialDemonstration,
			tabIndentation: [0],
			tabIndiceDemonstration: [-1],
			gameHistory: [],
		};
	}

	// Copie la dernière sauvegarde du jeu (nouvelles instances de Card).
	const historyCopy = [...gameHistory];
	const savedGameState = historyCopy[historyCopy.length - 1];

	const futureGame = [];
	for (let i = 0; i < savedGameState.length; i++)
	{
		futureGame[i] = [];
		for (let j = 0; j < savedGameState[i].length; j++)
			futureGame[i].push(savedGameState[i][j].copy());
	}

	const computedIndentation = buildObjectives(futureGame).length - 1;

	// Tag des lignes de démonstration associées au coup que l'on annule.
	const tag = historyCopy.length - 1;

	let demonstrationTmp = [...demonstration];
	let tabIndentationTmp = [...tabIndentation];
	let tabIndiceTmp = [...tabIndiceDemonstration];

	// Retire toutes les lignes de démonstration ajoutées par ce coup.
	while (tabIndiceTmp.length > 0 && tabIndiceTmp[tabIndiceTmp.length - 1] === tag)
	{
		demonstrationTmp.pop();
		tabIndentationTmp.pop();
		tabIndiceTmp.pop();
	}

	historyCopy.pop();

	// Retour au tout début : on force la démonstration initiale plutôt que celle recalculée ci-dessus.
	const historyEmptied = historyCopy.length === 0;

	return {
		hasHistory: true,
		futureGame,
		indentationDemonstration: historyEmptied ? 0 : computedIndentation,
		demonstration: historyEmptied ? initialDemonstration : demonstrationTmp,
		tabIndentation: historyEmptied ? [0] : tabIndentationTmp,
		tabIndiceDemonstration: historyEmptied ? [-1] : tabIndiceTmp,
		gameHistory: historyCopy,
	};
}