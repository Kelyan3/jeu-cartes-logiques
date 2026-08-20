import Card from "../Card";
import { containCard, copyGameArray } from "../gameSolver";


/**
 * Bouton "Séparation" : sépare une carte "et" sélectionnée en ses deux parties,
 * ajoutées séparément au même deck.
 *
 * @param {Object} deps
 * @param {boolean} deps.navigation
 * @param {boolean} deps.win
 * @param {number} deps.selectedCardCount
 * @param {number} deps.firstSelectedDeckIndex
 * @param {number} deps.secondSelectedDeckIndex
 * @param {number} deps.firstSelectedCardIndex
 * @param {number} deps.secondSelectedCardIndex
 * @param {Card[][]} deps.game
 * @param {Function} deps.error - error(message: string)
 * @param {Function} deps.saveGame
 * @param {Function} deps.addToGame - addToGame(gameState, deckIndex, card, defaultEmitError) => boolean
 * @param {Function} deps.isWin - isWin(msgArray, indentArray, gameState)
 */
export function runAddCardAnd(deps)
{
	const { navigation, win, selectedCardCount, firstSelectedDeckIndex, secondSelectedDeckIndex, firstSelectedCardIndex, secondSelectedCardIndex, game, error, saveGame, addToGame, isWin } = deps;

	if (navigation || win)
		return;

	// Si 2 cartes sont sélectionnées
	if (selectedCardCount > 1)
	{
		error("Vous devez sélectionner une seule carte !");
		return;
	}

	// Si aucune carte n'est sélectionnée
	if (selectedCardCount === 0)
	{
		error("Vous devez sélectionner une carte !");
		return;
	}

	/**
	 * Prend la carte qui est sélectionnée.
	 * Si elle n'est pas sélectionnée c'est -1 donc on prend la plus haute valeur.
	 */
	let deckI = Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex);
	let cardI = Math.max(firstSelectedCardIndex, secondSelectedCardIndex);

	// La carte sélectionnée doit avoir la liaison principal "et"
	if (game[deckI][cardI].link !== "et")
	{
		error('La carte sélectionnée doit avoir une liaison principale de type "et" !');
		return;
	}

	// Ajoute si les 2 cartes à séparer n'existent pas déjà dans le deck
	if (containCard(game, deckI, game[deckI][cardI].left) ||
		containCard(game, deckI, game[deckI][cardI].right))
	{
		error("Les cartes que vous voulez ajouter existe déjà !");
		return;
	}

	// Sauvegarde du jeu actuel
	saveGame();

	// Copie du jeu actuel
	let workingGame = copyGameArray(game);

	// Ajoute la partie gauche de la carte dans le jeu
	let tmpCard1 = game[deckI][cardI].left.copy();
	addToGame(workingGame, deckI, tmpCard1, false);

	// Ajoute la partie droite de la carte dans le jeu
	let tmpCard2 = game[deckI][cardI].right.copy();
	addToGame(workingGame, deckI, tmpCard2, false);

	// Vérifie si l'exercice est fini, si oui affiche le popup de victoire
	isWin([["On a ", tmpCard1.copy(), ". On a ", tmpCard2.copy(), "."]], [0], workingGame);
}

/**
 * Bouton "Ajouter carte =>" : à partir de deux cartes sélectionnées, dont l'une est
 * "=>" et dont la partie gauche est égale à l'autre carte, ajoute la partie droite
 * au deck le plus haut des deux.
 *
 * @param {Object} deps - mêmes champs que {@link runAddCardAnd}.
 */
