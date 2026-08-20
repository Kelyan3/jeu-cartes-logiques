/**
 * Parcourt le deck passé en paramètre (gameState[deckIndex]) et regarde s'il existe une carte qui est égale à la
 * carte passée en paramètre.
 *
 * @param {Card[][]} gameState - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckIndex - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {boolean} true si une carte égale existe dans ce deck
 */
export function containCard(gameState, deckIndex, card)
{
	return gameState[deckIndex].some((cardElement) => cardElement.equals(card));
}

/**
 * Comme {@link containCard}, mais utilise Card.equalsSymmetric() plutôt que
 * Card.equals() : reconnaît une carte "<=>" déjà présente dans le deck même si
 * elle y est écrite dans l'ordre inverse (P<=>Q reconnue comme identique à Q<=>P).
 * Utilisée uniquement par la variante "symétrique" du bouton Transitivité.
 *
 * @param {Card[][]} gameState - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckIndex - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {boolean} true si une carte égale (au sens large) existe dans ce deck
 */
export function containCardSymmetric(gameState, deckIndex, card)
{
	return gameState[deckIndex].some((cardElement) => cardElement.equalsSymmetric(card));
}

/**
 * Parcourt le deck passé en paramètre (gameState[deckIndex]) et regarde s'il existe une carte qui est égale à la
 * carte passée en paramètre.
 *
 * @param {Card[][]} gameState - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckIndex - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {number} -1 si la carte n'est pas dans le deck, sinon son indice
 */
	function findCardIndex(gameState, deckIndex, card) {
	let num = -1;
	gameState[deckIndex].forEach((cardElement, index) => {
		if (cardElement.equals(card))
			num = index;
	});

	return num;
}

/**
 * Renvoie le numéro de l'objectif associé à l'indice de la carte dans le deck objectif.
 *
 * @param {Array} objectives - tableau des objectifs (voir Game.jsx pour le format exact)
 * @param {number} objectif - indice de la carte de l'objectif que l'on cherche dans le deck
 *
 * @returns {number} le numéro de l'objectif (0 = objectif principal, par défaut)
 */
function getObjectiveNumber(objectives, objectif)
{
	let result = 0;
	objectives.forEach((element) => {
		if (element[1] == objectif)
			result = element[0];
	});

	return result;
}

/**
 * Teste une carte pour voir si en utilisant le bouton "Séparation" (carte "et") on peut obtenir la carte
 * objectif.
 *
 * @param {Card} card - la carte que l'on teste
 * @param {Card} targetCard - la carte que l'on veut obtenir
 *
 * @returns {boolean}
 */
function isObtainableEt(card, targetCard)
{
	if (card.color !== null || card.link !== "et")
		return false;

	return card.left.equals(targetCard) || card.right.equals(targetCard);
}

/**
 * Teste une carte pour voir si on peut obtenir la carte objectif en utilisant la liaison "=>",
 * en descendant uniquement dans des chaînes d'implications (et éventuellement un "et" terminal).
 *
 * @param {Card} card - la carte que l'on teste
 * @param {Card} targetCard - la carte que l'on veut obtenir
 *
 * @returns {boolean}
 */
function isObtainableImplique(card, targetCard)
{
	if (card.color !== null || card.link !== "=>")
		return false;

	if (card.right.equals(targetCard))
		return true;

	return isObtainableImplique(card.right, targetCard) || isObtainableEt(card.right, targetCard);
}

/**
 * Indique si une carte "et" contient, dans l'un de ses côtés, un chemin vers la carte objectif
 * (implication, "et" imbriqué, ou égalité directe). Sert à détecter qu'il faut d'abord séparer
 * cette carte pour exposer le sous-terme utile.
 *
 * @param {Card} card
 * @param {Card} targetCard
 *
 * @returns {boolean}
 */
function isEtLeadingTo(card, targetCard)
{
	if (card.color !== null || card.link !== "et")
		return false;

	if (card.left.equals(targetCard) || card.right.equals(targetCard))
		return true;

	return (
		isObtainableImplique(card.left, targetCard) ||
		isObtainableImplique(card.right, targetCard) ||
		isObtainableEt(card.left, targetCard) ||
		isObtainableEt(card.right, targetCard) ||
		isEtLeadingTo(card.left, targetCard) ||
		isEtLeadingTo(card.right, targetCard)
	);
}

