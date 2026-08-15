/**
 * Parcourt le deck passé en paramètre (tmp[deckId]) et regarde s'il existe une carte qui est égale à la
 * carte passée en paramètre.
 *
 * @param {Card[][]} tmp - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckId - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {boolean} true si une carte égale existe dans ce deck
 */
export function containCard(tmp, deckId, card)
{
	return tmp[deckId].some((cardElement) => cardElement.equals(card));
}

/**
 * Comme {@link containCard}, mais utilise Card.equalsSymmetric() plutôt que
 * Card.equals() : reconnaît une carte "<=>" déjà présente dans le deck même si
 * elle y est écrite dans l'ordre inverse (P<=>Q reconnue comme identique à Q<=>P).
 * Utilisée uniquement par la variante "symétrique" du bouton Transitivité.
 *
 * @param {Card[][]} tmp - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckId - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {boolean} true si une carte égale (au sens large) existe dans ce deck
 */
export function containCardSymmetric(tmp, deckId, card)
{
	return tmp[deckId].some((cardElement) => cardElement.equalsSymmetric(card));
}

/**
 * Parcourt le deck passé en paramètre (tmp[deckId]) et regarde s'il existe une carte qui est égale à la
 * carte passée en paramètre.
 *
 * @param {Card[][]} tmp - tableau du jeu (ou d'une copie temporaire)
 * @param {number} deckId - indice du deck dans lequel chercher
 * @param {Card} card - la carte à trouver
 *
 * @returns {number} -1 si la carte n'est pas dans le deck, sinon son indice
 */
function getIndice(tmp, deckId, card) {
	let num = -1;
	tmp[deckId].forEach((cardElement, index) => {
		if (cardElement.equals(card))
			num = index;
	});

	return num;
}

/**
 * Renvoie le numéro de l'objectif associé à l'indice de la carte dans le deck objectif.
 *
 * @param {Array} tabObjectif - tableau des objectifs (voir Game.jsx pour le format exact)
 * @param {number} objectif - indice de la carte de l'objectif que l'on cherche dans le deck
 *
 * @returns {number} le numéro de l'objectif (0 = objectif principal, par défaut)
 */
