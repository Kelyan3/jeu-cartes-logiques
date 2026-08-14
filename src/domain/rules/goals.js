/**
 * Supprime la carte à l'indice indiceCard du deck et réindexe les cartes suivantes
 * (chaque id décrémenté du nombre de suppressions déjà effectuées).
 *
 * @param {Card[]} deck
 * @param {number} indiceCard
 *
 * @returns {Card[]} le nouveau deck (sans la carte supprimée)
 */
export function delCard(deck, indiceCard)
{
	// Le deck que l'on va retourner
	let finalDeck = [];
	deck[indiceCard].setDel(true);

	// Supprime la carte en la passant null
	deck[indiceCard] = null;

	let cpt = 0;

	// Recopie le deck sauf la carte qui vaut null
	for (let i = 0; i < deck.length; i++)
	{
		if (deck[i] !== null)
		{
			let tmpCard = deck[i];
			tmpCard.id = tmpCard.id - cpt;
			finalDeck.push(tmpCard);
		}
		else
			cpt++;
	}

	// Retourne le nouveau deck
	return finalDeck;
}

/**
 * Supprime le deck à l'indice indiceDeck du tableau de jeu.
 *
 * @param {Card[][]} currentGame
 * @param {number} indiceDeck
 *
 * @returns {Card[][]} le nouveau tableau de jeu (sans le deck supprimé)
 */
export function delDeck(currentGame, indiceDeck)
{
	// Le tableau du jeu que l'on va retourner
	let finalGame = [];

	// Supprime le deck en le passant null
	currentGame[indiceDeck] = null;

	// Recopie le jeu sauf le deck qui vaut null
	for (let i = 0; i < currentGame.length; i++)
	{
		if (currentGame[i] !== null)
			finalGame.push(currentGame[i]);
	}

	// Retourne le nouveau jeu
	return finalGame;
}

/**
 * Supprime du deck toutes les cartes égales à cardToDelete et réindexe les id.
 *
 * @param {Card[]} deck
 * @param {Card} cardToDelete
 *
 * @returns {Card[]} le nouveau deck
 */
export function delCardWithEquals(deck, cardToDelete)
{
	// Le deck que l'on va retourner
	let finalDeck = [];

	// Supprime la carte en la passant null
	let cpt = 0;

	// Recopie le deck sauf la carte qui vaut null
	for (let i = 0; i < deck.length; i++)
	{
		if (!deck[i].equals(cardToDelete))
		{
			let tmpCard = deck[i];
			tmpCard.id = tmpCard.id - cpt;
			finalDeck.push(tmpCard);
		}
			else cpt++;
	}

	// Retourne le nouveau deck
	return finalDeck;
}

/**
 * Indique si card est un "sous-objectif" valide du deck : s'il existe dans deck
 * une carte "=>" dont la partie droite est égale à card.
 *
 * @param {Card[]} deck
 * @param {Card} card
 *
 * @returns {boolean}
 */
export function checkSubObj(deck, card)
{
	let res = false;
	deck.forEach((elem) => {
		if (elem.link === "=>" && elem.right.equals(card))
			res = true;
	});

	return res;
}

/**
 * Crée le tableau tabObjectif en fonction des objectifs présents dans tmp.
 *
 * @param {Card[][]} tmp - tableau du jeu temporaire
 *
 * @returns {Array[]} le tableau des objectifs, sous la forme [numero objectif, indice de la carte, (numero != indice)]
 */
export function CreatTabObj(tmp)
{
	// Création du tableau que l'on va affecter à tabObjectif
	let tmpObj = [];

	// Push l'objectif principal
	tmpObj.push([0, 0, false]);

	/**
	 * Parcourt le deck d'objectif à la recherche d'une carte simple qui n'est pas l'objectif principal.
	 * S'il y a en a une elle est ajouté au tableau.
	 */
	tmp[tmp.length - 1].forEach((element, index) => {
		if (index !== 0)
		{
			if (checkSubObj(tmp[tmp.length - 1], element))
				tmpObj.push([tmpObj.length, index, true]);
		}
	});

	return tmpObj;
}

/**
 * Cherche parmi les cartes du deck d'objectif de tmp s'il y a une carte "=>" dont
 * la partie droite est égale à cardObj.
 *
 * @param {Card} cardObj
 * @param {Card[][]} tmp - tableau du jeu (le paramètre est désormais obligatoire :
 *                         l'ancien défaut sur `game` a été retiré car jamais utilisé)
 *
 * @returns {number} l'indice de la carte trouvée dans le deck d'objectif, ou -1 si non trouvée
 */
export function findObjectifRelative(cardObj, tmp)
{
	// Variable que l'on va retourner (-1 si il trouve pas)
	let num = -1;

	// Deck de l'objectif
	let deck = tmp.length - 1;

	/**
	 * Cherche parmi les cartes de l'objectif s'il y a une carte dont la partie droite
	 * est égale à la carte envoyée en paramètre.
	 * Si oui {@link num} prend la valeur de l'index de cette carte.
	 */
	tmp[deck].forEach((element, index) => {
		// Vérifie si la couleur est null (si elle est null la carte est au moins double)
		if (element !== null && element.color === null)
		{
			if (element.right.equals(cardObj))
				num = index;
		}
	});

	// Retourne -1 ou la place de la carte
	return num;
}

/**
 * Remplace les symboles logiques bruts (^, non, <=>, =>, ∨) par leur représentation
 * unicode espacée, pour l'affichage.
 *
 * @param {string} str
 *
 * @returns {string}
 */
export function stringToLogicText(str)
{
	str = str.replaceAll("^", " ∧ ");
	str = str.replaceAll("non", " ¬ ");
	str = str.replaceAll("<=>", " ⇔ ");
	str = str.replaceAll("=>", " ⇒ ");
	str = str.replaceAll("∨", " ∨ ");

	return str;
}

/**
 * Indique si le deck objectif contient déjà, sous une forme compatible, la carte
 * (deck, card) en tant que sous-objectif potentiel : sa partie gauche (cas général),
 * ou sa partie droite/gauche si elle est "⟺" (double flèche), ou sa partie droite
 * si le deck passé est lui-même le deck objectif.
 *
 * @param {Card[][]} game
 * @param {number} deck - indice du deck de la carte à vérifier
 * @param {number} card - indice de la carte à vérifier dans ce deck
 *
 * @returns {boolean}
 */
export function deckContain(game, deck, card)
{
	// Variable que l'on va retourner (false par défaut)
	let bool = false;
	if (game[deck][card].color !== null)
		return false;

	let cardIsDoubleArrow = game[deck][card].isDoubleArrow();

	// Parcourt le deck objectif
	game[game.length - 1].forEach((element) => {
		// Si le deck passé en paramètre est l'objectif
		if (deck === game.length - 1)
		{
			/**
			 * S'il y a une carte dans les objectifs qui est égale à la partie droite
			 * de la carte que l'on a passé en paramètre.
			 */
			if (game[deck][card].link === "=>" && element.equals(game[deck][card].right))
				bool = true;

			if (cardIsDoubleArrow && (element.equals(game[deck][card].right) || element.equals(game[deck][card].left)))
				bool = true;
		}
		else
		{
			/**
			 * S'il y a une carte dans les objectifs qui est égale à la partie gauche
			 * de la carte que l'on a passé en paramètre.
			 */
			if (element.equals(game[deck][card].left))
				bool = true;
		}
	});

	return bool;
}