/**
 * Fait une copie du jeu reçu en créant un nouveau tableau & en copiant toutes les cartes.
 * Équivalent pur (ne dépend d'aucun state) de Game.jsx#copyGame.
 *
 * @param {Card[][]} game
 *
 * @returns {Card[][]} une copie du jeu
 */
export function copyGameArray(game)
{
	const copiedGame = [];
	for (let i = 0; i < game.length; i++)
	{
		copiedGame[i] = [];
		for (let j = 0; j < game[i].length; j++)
		{
			copiedGame[i].push(game[i][j].copy());
		}
	}

	return copiedGame;
}

/**
 * Regarde si la carte passée en paramètre existe dans le jeu reçu, en dehors du deck objectif.
 *
 * @param {Card[][]} game
 * @param {Card} targetCard - la carte que l'on cherche
 *
 * @returns {boolean}
 */
function cardExistsInGame(game, targetCard)
{
	let result = false;
	game.forEach((deck, index) => {
		deck.forEach((card) => {
			if (index !== game.length - 1 && card.equals(targetCard))
				result = true;
		});
	});

	return result;
}

/**
 * Cherche la position [deck, carte] d'une carte égale à cardTest hors du deck objectif.
 *
 * @param {Card[][]} game
 * @param {Card} targetCard
 *
 * @returns {[number, number]|null}
 */
function findCardPos(game, targetCard)
{
	for (let d = 0; d < game.length - 1; d++)
	{
		for (let c = 0; c < game[d].length; c++)
		{
			if (game[d][c].equals(targetCard))
				return [d, c];
		}
	}

	return null;
}

/**
 * Cherche de manière récursive un chemin pour créer la carte objectif : elle cherche à trouver un moyen de
 * créer cardTest avec une autre carte, s'il y a un moyen elle va chercher à créer cette autre carte jusqu'à
 * tomber sur une carte simple existante.
 *
 * @param {Card[][]} workingGame - tableau du jeu temporaire (sera modifié pendant la recherche)
 * @param {Card} targetCard - la dernière carte trouvée pour aller à l'objectif
 * @param {number} deckIndex - indice du deck de la dernière carte trouvée pour aller à l'objectif
 * @param {number} objectiveDeckIndex - numéro de l'objectif
 * @param {Array} solutionPath - le chemin de cartes actuel : [tableau des étapes, solution trouvée ou non]
 * @param {Array} objectives - tableau des objectifs du jeu (voir Game.jsx)
 *
 * @returns {Array} le chemin mis à jour
 */