export function runAddCardFuse(deps)
{
	const { navigation, win, selectedCardCount, firstSelectedDeckIndex, secondSelectedDeckIndex, firstSelectedCardIndex, secondSelectedCardIndex, game, error, saveGame, addToGame, isWin } = deps;

	if (navigation || win)
		return;

	// S'il n'y a pas 2 cartes sélectionnées
	if (selectedCardCount !== 2)
	{
		error("Vous devez sélectionner deux cartes !");
		return;
	}

	// Prend le deck le plus grand
	let finalDeck = Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex);
	if (finalDeck === game.length - 1)
	{
		error("Vous ne pouvez pas utiliser une carte de l'objectif avec ce bouton !");
		return;
	}

	// Copie du jeu actuel
	let workingGame = copyGameArray(game);

	// Vérifie si la 2ème carte a une liaison => et si sa partie gauche est égale à l'autre carte.
	let bool =
			 workingGame[secondSelectedDeckIndex][secondSelectedCardIndex].link === "=>" &&
			 workingGame[secondSelectedDeckIndex][secondSelectedCardIndex].left.equals(workingGame[firstSelectedDeckIndex][firstSelectedCardIndex]);

	// Une des 2 cartes doit avoir une liaison =>
	if (bool ||
		(workingGame[firstSelectedDeckIndex][firstSelectedCardIndex].link === "=>" &&
		workingGame[firstSelectedDeckIndex][firstSelectedCardIndex].left.equals(
			workingGame[secondSelectedDeckIndex][secondSelectedCardIndex])))
	{
		// Initialisation de la carte où la liaison => va être utilisée
		let deckCarteComplex;
		let cardCarteComplex;

		// Détermine & affecte l'id de la carte => utilisée
		if (bool)
		{
			deckCarteComplex = secondSelectedDeckIndex;
			cardCarteComplex = secondSelectedCardIndex;
		}
		else
		{
			deckCarteComplex = firstSelectedDeckIndex;
			cardCarteComplex = firstSelectedCardIndex;
		}

		if (containCard(game, finalDeck, workingGame[deckCarteComplex][cardCarteComplex].right))
		{
			error("La carte que vous voulez ajouter existe déjà !");
			return;
		}

		// Sauvegarde du jeu actuel
		saveGame();

		// Ajoute la partie droite de la carte => utilisée dans le deck le plus haut
		let cardToAdd = workingGame[deckCarteComplex][cardCarteComplex].right.copy();
		addToGame(workingGame, finalDeck, cardToAdd);

		// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
		isWin(
			[
				[
					"Puisque ",
					workingGame[deckCarteComplex][cardCarteComplex].left.copy(),
					", on a ",
					workingGame[deckCarteComplex][cardCarteComplex].right.copy(),
					".",
				],
			],
			[0],
			workingGame
		);
	}
	else
	{
		// Si aucune des 2 cartes n'a de liaison =>
		if (workingGame[secondSelectedDeckIndex][secondSelectedCardIndex].link !== "=>" &&
			workingGame[firstSelectedDeckIndex][firstSelectedCardIndex].link !== "=>")
		{
			error('Une des deux cartes doit avoir une liaison principale de type "=>" !');
		}
		else
			error('La partie gauche de la carte "=>" doit être égale à la deuxième carte sélectionnée !');
	}
}

/**
 * Bouton "Fusion carte et" : fusionne deux cartes sélectionnées en une nouvelle carte
 * "et" ajoutée au deck le plus haut des deux.
 *
 * @param {Object} deps - mêmes champs que {@link runAddCardAnd}.
 */
export function runFuseCardAnd(deps)
{
	const { navigation, win, firstSelectedDeckIndex, secondSelectedDeckIndex, firstSelectedCardIndex, secondSelectedCardIndex, game, error, saveGame, addToGame, isWin } = deps;

	if (!navigation && !win)
	{
		// Si 2 cartes sont sélectionnées
		if (firstSelectedCardIndex !== -1 && secondSelectedCardIndex !== -1 &&
			firstSelectedDeckIndex !== -1 && secondSelectedDeckIndex !== -1)
		{
			// Prend le deck le plus haut
			let finalDeck = Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex);
			if (finalDeck !== game.length - 1)
			{
				// Copie du jeu actuel
				let workingGame = copyGameArray(game);

				if (!containCard(game, finalDeck, new Card(0, null, false, "et", workingGame[firstSelectedDeckIndex][firstSelectedCardIndex], workingGame[secondSelectedDeckIndex][secondSelectedCardIndex], true, false)))
				{
					// Sauvegarde du jeu actuel
					saveGame();

					// Copie les 2 cartes sélectionnées
					let tmpCard1 = workingGame[firstSelectedDeckIndex][firstSelectedCardIndex].copy();
					let tmpCard2 = workingGame[secondSelectedDeckIndex][secondSelectedCardIndex].copy();
					tmpCard1.id = 0;
					tmpCard2.id = 1;
					tmpCard1.setOld(true);
					tmpCard2.setOld(true);

					// Ajoute la nouvelle carte dans le deck le plus haut avec les 2 autres cartes & une liaison "et"
					let cardToAdd = new Card(workingGame[finalDeck].length, null, false, "et", tmpCard1, tmpCard2, true, false);
					if (!addToGame(workingGame, finalDeck, cardToAdd))
						return;

					// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
					isWin([["On a ", tmpCard1.copy(), "^", tmpCard2.copy(), ".",], ], [0], workingGame);
				}
				else
					error("La carte que vous voulez ajouter existe déjà !");
			}
			else
				error("Vous ne pouvez pas utiliser une carte de l'objectif avec ce bouton !");
		}
		else
			error("Vous devez sélectionner deux cartes !");
	}
}