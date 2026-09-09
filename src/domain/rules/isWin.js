import { containCard } from "../gameSolver";
import { buildObjectives, checkSubObj, removeDeck } from "./goals";

/**
 * Cherche l'implication dans le deck objectif correspondant à la LPU d'indice d.
 * L'hypothèse de la LPU est toujours sa première carte (gameState[d][0]).
 *
 * @param {Card[][]} gameState
 * @param {number} d - indice de la LPU
 *
 * @returns {{ card: Card, index: number } | null}
 */
function findParentImplicationForLPU(gameState, d)
{
	const lpu = gameState[d];
	if (!lpu || lpu.length === 0)
		return null;

	const hypothesis = lpu[0];
	const objDeck = gameState[gameState.length - 1];
	if (!objDeck)
		return null;

	// Cherche les implications dont la partie gauche est égale à l'hypothèse
	const candidates = [];
	for (let i = 0; i < objDeck.length; i++)
	{
		const card = objDeck[i];
		if (card != null && card.color === null && card.link === "=>")
		{
			if (card.left.equals(hypothesis))
				candidates.push({ card, index: i });
		}
	}

	if (candidates.length === 0)
		return null;

	if (candidates.length === 1)
		return candidates[0];

	// Si plusieurs candidats, préférer celui dont la partie droite est déjà présente dans la LPU
	const foundByRightInLPU = candidates.find(c => containCard(gameState, d, c.card.right));
	if (foundByRightInLPU)
		return foundByRightInLPU;

	// Préférer celui dont la partie droite apparaît comme sous-objectif dans le deck objectif
	const foundBySubObj = candidates.find(c =>
		objDeck.some((elem, idx) => idx !== c.index && elem != null && elem.equals(c.card.right))
	);
	if (foundBySubObj)
		return foundBySubObj;

	return candidates[0];
}

/**
 * Supprime du deck objectif toute carte égale à cardToDelete,
 * en protégeant toujours l'objectif principal à l'indice 0.
 *
 * @param {Card[]} deck
 * @param {Card} cardToDelete
 *
 * @returns {Card[]}
 */
function removeSubObjective(deck, cardToDelete)
{
	if (!cardToDelete || deck.length <= 1)
		return deck;

	let finalDeck = [deck[0]];
	let cpt = 0;
	for (let i = 1; i < deck.length; i++)
	{
		if (deck[i] != null && deck[i].equals(cardToDelete))
			cpt++;
		else if (deck[i] != null)
		{
			let tmpCard = deck[i];
			tmpCard.id = tmpCard.id - cpt;
			finalDeck.push(tmpCard);
		}
	}

	return finalDeck;
}

/**
 * Vérifie si l'exercice est résolu (objectif principal atteint) et fait progresser
 * la démonstration en conséquence (retire les objectifs secondaires satisfaits,
 * remonte les LPU intermédiaires...). Fonction récursive : peut s'appeler elle-même
 * pour re-vérifier l'objectif principal après qu'un objectif secondaire ait été résolu.
 *
 * @param {Array} arrayMsg
 * @param {number[]} arrayIndent
 * @param {Card[][]} gameState
 * @param {boolean} [originel=true] - true pour l'appel initial (déclenche les effets
 *                                    de bord : mise à jour du jeu, popup de victoire...).
 *                                    false pour les appels récursifs internes.
 * @param {Object} deps
 * @param {Function} deps.addToGame
 * @param {Function} deps.addLineDemonstration
 * @param {Function} deps.setSavedGame
 * @param {Function} deps.clearSelection
 * @param {Function} deps.setObjectives
 * @param {Function} deps.setWin
 * @param {Function} deps.setPopupWin
 * @param {Function} deps.saveProgress
 *
 * @returns {[Card[][], boolean, Array, number[]]} [gameState, bool, arrayMsg, arrayIndent]
 */