function solveRecursively(workingGame, targetCard, deckIndex, objectiveDeckIndex, solutionPath, objectives)
{
	solutionPath[1] = false;

	let nextSolutionPath;
	let currentDeckIndex = 0;

	if (targetCard.link === "et" && !containCard(workingGame, objectiveDeckIndex, targetCard))
	{
		if (containCard(workingGame, deckIndex, targetCard))
			solutionPath[0].push([deckIndex, objectives[objectiveDeckIndex][1]]);

			nextSolutionPath = [...solveRecursively(workingGame, targetCard.left, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
		solutionPath = [...nextSolutionPath];

		if (solutionPath[1])
		{
			workingGame = copyGameArray(workingGame);
			nextSolutionPath = [...solveRecursively(workingGame, targetCard.right, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
			solutionPath = [...nextSolutionPath];
		}
	}

	if (!solutionPath[1] && deckIndex === workingGame.length - 1 && targetCard.link === "=>")
	{
		workingGame.splice(workingGame.length - 1, 0, []);
		workingGame[workingGame.length - 2].push(targetCard.left.copy());
		workingGame[workingGame.length - 1].push(targetCard.right.copy());
		solutionPath[0].push([workingGame.length - 1, workingGame[workingGame.length - 1].length - 1]);
		nextSolutionPath = [...solveRecursively(
			workingGame,
			workingGame[workingGame.length - 1][workingGame[workingGame.length - 1].length - 1],
			workingGame.length - 1,
			objectiveDeckIndex + 1,
			solutionPath,
			objectives
		),];

		solutionPath = [...nextSolutionPath];
		if (solutionPath[1])
			workingGame[objectiveDeckIndex].push(targetCard.copy());
	}

	if (!solutionPath[1])
	{
		workingGame
			.slice()
			.reverse()
			.forEach((deck, i) => {
				currentDeckIndex = workingGame.length - 1 - i;
				deck.forEach((card, cardIndex) => {
					if (objectiveDeckIndex >= currentDeckIndex)
					{
						if (!solutionPath[1] && currentDeckIndex !== workingGame.length - 1 && currentDeckIndex <= objectiveDeckIndex && containCard(workingGame, currentDeckIndex, targetCard))
						{
							solutionPath[1] = true;
							if (solutionPath[0].length === 0 ||
								!workingGame[solutionPath[0][solutionPath[0].length - 1][0]][solutionPath[0][solutionPath[0].length - 1][1]].equals(targetCard))
							{
								solutionPath[0].push([currentDeckIndex, findCardIndex(workingGame, currentDeckIndex, targetCard)]);
							}
						}

						if (!solutionPath[1] && currentDeckIndex !== workingGame.length - 1 && isObtainableImplique(card, targetCard))
						{
							if (card.right.color === null)
							{
								if (card.right.link === "=>")
								{
									nextSolutionPath = [...solveRecursively(workingGame, card.right.left, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
									solutionPath = [...nextSolutionPath];
								}
							}
							else
								solutionPath[1] = true;

							if (solutionPath[1])
							{
								solutionPath[0].push([deckIndex, cardIndex]);
								nextSolutionPath = [...solveRecursively(workingGame, card.left, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
								solutionPath = [...nextSolutionPath];
							}

							if (!solutionPath[1])
							{
								if (card.color === null && card.left && card.left.link === "=>")
								{
									workingGame[workingGame.length - 1].push(card.left.copy());
									nextSolutionPath = [...solveRecursively(workingGame, card.left, workingGame.length - 1, objectiveDeckIndex, solutionPath, objectives),];
									solutionPath = [...nextSolutionPath];
								}
							}
						}

						if (!solutionPath[1] && currentDeckIndex !== workingGame.length - 1 && isObtainableEt(card, targetCard))
						{
							solutionPath[0].push([deckIndex, cardIndex]);

							if (!containCard(workingGame, deckIndex, card.right))
								workingGame[deckIndex].push(card.right.copy());

							if (!containCard(workingGame, deckIndex, card.left))
								workingGame[deckIndex].push(card.left.copy());

								nextSolutionPath = [...solveRecursively(workingGame, targetCard, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
							solutionPath = [...nextSolutionPath];
						}

						if (!solutionPath[1] && currentDeckIndex !== workingGame.length - 1 && isEtLeadingTo(card, targetCard))
						{
							const leftHelps =
								card.left.equals(targetCard) ||
								isObtainableImplique(card.left, targetCard) ||
								isObtainableEt(card.left, targetCard) ||
								isEtLeadingTo(card.left, targetCard);

							const rightHelps =
								card.right.equals(targetCard) ||
								isObtainableImplique(card.right, targetCard) ||
								isObtainableEt(card.right, targetCard) ||
								isEtLeadingTo(card.right, targetCard);

							const usefulAlreadyPresent =
								(leftHelps && cardExistsInGame(workingGame, card.left)) ||
								(rightHelps && cardExistsInGame(workingGame, card.right));

							if (!usefulAlreadyPresent)
							{
								solutionPath[0].push([deckIndex, cardIndex]);
								const copiedGame = copyGameArray(workingGame);

								if (!containCard(copiedGame, deckIndex, card.left))
									copiedGame[deckIndex].push(card.left.copy());

								if (!containCard(copiedGame, deckIndex, card.right))
									copiedGame[deckIndex].push(card.right.copy());

								nextSolutionPath = [...solveRecursively(copiedGame, targetCard, currentDeckIndex, objectiveDeckIndex, solutionPath, objectives),];
								solutionPath = [...nextSolutionPath];
							}
						}
					}
				});
			});
	}

	return solutionPath;
}

/**
 * Cherche le prochain coup qui amène à finir l'exercice, à partir de l'état actuel du jeu.
 *
 * @param {Card[][]} game - le jeu actuel (state `game` de Game.jsx)
 * @param {Array} objectives - le tableau des objectifs actuel (state `objectives` de Game.jsx)
 *
 * @returns {{cardHelp: [number, number]|null, cardHelp2: [number, number]|null}}
 *          Position(s) [indiceDeck, indiceCarte] de la ou des cartes à mettre en surbrillance,
 *          ou null si aucune suggestion n'a pu être trouvée pour l'une d'entre elles.
 */
export function computeNextMove(game, objectives)
{
	const workingGame = copyGameArray(game);
	const searchPath = [[], false];
	const objectiveDeckIndex = workingGame.length - 1;
	const cardId = workingGame[workingGame.length - 1].length - 1;
	const objectif = workingGame[objectiveDeckIndex][cardId];
 
	// Rien à suggérer s'il n'y a pas (encore) d'objectif, par exemple en mode Création.
	if (objectif === undefined)
		return { cardHelp: null, cardHelp2: null };

	const result = solveRecursively(workingGame, objectif, objectiveDeckIndex, getObjectiveNumber(objectives, cardId), searchPath, objectives);
	const solutionPath = [...result[0]].reverse();

	/**
	 * Vérifie qu'une position [deck, carte] pointe bien vers une carte existante dans le jeu actuel
	 * (le chemin trouvé porte sur la copie `workingGame`, qui a pu évoluer différemment du jeu réel).
	 */
	const getValidPosition = (pos) => {
		if (pos === undefined)
			return undefined;

		const [d, c] = pos;
		return game[d] !== undefined && game[d][c] !== undefined ? pos : undefined;
	}

	// Cas où l'objectif "=>" vient tout juste d'obtenir son propre deck (rien à séparer avant).
	if (objectif.link === "=>" && game.length === objectives.length + 1)
		return { cardHelp: [objectiveDeckIndex, cardId], cardHelp2: null };

	for (let i = 0; i < solutionPath.length; i++)
	{
		const pos = getValidPosition(solutionPath[i]);
		if (pos === undefined)
			continue;

		const card = game[pos[0]][pos[1]];

		if (card.link === "et")
		{
			const leftPresent = cardExistsInGame(game, card.left);
			const rightPresent = cardExistsInGame(game, card.right);
			if (!leftPresent || !rightPresent)
				return { cardHelp: pos, cardHelp2: null };

			// Déjà séparée : on passe à l'étape suivante du chemin.
			continue;
		}

		if (card.link === "=>" &&
			cardExistsInGame(game, card.left) &&
			!cardExistsInGame(game, card.right))
		{
			const leftPos = findCardPos(game, card.left);
			if (leftPos !== null)
				return { cardHelp: leftPos, cardHelp2: pos };
		}
	}

	// Repli sur les deux premières positions valides du chemin (comportement historique).
	const pos1 = getValidPosition(solutionPath[0]);
	const pos2 = getValidPosition(solutionPath[1]);
	const card1 = pos1 ? game[pos1[0]][pos1[1]] : undefined;
	const card2 = pos2 ? game[pos2[0]][pos2[1]] : undefined;

	const bothExist =
		pos1 !== undefined &&
		pos2 !== undefined &&
		cardExistsInGame(game, card1) &&
		cardExistsInGame(game, card2) &&
		pos2[0] < game.length - 1;

	if (bothExist)
		return { cardHelp: pos1, cardHelp2: pos2 };

	/**
	 * Repli : aucune des deux cartes trouvées n'existe déjà dans le jeu, c'est qu'il doit y avoir un
	 * sous-objectif à créer qui ne soit pas encore dans le deck objectif. Cherche une carte "=>" dont
	 * la partie gauche est elle-même une carte "=>" menant à l'objectif recherché.
	 */
	let fallback = null;
	game.forEach((deck, decki) => {
		deck.forEach((card, cardi) => {
			if (card.color === null && card.link === "=>")
			{
				if (card.left.color === null &&
					card.left.link === "=>" &&
					card.left.left.equals(objectif))
				{
					fallback = [decki, cardi];
				}
			}
		});
	});

	return { cardHelp: fallback, cardHelp2: null };
}