function getNumObjectif(tabObjectif, objectif)
{
	let result = 0;
	tabObjectif.forEach((element) => {
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
 * @param {Card} cardObjectif - la carte que l'on veut obtenir
 *
 * @returns {boolean}
 */
function isObtainableEt(card, cardObjectif)
{
	if (card.color !== null || card.link !== "et")
		return false;

	return card.left.equals(cardObjectif) || card.right.equals(cardObjectif);
}

/**
 * Teste une carte pour voir si on peut obtenir la carte objectif en utilisant la liaison "=>",
 * en descendant uniquement dans des chaînes d'implications (et éventuellement un "et" terminal).
 *
 * @param {Card} card - la carte que l'on teste
 * @param {Card} cardObjectif - la carte que l'on veut obtenir
 *
 * @returns {boolean}
 */
function isObtainableImplique(card, cardObjectif)
{
	if (card.color !== null || card.link !== "=>")
		return false;

	if (card.right.equals(cardObjectif))
		return true;

	return isObtainableImplique(card.right, cardObjectif) || isObtainableEt(card.right, cardObjectif);
}

/**
 * Indique si une carte "et" contient, dans l'un de ses côtés, un chemin vers la carte objectif
 * (implication, "et" imbriqué, ou égalité directe). Sert à détecter qu'il faut d'abord séparer
 * cette carte pour exposer le sous-terme utile.
 *
 * @param {Card} card
 * @param {Card} cardObjectif
 *
 * @returns {boolean}
 */
function isEtLeadingTo(card, cardObjectif)
{
	if (card.color !== null || card.link !== "et")
		return false;

	if (card.left.equals(cardObjectif) || card.right.equals(cardObjectif))
		return true;

	return (
		isObtainableImplique(card.left, cardObjectif) ||
		isObtainableImplique(card.right, cardObjectif) ||
		isObtainableEt(card.left, cardObjectif) ||
		isObtainableEt(card.right, cardObjectif) ||
		isEtLeadingTo(card.left, cardObjectif) ||
		isEtLeadingTo(card.right, cardObjectif)
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
	const tmp = [];
	for (let i = 0; i < game.length; i++)
	{
		tmp[i] = [];
		for (let j = 0; j < game[i].length; j++)
		{
			tmp[i].push(game[i][j].copy());
		}
	}

	return tmp;
}

/**
 * Regarde si la carte passée en paramètre existe dans le jeu reçu, en dehors du deck objectif.
 *
 * @param {Card[][]} game
 * @param {Card} cardTest - la carte que l'on cherche
 *
 * @returns {boolean}
 */
function cardExistsInGame(game, cardTest)
{
	let result = false;
	game.forEach((deck, index) => {
		deck.forEach((card) => {
			if (index !== game.length - 1 && card.equals(cardTest))
				result = true;
		});
	});

	return result;
}

/**
 * Cherche la position [deck, carte] d'une carte égale à cardTest hors du deck objectif.
 *
 * @param {Card[][]} game
 * @param {Card} cardTest
 *
 * @returns {[number, number]|null}
 */
function findCardPos(game, cardTest)
{
	for (let d = 0; d < game.length - 1; d++)
	{
		for (let c = 0; c < game[d].length; c++)
		{
			if (game[d][c].equals(cardTest))
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
 * @param {Card[][]} tmp - tableau du jeu temporaire (sera modifié pendant la recherche)
 * @param {Card} cardTest - la dernière carte trouvée pour aller à l'objectif
 * @param {number} deckId - indice du deck de la dernière carte trouvée pour aller à l'objectif
 * @param {number} deckObjectif - numéro de l'objectif
 * @param {Array} chemin - le chemin de cartes actuel : [tableau des étapes, solution trouvée ou non]
 * @param {Array} tabObjectif - tableau des objectifs du jeu (voir Game.jsx)
 *
 * @returns {Array} le chemin mis à jour
 */
function recursiveSoluce(tmp, cardTest, deckId, deckObjectif, chemin, tabObjectif)
{
	chemin[1] = false;

	let tmpChemin;
	let deckIndex = 0;

	if (cardTest.link === "et" && !containCard(tmp, deckObjectif, cardTest))
	{
		if (containCard(tmp, deckId, cardTest))
			chemin[0].push([deckId, tabObjectif[deckObjectif][1]]);

		tmpChemin = [...recursiveSoluce(tmp, cardTest.left, deckIndex, deckObjectif, chemin, tabObjectif),];
		chemin = [...tmpChemin];

		if (chemin[1])
		{
			tmp = copyGameArray(tmp);
			tmpChemin = [...recursiveSoluce(tmp, cardTest.right, deckIndex, deckObjectif, chemin, tabObjectif),];
			chemin = [...tmpChemin];
		}
	}

	if (!chemin[1] && deckId === tmp.length - 1 && cardTest.link === "=>")
	{
		tmp.splice(tmp.length - 1, 0, []);
		tmp[tmp.length - 2].push(cardTest.left.copy());
		tmp[tmp.length - 1].push(cardTest.right.copy());
		chemin[0].push([tmp.length - 1, tmp[tmp.length - 1].length - 1]);
		tmpChemin = [...recursiveSoluce(
			tmp,
			tmp[tmp.length - 1][tmp[tmp.length - 1].length - 1],
			tmp.length - 1,
			deckObjectif + 1,
			chemin,
			tabObjectif
		),];

		chemin = [...tmpChemin];
		if (chemin[1])
			tmp[deckObjectif].push(cardTest.copy());
	}

	if (!chemin[1])
	{
		tmp
			.slice()
			.reverse()
			.forEach((deck, i) => {
				deckIndex = tmp.length - 1 - i;
				deck.forEach((card, cardIndex) => {
					if (deckObjectif >= deckIndex)
					{
						if (!chemin[1] && deckIndex !== tmp.length - 1 && deckIndex <= deckObjectif && containCard(tmp, deckIndex, cardTest))
						{
							chemin[1] = true;
							if (chemin[0].length === 0 ||
								!tmp[chemin[0][chemin[0].length - 1][0]][chemin[0][chemin[0].length - 1][1]].equals(cardTest))
							{
								chemin[0].push([deckIndex, getIndice(tmp, deckIndex, cardTest)]);
							}
						}

						if (!chemin[1] && deckIndex !== tmp.length - 1 && isObtainableImplique(card, cardTest))
						{
							if (card.right.color === null)
							{
								if (card.right.link === "=>")
								{
									tmpChemin = [...recursiveSoluce(tmp, card.right.left, deckIndex, deckObjectif, chemin, tabObjectif),];
									chemin = [...tmpChemin];
								}
							}
							else
								chemin[1] = true;

							if (chemin[1])
							{
								chemin[0].push([deckIndex, cardIndex]);
								tmpChemin = [...recursiveSoluce(tmp, card.left, deckIndex, deckObjectif, chemin, tabObjectif),];
								chemin = [...tmpChemin];
							}

							if (!chemin[1])
							{
								if (card.color === null && card.left && card.left.link === "=>")
								{
									tmp[tmp.length - 1].push(card.left.copy());
									tmpChemin = [...recursiveSoluce(tmp, card.left, tmp.length - 1, deckObjectif, chemin, tabObjectif),];
									chemin = [...tmpChemin];
								}
							}
						}

						if (!chemin[1] && deckIndex !== tmp.length - 1 && isObtainableEt(card, cardTest))
						{
							chemin[0].push([deckIndex, cardIndex]);

							if (!containCard(tmp, deckId, card.right))
								tmp[deckId].push(card.right.copy());

							if (!containCard(tmp, deckId, card.left))
								tmp[deckId].push(card.left.copy());

							tmpChemin = [...recursiveSoluce(tmp, cardTest, deckIndex, deckObjectif, chemin, tabObjectif),];
							chemin = [...tmpChemin];
						}

						if (!chemin[1] && deckIndex !== tmp.length - 1 && isEtLeadingTo(card, cardTest))
						{
							const leftHelps =
								card.left.equals(cardTest) ||
								isObtainableImplique(card.left, cardTest) ||
								isObtainableEt(card.left, cardTest) ||
								isEtLeadingTo(card.left, cardTest);

							const rightHelps =
								card.right.equals(cardTest) ||
								isObtainableImplique(card.right, cardTest) ||
								isObtainableEt(card.right, cardTest) ||
								isEtLeadingTo(card.right, cardTest);

							const usefulAlreadyPresent =
								(leftHelps && cardExistsInGame(tmp, card.left)) ||
								(rightHelps && cardExistsInGame(tmp, card.right));

							if (!usefulAlreadyPresent)
							{
								chemin[0].push([deckIndex, cardIndex]);
								const tmp2 = copyGameArray(tmp);

								if (!containCard(tmp2, deckIndex, card.left))
									tmp2[deckIndex].push(card.left.copy());

								if (!containCard(tmp2, deckIndex, card.right))
									tmp2[deckIndex].push(card.right.copy());

								tmpChemin = [...recursiveSoluce(tmp2, cardTest, deckIndex, deckObjectif, chemin, tabObjectif),];
								chemin = [...tmpChemin];
							}
						}
					}
				});
			});
	}

	return chemin;
}

/**
 * Cherche le prochain coup qui amène à finir l'exercice, à partir de l'état actuel du jeu.
 *
 * @param {Card[][]} game - le jeu actuel (state `game` de Game.jsx)
 * @param {Array} tabObjectif - le tableau des objectifs actuel (state `tabObjectif` de Game.jsx)
 *
 * @returns {{cardHelp: [number, number]|null, cardHelp2: [number, number]|null}}
 *          Position(s) [indiceDeck, indiceCarte] de la ou des cartes à mettre en surbrillance,
 *          ou null si aucune suggestion n'a pu être trouvée pour l'une d'entre elles.
 */
export function computeNextMove(game, tabObjectif)
{
	const tmp = copyGameArray(game);
	const chemin = [[], false];
	const deckId = tmp.length - 1;
	const cardId = tmp[tmp.length - 1].length - 1;
	const objectif = tmp[deckId][cardId];
 
	// Rien à suggérer s'il n'y a pas (encore) d'objectif, par exemple en mode Création.
	if (objectif === undefined)
		return { cardHelp: null, cardHelp2: null };

	const result = recursiveSoluce(tmp, objectif, deckId, getNumObjectif(tabObjectif, cardId), chemin, tabObjectif);
	const affiche = [...result[0]].reverse();

	/**
	 * Vérifie qu'une position [deck, carte] pointe bien vers une carte existante dans le jeu actuel
	 * (le chemin trouvé porte sur la copie `tmp`, qui a pu évoluer différemment du jeu réel).
	 */
	const safePos = (pos) => {
		if (pos === undefined)
			return undefined;

		const [d, c] = pos;
		return game[d] !== undefined && game[d][c] !== undefined ? pos : undefined;
	}

	// Cas où l'objectif "=>" vient tout juste d'obtenir son propre deck (rien à séparer avant).
	if (objectif.link === "=>" && game.length === tabObjectif.length + 1)
		return { cardHelp: [deckId, cardId], cardHelp2: null };

	for (let i = 0; i < affiche.length; i++)
	{
		const pos = safePos(affiche[i]);
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
	const pos1 = safePos(affiche[0]);
	const pos2 = safePos(affiche[1]);
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