export function runIsWin(arrayMsg, arrayIndent, gameState, originel=true, deps)
{
	const { addToGame, addLineDemonstration, setSavedGame, clearSelection, setObjectives, setWin, setPopupWin, saveProgress } = deps;

	let bool = false;
	let modif = false;

	// 1. Vérifier si une LPU a atteint son objectif ou a dérivé "Faux" (principe d'explosion).
	// On parcourt de la LPU la plus imbriquée vers la première.
	const numLPUs = gameState.length - 2;
	for (let d = numLPUs; d >= 1; d--)
	{
		const parentInfo = findParentImplicationForLPU(gameState, d);
		if (!parentInfo)
			continue;

		const { card: parentImpl, index: parentIndex } = parentInfo;
		const goal = parentImpl.right;

		const hasGoal = containCard(gameState, d, goal);
		const hasWhite = gameState[d].some(c => c != null && c.color === "white");

		if (hasGoal || hasWhite)
		{
			modif = true;
			const objectiveCard = parentImpl.copy();

			// Remonte l'implication démontrée dans le deck juste au-dessus de la LPU
			if (!addToGame(gameState, d - 1, objectiveCard, undefined, false))
				return [gameState, bool, arrayMsg, arrayIndent];

			// Retire le sous-objectif éventuel (goal) du deck objectif
			gameState[gameState.length - 1] = removeSubObjective(gameState[gameState.length - 1], goal);

			// Retire l'implication démontrée si ce n'est pas l'objectif principal (index 0)
			if (parentIndex !== 0)
				gameState[gameState.length - 1] = removeSubObjective(gameState[gameState.length - 1], parentImpl);

			// Supprime la LPU résolue
			gameState = removeDeck(gameState, d);

			arrayMsg.push(["On a ", objectiveCard.copy(), "."]);
			arrayIndent.push(-1);
			break;
		}
	}

	// 2. Objectifs secondaires sans LPU intermédiaire (issus d'un "et" ou depuis LPU) :
	// ce sont des cartes "Montrons X" ajoutées au deck objectif sans création de LPU.
	// Dès que X est présent dans Deck 0 ou dans une LPU, on retire la carte correspondante des objectifs.
	if (!bool && !modif)
	{
		const objDeckIndex = gameState.length - 1;
		for (let i = gameState[objDeckIndex].length - 1; i >= 1; i--)
		{
			const goalCard = gameState[objDeckIndex][i];
			if (goalCard == null)
				continue;

			if (checkSubObj(gameState[objDeckIndex], goalCard))
				continue;

			let found = false;
			for (let d = 0; d < objDeckIndex; d++)
			{
				if (containCard(gameState, d, goalCard))
				{
					found = true;
					break;
				}
			}

			if (found)
			{
				gameState[objDeckIndex] = removeSubObjective(gameState[objDeckIndex], goalCard);
				arrayMsg.push(["On a ", goalCard.copy(), "."]);
				arrayIndent.push(0);
				modif = true;
				break;
			}
		}
	}

	// 3. Récursion : si une LPU ou un sous-objectif a été résolu, re-vérifier l'état global
	// (la résolution peut permettre de résoudre la LPU parente ou l'objectif principal).
	if (!bool && modif)
	{
		let recursiveResult = runIsWin(arrayMsg, arrayIndent, gameState, false, deps);
		gameState = recursiveResult[0];
		bool = recursiveResult[1];
		arrayMsg = recursiveResult[2];
		arrayIndent = recursiveResult[3];
	}

	// 4. Objectif principal : ne peut être validé que dans le deck 0 lorsqu'aucune LPU n'est ouverte.
	// Un théorème ne peut être déclaré démontré que lorsque toutes les hypothèses
	// temporaires ont été déchargées.
	if (!bool && !modif && gameState.length === 2)
	{
		const mainObj = gameState[gameState.length - 1][0];
		const deck0HasMain = mainObj != null && gameState[0].some(c => c != null && c.equalsSymmetric(mainObj));
		const deck0HasWhite = gameState[0].some(c => c != null && c.color === "white");
		if (deck0HasMain || deck0HasWhite)
			bool = true;
	}

	if (originel)
	{
		addLineDemonstration(arrayMsg, arrayIndent);
		setSavedGame(gameState);
		clearSelection(gameState);
		const currentObjectives = buildObjectives(gameState);
		setObjectives(currentObjectives);
	}

	if (originel && bool)
	{
		setWin(true);
		setPopupWin(true);
		saveProgress();
	}

	return [gameState, bool, arrayMsg, arrayIndent];
}