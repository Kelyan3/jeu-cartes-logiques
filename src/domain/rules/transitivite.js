import Card from "../Card";
import { containCardSymmetric } from "../gameSolver";


/**
 * Vérifie la sélection commune aux 3 variantes du bouton Transitivité : exactement
 * 2 cartes sélectionnées, ni l'une ni l'autre dans le deck objectif.
 *
 * @returns {[number, Card, Card]|null} [finalDeck, card1, card2], ou null si la
 * sélection n'est pas valide (un message d'erreur a alors déjà été affiché).
 */
function getTransitiviteSelection(deps)
{
	const { nbSelec, selecDeck1, selecDeck2, selecCard1, selecCard2, game, error } = deps;

	if (nbSelec !== 2)
	{
		error("Vous devez sélectionner deux cartes !");
		return null;
	}

	// Prend le deck le plus grand
	let finalDeck = Math.max(selecDeck1, selecDeck2);
	if (finalDeck === game.length - 1)
	{
		error("Vous ne pouvez pas utiliser une carte de l'objectif avec ce bouton !");
		return null;
	}

	return [finalDeck, game[selecDeck1][selecCard1], game[selecDeck2][selecCard2]];
}

/**
 * Ajoute la carte déduite par transitivité au deck (sauf si skipAdd, pour le cas
 * où un doublon a déjà été détecté en amont), puis vérifie la victoire. Factorisé
 * car identique pour les 3 variantes, seuls le symbole affiché et cardToAdd changent.
 */
function finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, sign, skipAdd, deps)
{
	const { game, addToGame, isWin } = deps;

	let tmp = [...game];
	if (!skipAdd)
		addToGame(tmp, finalDeck, cardToAdd, false);

	// Vérifie si l'exercice est fini, si oui affiche le popup de victoire
	isWin(
		[
			[
				"Par transitivité, on a : ",
				cardLeft.copy(),
				` ${sign} `,
				cardMiddle.copy(),
				` ${sign} `,
				cardRight.copy(),
				".",
			],
		],
		[0],
		tmp
	);
}

/**
 * Variante "=>" : combine 2 cartes "A⇒B" et "B⇒C" (sélectionnées dans n'importe
 * quel ordre) pour en déduire "A⇒C".
 */
function transitiviteArrow(deps)
{
	const { game, error } = deps;

	const selection = getTransitiviteSelection(deps);
	if (selection === null)
		return;
	const [finalDeck, card1, card2] = selection;

	if (card1.link !== "=>" || card2.link !== "=>")
	{
		error('Les 2 cartes sélectionnées doivent avoir une liaison "=>" !');
		return;
	}

	let cardLeft, cardMiddle, cardRight, cardToAdd;
	if (card1.left.equals(card2.right))
	{
		cardRight = card1.right;
		cardLeft = card2.left;
		cardMiddle = card1.left;
		cardToAdd = new Card(game[finalDeck].length, null, false, "=>", card2.left.copy(), card1.right.copy());
	}
	else if (card1.right.equals(card2.left))
	{
		cardRight = card2.right;
		cardLeft = card1.left;
		cardMiddle = card2.left;
		cardToAdd = new Card(game[finalDeck].length, null, false, "=>", card1.left.copy(), card2.right.copy());
	}
	else
	{
		error("Vous ne pouvez pas utiliser ce bouton avec ces cartes !");
		return;
	}

	finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, "=>", false, deps);
}

/**
 * Variantes "<=>" (symétrique ou non) : combine 2 cartes "A<=>B" et "B<=>C" pour
 * en déduire "A<=>C".
 *
 * @param {boolean} symmetric - si true, "B<=>C" et "C<=>B" sont considérées comme
 * la même carte (voir Card.equalsSymmetric) : le terme commun entre les 2 cartes
 * sélectionnées est cherché parmi les 4 combinaisons possibles (au lieu des 2
 * combinaisons historiques en mode non symétrique), et la détection de doublon
 * avant ajout reconnaît les deux écritures d'une même équivalence.
 */
function transitiviteEquiv(symmetric, deps)
{
	const { game, error } = deps;

	const selection = getTransitiviteSelection(deps);
	if (selection === null)
		return;
	const [finalDeck, card1, card2] = selection;

	if (!card1.isDoubleArrow() || !card2.isDoubleArrow())
	{
		error('Les 2 cartes sélectionnées doivent avoir une liaison "<=>" !');
		return;
	}

	// Les 2 "bouts" de chaque équivalence : card.left.left <=> card.left.right
	const ends1 = [card1.left.left, card1.left.right];
	const ends2 = [card2.left.left, card2.left.right];

	// [i, j] = quel bout de card1 est comparé à quel bout de card2. Les 2
	// premières combinaisons sont celles de la version d'origine à bouton
	// unique (ordre de priorité conservé) ; les 2 suivantes ne sont essayées
	// qu'en mode symétrique.
	const combos = symmetric ? [[1, 0], [0, 1], [0, 0], [1, 1]] : [[1, 0], [0, 1]];

	let cardLeft, cardMiddle, cardRight;
	for (const [i, j] of combos)
	{
		if (ends1[i].equals(ends2[j]))
		{
			cardMiddle = ends1[i];
			cardLeft = ends1[1 - i];
			cardRight = ends2[1 - j];
			break;
		}
	}

	if (cardLeft === undefined)
	{
		error("Vous ne pouvez pas utiliser ce bouton avec ces cartes !");
		return;
	}

	const cardToAdd = new Card(
		game[finalDeck].length,
		null,
		false,
		"et",
		new Card(0, null, false, "=>", cardLeft.copy(), cardRight.copy()),
		new Card(0, null, false, "=>", cardRight.copy(), cardLeft.copy())
	);

	const isDuplicate = symmetric && containCardSymmetric(game, finalDeck, cardToAdd);
	finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, "<=>", isDuplicate, deps);
}

/**
 * Fonction appelée après avoir choisi une des 3 options du menu "Transitivité".
 *
 * @param {"arrow"|"equiv"|"equiv_sym"} variant
 *   "arrow"     : combine 2 cartes "=>" en une nouvelle carte "=>".
 *   "equiv"     : combine 2 cartes "<=>" en une nouvelle carte "<=>" (recherche
 *                 stricte du terme commun, comme la version d'origine à bouton unique).
 *   "equiv_sym" : comme "equiv", mais traite "P<=>Q" et "Q<=>P" comme la même carte
 *                 (recherche élargie du terme commun + détection de doublon adaptée).
 *
 * @param {Object} deps
 * @param {boolean} deps.navigation
 * @param {boolean} deps.win
 * @param {number} deps.nbSelec
 * @param {number} deps.selecDeck1
 * @param {number} deps.selecDeck2
 * @param {number} deps.selecCard1
 * @param {number} deps.selecCard2
 * @param {Card[][]} deps.game
 * @param {Function} deps.error
 * @param {Function} deps.addToGame
 * @param {Function} deps.isWin
 */
export function runTransitivite(variant, deps)
{
	const { navigation, win } = deps;

	if (navigation || win)
		return;

	if (variant === "arrow")
		transitiviteArrow(deps);
	else if (variant === "equiv")
		transitiviteEquiv(false, deps);
	else if (variant === "equiv_sym")
		transitiviteEquiv(true, deps);
}