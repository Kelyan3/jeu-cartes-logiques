import { useState, useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import Deck from "./Deck";
import Popup from "./Popup";
import LogicText from "./LogicText";

import Card from "../class/Card";
import { GameTab } from "../context/GameTab";
import { useAuth } from "../hooks/authHooks";
import { API_BASE_URL as API } from "../config/api";

import { containCard, computeNextMove } from "../utils/gameSolver";


/**
 * Transforme un objet JSON en instance {@link Card}.
 * 
 * @param {JSON} obj - information mimimum pour créer une carte :
 *                     Carte simple = juste la couleur ;
 *                     Carte complexe = les 2 cartes qui la compose & la liaison
 * @param {number} i - numéro de l'id
 * 
 * @returns {Card} une carte
 */
const toClass = (obj, i) => {
	// Si c'est une carte complexe
	if (obj.color === undefined)
		return new Card(i, null, false, obj.link, toClass(obj.left, 0), toClass(obj.right, 1), true, false );
	// Si c'est une carte simple
	else
		return new Card(i, obj.color, false, "", null, null, true, false);
};

/**
 * Reçoit un tableau d'un fichier JSON à qui on va appliquer la méthode {@link JSON.parse()} dans {@link openFile()}
 * ({@link JSON} ⇒ tableau d'{@link Object}) et renvoie un tableau qui peut être lu par notre site.
 * 
 * @param {Object[]} data - tableau d'objets qui va servir pour l'initialisation
 * 
 * @returns {Card[][]} un tableau de decks qui constitue le jeu
 */
const gameInput = (data) => {
	// Tableau que l'on va retourner
	let res = [[], []];

	// id de la future carte
	let i = 0;

	// Création du deck de départ
	data[0].forEach((element) => {
		res[0].push(toClass(element, i));
		i++;
	});

	i = 0;

	// Création du deck objectif
	data[1].forEach((element) => {
		res[1].push(toClass(element, i));
		i++;
	});

	// Retourne le tableau du jeu
	return res;
};

/**
 * Calcule l'état de jeu initial (deck de départ + objectif, et première ligne de
 * démonstration) à partir des données JSON d'un exercice.
 * 
 * @param {Object|undefined} ex - données JSON de l'exercice (undefined tant que non chargé)
 * @param {"Play"|"Tutorial"|"Create"} mode
 *
 * @returns {{game: Card[][], demonstration: Array}}
 */
function buildInitialGameSetup(ex, mode)
{
	if (mode === "Create")
		return { game: tagDecks([[], []]), demonstration: [] };

	if (ex === undefined)
		return { game: tagDecks([[]]), demonstration: [] };

	try
	{
		const tmp = gameInput(ex);
		let res = [];
		tmp[0].forEach((element) => {
			res.push("On a ");
			res.push(element.copy());
			res.push(". ");
		});

		if (tmp.length === 2 && tmp[1].length > 0)
		{
			res.push("Montrons ");
			res.push(tmp[1][0].copy());
			res.push(".");
		}

		/**
		 * Équivalent à addLineDemonstration([res], [0], 0, true) : voir la fonction
		 * addLineDemonstration pour le détail du format [indentation, message].
		 */
		return { game: tagDecks(tmp), demonstration: [[0, res]] };
	}
	catch (error)
	{
		console.error("Erreur lors du chargement de l'exercice :", error);
		return { game: tagDecks([[]]), demonstration: [] };
	}
}

/**
 * Renvoie le message tutoriel à afficher au chargement d'un niveau, selon son numéro
 * (indépendant du mode, comme dans le comportement d'origine).
 * 
 * @param {number} numero
 *
 * @returns {string|string[]} "" si aucun message n'est associé à ce numéro.
 */
function buildInitialTutorialMessage(numero)
{
	switch (numero)
	{
		case 0:
			return [
				"Le but du jeu est de réussir à créer la carte qui est dans l'objectif dans le premier deck.",
				"Vous pouvez sélectionner une carte en cliquant dessus.",
			];

		case 1:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Implique".',
				"Ce bouton a besoin de deux cartes pour fonctionner.",
				"Sélectionnez deux cartes.",
			];

		case 2:
			return [
				'Dans ce niveau nous allons apprendre le quatrième bouton "Fusion".',
				"Ce bouton a besoin de deux cartes pour fonctionner.",
				"Sélectionnez deux cartes.",
			];

		case 3:
			return [
				'Dans ce niveau nous allons apprendre le bouton "+ Objectif".',
				"Pour faire fonctionner ce bouton on doit sélectionner l'objectif.",
			];

		case 4:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Transitivité" avec le connecteur "⟹", le bouton "Affichage Simplifié", ainsi que le fonctionnement de la carte blanche.',
				'Cliquer sur le bouton "Affichage Simplifié" pour faire apparaître la carte blanche. Lorsqu’on l’obtient, la partie est gagnée qu’importe l’objectif.',
				'Ensuite, le bouton "Transitivité" a besoin de deux cartes avec un connecteur "⟹" pour fonctionner. Il faut que ces cartes soient de la même forme que dans le symbole du bouton.',
				'On obtient alors une carte avec le connecteur "⟹".',
				"Sélectionnez deux cartes.",
			];

		case 5:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Transitivité" avec le connecteur "⟺".',
				'Il fonctionne de la même manière qu’avec le connecteur "⟹", il faut que les cartes sélectionnées soient de la même forme que dans le symbole du bouton.',
				'On obtient alors une carte avec le connecteur "⟺".',
				"Sélectionnez deux cartes.",
			];

		case 6:
			return [
				'Dans ce niveau nous allons apprendre le bouton "Tiers Exclus".',
				'Il fonctionne avec une carte "¬(¬Rouge)" par exemple, qui est équivalente à la carte "Rouge ou Blanche", pour obtenir la carte "Rouge".',
				"Sélectionner une carte.",
			];

		default:
			return "";
	}
}

/**
 * Compteur global utilisé pour attribuer un identifiant stable
 * à chaque nouveau tableau "deck" (colonne), au moment de sa création.
 */
let deckIdCounter = 0;

/**
 * Attribue un id stable (non énumérable, donc invisible dans les boucles
 * `for...in`/`Object.keys`/`JSON.stringify`) à chaque deck du tableau de jeu
 * reçu qui n'en a pas encore un.
 * 
 * @param {Card[][]} game
 * 
 * @returns {Card[][]} le même tableau (pour un usage en chaîne avec setGame)
 */
function tagDecks(game)
{
	game.forEach((deck) => {
		if (deck.__deckId === undefined)
		{
			deckIdCounter += 1;
			Object.defineProperty(deck, "__deckId", {
				value: "deck-" + deckIdCounter,
				enumerable: false,
			});
		}
	});

	return game;
}

const Game = ({ mode, ex, numero, nbExo }) => {
	const { user } = useAuth();

	/**
	 * Calcule une fois pour toutes (au montage) l'état de jeu de départ pour cet exercice.
	 */
	const [initialSetup] = useState(() => buildInitialGameSetup(ex, mode));

	/**
	 * Tableau où sont réunies toutes les cartes & decks.
	 * Il est disposé de cette manière :
	 * ┌─────────────┬────────────────────┬───────────────┐
	 * │ Deck départ │ Deck sous-objectif │ Deck objectif │
	 * ├─────────────┼────────────────────┼───────────────┤
	 * │ game[0]     │ game[...]          │ game[n-1]     │
	 * ├─────────────┼────────────────────┼───────────────┤
	 * │ game[0][0]  │ game[...][0]       │ game[n-1][0]  │
	 * ├─────────────┼────────────────────┴───────────────┘
	 * │ game[0][1]  │
	 * ├─────────────┤
	 * │ game[0][2]  │
	 * └─────────────┘
	 * - game[0][0]   = une carte
	 * - game[...][0] = la partie gauche d'un objectif =>
	 * - game[n-1][0] = objectif principal
	 */
	const [game, setGame] = useState(initialSetup.game);

	/**
	 * Déplace le curseur de navigation clavier vers la carte indiquée, en désélectionnant
	 * visuellement la carte précédemment survolée.
	 *
	 * @param {number} indexDeck
	 * @param {number} indexCard
	 */
	const changeHover = (indexDeck, indexCard) => {
		const tmp = [...game];
		tmp[currentCardArrow[0]][currentCardArrow[1]].hover = false;
		tmp[indexDeck][indexCard].hover = true;
		setGame(tagDecks(tmp));
		setcurrentCardArrow([indexDeck, indexCard]);
	};

	const [currentCardArrow, setcurrentCardArrow] = useState(undefined);

	const [openFileJson, setOpenFileJson] = useState("");

	/**
	 * Le nombre de cartes sélectionnées.
	 */
	const [nbSelec, setNbSelec] = useState(0);

	/**
	 * Indice du deck de la 1ère carte sélectionnée
	 */
	const [selecDeck1, setSelecDeck1] = useState(-1);

	/**
	 * Indice de la carte dans le deck de la 1ère carte sélectionnée
	 */
	const [selecCard1, setSelecCard1] = useState(-1);

	/**
	 * Indice du deck de la 2ème carte sélectionnée
	 */
	const [selecDeck2, setSelecDeck2] = useState(-1);

	/**
	 * Indice de la carte dans le deck de la 2ème carte sélectionnée
	 */
	const [selecCard2, setSelecCard2] = useState(-1);

	const [cardHelp, setCardHelp] = useState(null);
	const [cardHelp2, setCardHelp2] = useState(null);

	/**
	 * Variable gérant le popup d'ajout de carte en mode création
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupAddCard, setPopupAddCard] = useState(false);

	/**
	 * Variable gérant le popup de suppression de carte en mode création.
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupDeleteCard, setPopupDeleteCard] = useState(false);

	/**
	 * Indice du deck dans lequel sera ajouté la carte en mode création avec le bouton "Ajout carte"
	 * ou en sélectionnant deux cartes en choisissant la liaison.
	 */
	const [indiceDeckAddCard, setIndiceDeckAddCard] = useState(0);

	/**
	 * Popup en mode création pour choisir la liaison quand deux cartes sont sélectionnées.
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupFusion, setPopupFusion] = useState(false);

	/**
	 * Popup quand on finit un exercice (objectif principal dans le deck 0).
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupWin, setPopupWin] = useState(false);

	// Tableau de sauvegarde de copie de l'ancien tableau "game"
	const [lastGame, setLastGame] = useState([]);

	/**
	 * Message à afficher en cas de coup illégal. Si le message est "" on affiche rien.
	 */
	const [messageErreur, setMessageError] = useState("");

	/**
	 * Message tutoriel à afficher en mode tutoriel.
	 * Attention c'est un tableau de strings.
	 * Si le message est "" on affiche rien.
	 */
	const [messageTutorial, setMessageTutorial] = useState(() => buildInitialTutorialMessage(numero));

	/**
	 * Tableau des objectifs.
	 * Sous cette forme : [numero objectif, indice de la carte dans le deck, (numero != indice)]
	 * Il se peut qu'il y ait des cartes entre les sous-objectifs comme dans l'exercice 5.
	 */
	const [tabObjectif, setTabObjectif] = useState([[0, 0, false]]);

	const [demonstration, setDemonstration] = useState(initialSetup.demonstration);

	const [indentationDemonstration, setIndentationDemonstration] = useState(0);

	const [tabIndiceDemonstration, setTabIndiceDemonstration] = useState([0]);

	const [navigation, setNavigation] = useState();

	const [win, setWin] = useState();

	const [savedGame, setSavedGame] = useState(initialSetup.game);

	const [tabIndentation, setTabIndentation] = useState([0]);

	const [affichageSimple, setAffichageSimple] = useState(true);

	/**
	 * Fonction de redirection fournie par react-router.
	 * Utilisation : navigate(url)
	 */
	const navigate = useNavigate();

	/**
	 * Renvoie un nouveau deck sans la carte passée en paramètre.
	 *
	 * @param {Card[]} deck - deck dans lequel il faut supprimer la carte
	 * @param {number} indiceCard - indice de la carte à supprimer
	 * @returns {Card[]} le deck sans la carte d'indice {@link indiceCard}
	 */
	const delCard = (deck, indiceCard) => {
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
	};

	/**
	 * Renvoie un nouveau tableau sans le deck passé en paramètre.
	 *
	 * @param {Card[][]} currentGame - tableau de la partie (avec potentiellement des modifications)
	 * @param {number} indiceDeck - indice du Deck à supprimer
	 *
	 * @returns {Card[][]} le jeu sans le deck d'indice {@link indiceDeck}
	 */
	const delDeck = (currentGame, indiceDeck) => {
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
	};

	/**
	 * La carte qui est déjà sélectionnée & celle qui est passée en paramètre utilisent la fonction {@link Card.select()}
	 * qui sélectionne toutes les cartes dans le Deck ou déselectionne la première carte sélectionnée si on reclique dessus.
	 * Enfin, si on sélectionne une 2ème carte, on appelle la fonction popup qui s'occupera de valider le choix & d'exécuter
	 * l'opération.
	 * 
	 * @param {number} i - index du deck
	 * @param {number} j - index de la carte
	 */
	const update = (i, j) => {
		if (!navigation && !win)
		{
			// Met le message d'erreur en "" ce qui ne l'affiche plus
			setMessageError("");

			setCardHelp(null);
			setCardHelp2(null);

			/**
			 * Copie du jeu dans tmp (copie aussi le deck concerné, pas seulement
			 * le tableau extérieur, pour ne pas modifier `game` avant setGame())
			 */
			let tmp = game.map((d, di) => (di === i ? [...d] : d));

			// La carte sur laquelle on a cliqué
			let currentCard = tmp[i][j];

			// Copie du nombre de carte sélectionnée
			let tmpNbselec = nbSelec;

			// Copie de la 1ère carte sélectionnée
			let tmpSelecDeck1 = selecDeck1;
			let tmpSelecCard1 = selecCard1;

			// Copie de la 2ème carte sélectionnée
			let tmpSelecDeck2 = selecDeck2;
			let tmpSelecCard2 = selecCard2;

			setAllCardOld(tmp);

			if (tmpSelecDeck1 === i && tmpSelecCard1 === j)
			{
				// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (1ère carte)
				tmpSelecCard1 = -1;
				tmpSelecDeck1 = -1;
				tmpNbselec--;
				currentCard.select(!currentCard.active);
			}
			else if (tmpSelecDeck2 === i && tmpSelecCard2 === j)
			{
				// Si la carte sélectionnée est déjà sélectionnée on la désélectionne (2ème carte)
				tmpSelecCard2 = -1;
				tmpSelecDeck2 = -1;
				tmpNbselec--;
				currentCard.select(!currentCard.active);
			}
			else if (tmpSelecDeck1 === -1 && tmpSelecCard1 === -1)
			{
				// Aucune carte n'est sélectionnée
				tmpSelecDeck1 = i;
				tmpSelecCard1 = j;
				tmpNbselec++;
				currentCard.select(!currentCard.active);
			}
			else if (tmpNbselec < 2)
			{
				// Une seule & unique carte est sélectionnée
				tmpSelecDeck2 = i;
				tmpSelecCard2 = j;
				tmpNbselec++;
				currentCard.select(!currentCard.active);
			}

			// Affecte toute les variables temporaires aux vraies variables
			setNbSelec(tmpNbselec);
			setSelecCard1(tmpSelecCard1);
			setSelecCard2(tmpSelecCard2);
			setSelecDeck1(tmpSelecDeck1);
			setSelecDeck2(tmpSelecDeck2);

			// On remet la carte dans le jeu avec les changements
			tmp[i][j] = currentCard;

			// On actualise le jeu
			setGame(tagDecks(tmp));

			// Affiche le popup de fusion en mode création si 2 cartes sont séléctionnées
			if (tmpNbselec === 2 && mode === "Create")
				setPopupFusion(true);

			// Affichage des tutoriels en fonction de l'exercice et du nombre de cartes sélectionnées
			if (mode === "Tutorial")
			{
				if (numero === 0)
				{
					setMessageTutorial([
						"Une fois une carte sélectionnée elle aura un contour noir et une surbrillance jaune.",
						"Vous pouvez utiliser les boutons au-dessus pour effectuer une action.",
						'Dans ce niveau nous allons apprendre le fonctionnement du bouton "Séparation".',
						"Ce bouton a besoin de deux conditions :",
						"- Une seule carte doit être sélectionnée ;",
						'- La carte doit avoir une liaison "et".',
						"Quand les conditions sont validées la partie gauche et droite de la carte sont ajoutées au deck.",
					]);
				}

				if (tmpNbselec === 2 && numero === 1)
				{
					setMessageTutorial([
						"Ce bouton a besoin de trois conditions :",
						"- Avoir deux cartes sélectionnées",
						'- Une des deux cartes doit avoir une liaison "=>"',
						'- La partie gauche de la carte avec la liaison "=>" doit être identique à l’autre carte',
						'Quand les conditions sont validées la partie droite de la carte avec la liaison "=>" est créée dans le deck.',
					]);
				}

				if (tmpNbselec === 2 && numero === 2)
				{
					setMessageTutorial([
						"Ce bouton a besoin de deux conditions :",
						"- Avoir deux cartes sélectionnées ;",
						"- Les deux cartes sélectionnées doivent comporter une ou deux cartes.",
						'Quand les conditions sont validées une nouvelle carte est créée avec les deux autres cartes sélectionnées et cette carte aura une liaison "et"',
					]);
				}

				if (tmpNbselec === 1 && numero === 3 && Math.max(tmpSelecDeck1, tmpSelecDeck2) === game.length - 1)
				{
					setMessageTutorial([
						"Ce bouton a besoin de deux conditions :",
						"- Une seule carte doit être sélectionnée ;",
						"- La carte sélectionnée doit être dans le deck des objectifs.",
						'La carte sélectionnée doit avoir une liaison "=>"',
						"Quand les conditions sont validées un objectif secondaire est créée, l’objectif secondaire est la partie droite de la carte sélectionnée, un deck est créée avec la carte qui est à gauche de la carte sélectionnée.",
					]);
				}
			}
		}
	};

	/**
	 * Marque toutes les cartes du tableau reçu comme "non nouvelles" (arrête l'animation d'apparition).
	 *
	 * @param {Card[][]} tmp - tableau du jeu temporaire
	 */
	const setAllCardOld = (tmp) => {
		try {
			tmp.forEach((e) => {
				e.forEach((s) => {
					s.setOld(false);
				});
			});
		} catch (error) {
			console.error(error);
		}
	};

	/**
	 * Désélectionne toutes les cartes dans le tableau reçu et devient le jeu.
	 *
	 * @param {Card[][]} tmp - tableau du jeu temporaire
	 */
	const allFalse = (tmp) => {
		// On désélectionne tout
		setNbSelec(0);
		setSelecCard1(-1);
		setSelecDeck1(-1);
		setSelecCard2(-1);
		setSelecDeck2(-1);

		// On désélectionne toutes les cartes du jeu passé en paramètre
		try
		{
			tmp.forEach((e) => {
				e.forEach((s) => {
					s.select(false);
				});
			});
		} catch (error) {
			console.error(error);
		}

		// On actualise le jeu
		setGame(tagDecks(tmp));
	};

	/**
	 * Désélectionne toutes les cartes du jeu.
	 */
	const allFalseGame = () => {
		// On désélectionne tout
		setNbSelec(0);
		setSelecCard1(-1);
		setSelecDeck1(-1);
		setSelecCard2(-1);
		setSelecDeck2(-1);

		// Copie du jeu actuel
		let tmp = [...game];

		// On désélectionne toutes les cartes du jeu actuel
		try
		{
			tmp.forEach((e) => {
				e.forEach((s) => {
					s.select(false);
				});
			});
		} catch (error) {
			console.error(error);
		}

		// On actualise le jeu
		setGame(tagDecks(tmp));
	};

	/**
	 * /!\ Attention cette fonction doit être uniquement appelée en mode Create ou pour faire des tests !
	 * Fait apparaître le popup qui nous demande la couleur de la carte qu'on veut ajouter.
	 *
	 * @param {number} deckIndice - l'indice du deck où l'on ajoute une carte
	 */
	const addCard = (deckIndice) => {
		// Indique dans quel deck on veut ajouter une carte
		setIndiceDeckAddCard(deckIndice);

		// Affiche le popup pour ajouter une carte simple
		setPopupAddCard(true);
	};

	/**
	 * /!\ Attention cette fonction doit être uniquement appelée en mode Create ou pour faire des tests !
	 * Crée une carte avec la couleur sélectionnée (ne ferme pas le popup quand on sélectionne une couleur).
	 *
	 * @param {Event} event - reçoit la couleur cliquée ({@link event.target.value}) ;
	 *                      - on le met à false si on veut faire plusieurs fois la même couleur ({@link event.target.checked})
	 */
	const choixCouleur = (event) => {
		// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
		saveGame();

		// Copie du jeu actuel
		let tmp = [...game];

		// Dé-check le bouton radio
		event.target.checked = false;

		// Ajoute la carte dans le deck (indiceDeckAddCard est affecté avant de rentrer dans la fonction)
		let cardToAdd = new Card(game[indiceDeckAddCard].length, event.target.value, false, "", null, null, true, false);
		if (!addToGame(tmp, indiceDeckAddCard, cardToAdd))
			return;

		// Actualise le jeu et désélectionne tout
		allFalse(tmp);
	};

	/**
	 * /!\ Attention cette fonction doit être uniquement appelée en mode Create ou pour faire des tests !
	 * Crée une carte complexe avec les 2 cartes sélectionnées (cette fonction est appelée à la fin de {@link update()} en mode création).
	 *
	 * @param {Event} event - reçoit la liaison cliquée ({@link event.target.value})
	 */
	const choixLiaison = (event) => {
		// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
		saveGame();

		// Copie du jeu actuel
		let tmp = [...game];

		// Dé-check le bouton radio
		event.target.checked = false;

		// Liaison reçu avec le bouton radio
		const l = event.target.value;

		// Copie les 2 cartes séléctionnées
		let c1 = game[selecDeck1][selecCard1].copy();
		let c2 = game[selecDeck2][selecCard2].copy();
		c1.id = 0;
		c2.id = 1;

		let cardToAdd;
		if (l === "<=>")
		{
			cardToAdd = new Card(
				game[selecDeck1].length, // id
				null, // color
				false, // active
				"et", // link
				new Card(0, null, false, "=>", c1.copy(), c2.copy()), // left
				new Card(0, null, false, "=>", c2.copy(), c1.copy()), // right
				true,
				false
			);
		}
		else if (l === "ou")
		{
			cardToAdd = new Card(
				game[selecDeck1].length, // id
				null, // color
				false, // active
				"=>", // link
				new Card(
					c1.id,
					null,
					false,
					"=>",
					c1,
					new Card(1, "white", false, null, null, null, true, false)
				), // left
				c2, // right
				true,
				false
			);
		}
		else
		{
			// Ajoute la carte fusionnée dans le deck de la 1ère carte séléctionnée
			cardToAdd = new Card(
				game[selecDeck1].length, // id
				null, // color
				false, // active
				l, // link
				c1, // left
				c2, // right
				true,
				false
			);
		}

		// Enlève le popup
		setPopupFusion(false);
		if (!addToGame(tmp, selecDeck1, cardToAdd))
			return;

		// Actualise le jeu et désélectionne tout
		allFalse(tmp);
	};

	/**
	 * /!\ Attention cette fonction doit être uniquement appelée en mode Create ou pour faire des tests !
	 * Supprime la carte qui est sélectionnée.
	 */
	const deleteCard = () => {
		// Enlève le popup
		setPopupDeleteCard(false);

		// Si la carte sélectionnée n'est pas la carte 1 : tout désélectionner
		if (!(selecCard1 === -1 && selecDeck1 === -1))
		{
			// Sauvegarde le jeu (utilisé pour pouvoir faire des retours en arrière)
			saveGame();

			// Copie du jeu actuel
			let tmp = [...game];

			// Supprime la carte
			tmp[selecDeck1] = delCard(game[selecDeck1], selecCard1);

			// Actualise le jeu et désélectionne tout
			allFalse(tmp);
		}
		else
			allFalseGame();
	};

	/**
	 * Ouvre la popup de confirmation avant de supprimer une carte.
	 * Si aucune carte n'est sélectionnée, désélectionne simplement tout
	 * (comme le faisait auparavant deleteCard() dans ce cas).
	 */
	const confirmDeleteCard = () => {
		if (selecCard1 === -1 && selecDeck1 === -1)
		{
			allFalseGame();
			return;
		}

		setPopupDeleteCard(true);
	};

	const returnNonCard = (tmp) => {
		let deckI = Math.max(selecDeck1, selecDeck2);
		let cardI = Math.max(selecCard1, selecCard2);
		const futureCardNon = tmp[deckI][cardI].copy();

		let cardToAdd = new Card(
			0,
			null,
			false,
			"=>",
			futureCardNon,
			new Card(1, "white", false, null, null, null, true, false),
			true,
			false
		);

		return cardToAdd;
	};
	
	/**
	 * Transforme la carte sélectionnée en sa version "négation" (ajoute une carte
	 * "carte => Faux" au deck), si une carte est bien sélectionnée.
	 */
	const transformIntoNonCard = () => {
		if (!(selecCard1 !== -1 && selecDeck1 !== -1))
		{
			allFalseGame();
			return;
		}

		saveGame();
		let tmp = [...game];

		if (!addToGame(tmp, selecDeck1, returnNonCard(tmp)))
			return;

		allFalse(tmp);
	};

	/**
	 * Transforme l'état actuel du jeu (game) en tableau d'objets ne contenant que les
	 * informations essentielles (couleur/liaison), prêt à être exporté en JSON.
	 *
	 * @returns {Object[][]} un tableau d'objets
	 */
	const gameOutput = () => {
		// Le tableau que l'on va retourner
		let res = [[], []];

		/**
		 * Transforme toutes les cartes en objets (avec seulement les informations essentielles).
		 * - la couleur ou liaison + left + right
		 * - la carte est ajoutée dans le tableau retourné
		 */
		game.forEach(function (deck, index) {
			deck.forEach(function (card) {
				res[index].push(card.toFile());
			});
		});

		// Retourne le tableau
		return res;
	};

	/**
	 * Télécharge l'état actuel du jeu au format JSON sur l'ordinateur de l'utilisateur.
	 */
	const saveAsFile = () => {
		// Variable de copie
		let res;

		// Copie JSON du jeu
		res = gameOutput(game);
		const blob = new Blob([JSON.stringify(res)], { type: "text/json;charset=utf-8;", });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		if (openFileJson !== "")
			link.download = openFileJson;
		else
			link.download = "output.json";

		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	};

	/**
	 * Ouvre un fichier JSON et l'affiche à l'écran.
	 *
	 * @param {Event} event - le bouton qui ouvre les fichiers ({@link event.target.files})
	 */
	const openFile = (event) => {
		// Vérifie que l'on a sélectionné un fichier
		if (event.target.files.length > 0)
		{
			// Variable pour lire le fichier
			let reader = new FileReader();
			setOpenFileJson(event.target.files[0].name);

			// Lit le fichier
			reader.onload = (event) => {
				// Transforme le fichier JSON en objet
				let obj = JSON.parse(event.target.result);

				// Mis à jour du jeu avec le fichier JSON reçu
				setGame(tagDecks(gameInput(obj)));
			};

			// Effectue la fonction onload juste au-dessus avec le 1er fichier reçu
			reader.readAsText(event.target.files[0]);
		}
	};

	/**
	 * Renvoie la place de l'objectif cherchée dans le tableau game[game.length-1].
	 *
	 * @param {Card} cardObj - la partie droite de l'objectif que l'on cherche
	 * @param {Card[][]} [tmp] - tableau du jeu à utiliser (par défaut : l'état actuel `game`)
	 *
	 * @returns {number} l'indice de l'objectif dans {@link game[game.length-1]}
	 */
	const findObjectifRelative = (cardObj, tmp) => {
		if (tmp === undefined)
			tmp = game;

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
	};

	function checkSubObj(deck, card)
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
	const CreatTabObj = (tmp) => {
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
	};

	const delCardWithEquals = (deck, cardToDelete) => {
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
	};

	/**
	 * Vérifie si un ou plusieurs objectifs sont validés par l'état actuel du jeu, et met à jour
	 * la partie en conséquence (ajout de cartes obtenues, suppression des objectifs résolus).
	 * Fonction récursive : si la résolution d'un objectif secondaire permet d'en valider un autre
	 * (imbriqué), elle se rappelle elle-même pour vérifier ce nouvel état.
	 *
	 * @param {Array} arrayMsg - messages de démonstration à compléter au fur et à mesure
	 * @param {Array} arrayIndent - indentations correspondant à arrayMsg
	 * @param {Card[][]} tmp - état du jeu à vérifier
	 * @param {boolean} [originel=true] - true s'il s'agit de l'appel initial (pas d'un appel
	 *                                     récursif interne) ; contrôle l'affichage de la démonstration
	 *                                     et du popup de victoire.
	 *
	 * @returns {[Card[][], boolean, Array, Array]} [état du jeu mis à jour, victoire ou non,
	 *                                               messages de démonstration, indentations]
	 */
	const isWin = (arrayMsg, arrayIndent, tmp, originel) => {
		if (originel === undefined)
			originel = true;

		let tmpTabObjectif = CreatTabObj(tmp);
		const listObjectif = [];
		for (let numObjectif of tmpTabObjectif)
			listObjectif.push([tmp[tmp.length - 1][numObjectif[1]], numObjectif,]);

		let bool = false;
		let modif = false;
		const checkWinForEveryObjectif = (cardArray) => {
			const cardObj = cardArray[0];
			const numDeckRef = cardArray[1][0];
			const checkWin = (card) => {
				if (card === null || card === undefined ||
					cardObj === null || cardObj === undefined)
				{
					return;
				}

				if (modif || bool)
					return;

				if (!card.equals(cardObj) && card.color !== "white" && !containCard(tmp, numDeckRef, cardObj))
					return;

				if (numDeckRef === 0)
				{
					bool = true;
					return;
				}

				modif = true;
				const findObj = findObjectifRelative(cardObj, tmp);
				if (findObj === -1)
					return;

				// Si c'est un objectif secondaire : copie de la carte qui a servi à créer l'objectif secondaire
				let tmpCard = tmp[tmp.length - 1][findObj].copy();

				// Ajoute cette carte dans le deck précédent
				if (!addToGame(tmp, numDeckRef - 1, tmpCard))
					return;

				// Supprime l'objectif secondaire
				tmp[tmp.length - 1] = delCardWithEquals(tmp[tmp.length - 1], cardObj);

				// Vérifie si l'objectif a un objectif lié
				if (findObj !== 0 && tmpTabObjectif[numDeckRef][2])
				{
					// Si oui supprime également l'objectif qui lui est lié
					tmp[tmp.length - 1] = delCard(tmp[tmp.length - 1], findObj);
				}

				// Supprime le deck qui a servi pour cet objectif secondaire
				tmp = delDeck(tmp, numDeckRef);

				// Met à jour la table des objectifs
				arrayMsg.push(["On a ", tmpCard.copy(), "."]);
				arrayIndent.push(-1);
			};

			tmp[numDeckRef].forEach(checkWin);
			if (numDeckRef !== 0)
				tmp[0].forEach(checkWin);

			return bool;
		};

		listObjectif.forEach((e) => {
			if (!bool && !modif)
				checkWinForEveryObjectif(e);
		});

		/**
		 * Objectifs secondaires issus d'un "et" (bouton Objectif sur (A=>B)∧(C=>D)) :
		 * ce sont des cartes "Montrons X" ajoutées au deck objectif sans LPU intermédiaire.
		 * Dès que X est présent dans une LPU, on retire la carte correspondante des objectifs.
		 */
		if (!bool && !modif)
		{
			const objDeckIndex = tmp.length - 1;
			for (let i = tmp[objDeckIndex].length - 1; i >= 1; i--)
			{
				const goalCard = tmp[objDeckIndex][i];
				if (goalCard == null || goalCard === undefined)
					continue;

				if (checkSubObj(tmp[objDeckIndex], goalCard))
					continue;

				let foundInLPU = false;
				for (let d = 0; d < objDeckIndex; d++)
				{
					if (containCard(tmp, d, goalCard))
					{
						foundInLPU = true;
						break;
					}
				}

				if (foundInLPU)
				{
					tmp[objDeckIndex] = delCardWithEquals(tmp[objDeckIndex], goalCard);
					arrayMsg.push(["On a ", goalCard.copy(), "."]);
					arrayIndent.push(0);
					modif = true;
				}
			}
		}

		/**
		 * Regarde l'objectif précédent pour voir si le fait d'ajouter l'objectif secondaire ne l'a pas validé.
		 * Si cela valide l'objectif principal : bool = true
		 * Sinon : bool = false
		 */
		if (!bool && modif)
		{
			let tmpRes = isWin(arrayMsg, arrayIndent, tmp, false);
			tmp = tmpRes[0];
			bool = tmpRes[1];
			arrayMsg = tmpRes[2];
			arrayIndent = tmpRes[3];
		}

		if (originel)
		{
			addLineDemonstration(arrayMsg, arrayIndent);
			setSavedGame(tmp);
			allFalse(tmp);
			let tmpVar = CreatTabObj(tmp);
			setTabObjectif(tmpVar);
		}

		if (originel && bool)
		{
			setWin(true);
			setPopupWin(true);
			saveProgress();
		}

		return [tmp, bool, arrayMsg, arrayIndent];
	};

	/**
	 * Ajoute une carte au deck indiqué, après avoir vérifié qu'elle n'existe pas déjà
	 * et qu'elle ne dépasse pas la profondeur maximale autorisée.
	 *
	 * @param {Card[][]} tmp - état du jeu à modifier (modifié directement)
	 * @param {number} deckId - indice du deck dans lequel ajouter la carte
	 * @param {Card} card - la carte à ajouter
	 * @param {boolean} [defaultEmitError=true] - si false, n'affiche pas de message d'erreur en cas d'échec
	 *
	 * @returns {boolean} true si la carte a été ajoutée, false sinon
	 */
	const addToGame = (tmp, deckId, card, defaultEmitError) => {
		if (defaultEmitError === undefined)
			defaultEmitError = true;

		if (containCard(tmp, deckId, card))
		{
			if (!defaultEmitError)
				return false;

			let deckAffiche = deckId + 1;
			if (deckAffiche === tmp.length)
				deckAffiche = "des objectifs";

			error(`La carte ${card} existe deja dans la LPU ${deckAffiche}`, false);
			return false;
		}

		if (deckId === tmp.length - 1 && containCard(tmp, 0, card))
		{
			if (!defaultEmitError)
				return false;

			error(`La carte ${card} existe deja dans la LPU 1`, false);
			return false;
		}

		if (card.getProfondeur() > 6)
		{
			error(`La carte ${card} est trop grosse`, false);
			return false;
		}

		card.id = tmp[deckId].length;
		card.setOld(true);
		tmp[deckId].push(card);

		return true;
	};

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Retour arrière".
	 * Prend le dernier élément du tableau {@link lastGame} et remplace la variable {@link game}.
	 */
	const retourEnArriere = () => {
		if (navigation || win)
			return;

		// Vérifie s'il y a au moins une sauvegarde du jeu
		if (lastGame.length > 0)
		{
			// Copie le tableau de sauvegarde
			let tmpLastGame = [...lastGame];

			// Prend le dernier tableau de jeu ajoutée
			let tmpSavedGame = tmpLastGame[tmpLastGame.length - 1];

			// Initialise le futur tableau de jeu
			let tmpFutureGame = [];

			// Copie le dernier tableau de jeu sauvegardé dans le futur tableau
			for (let i = 0; i < tmpSavedGame.length; i++)
			{
				tmpFutureGame[i] = [];
				for (let j = 0; j < tmpSavedGame[i].length; j++)
					tmpFutureGame[i].push(tmpSavedGame[i][j].copy());
			}

			// Refait le tableau des objectifs au cas où on retourne en arrière sur une suppression d'objectif secondaire
			setIndentationDemonstration(CreatTabObj(tmpFutureGame).length - 1);

			// Met à jour le jeu avec la dernière sauvegarde & désélectionne toutes les cartes
			allFalse(tmpFutureGame);
			setSavedGame(tmpFutureGame);

			/**
			 * Ne retire une ligne de démonstration que s'il en existe une pour cette
			 * action (certaines actions, notamment en mode Création, sauvegardent le
			 * jeu sans ajouter de ligne de démonstration).
			 */
			if (demonstration.length > 0)
			{
				let demonstrationTmp = [...demonstration];
				demonstrationTmp.pop();
				setDemonstration(demonstrationTmp);

				let tabIndentationTmp = [...tabIndentation];
				tabIndentationTmp.pop();
				setTabIndentation(tabIndentationTmp);
			}

			// Supprime la dernière sauvegarde du jeu
			tmpLastGame.pop();
			setLastGame(tmpLastGame);
		}
		else
			allFalseGame();
	};

	/**
	 * Sauvegarde une copie de l'état actuel du jeu dans l'historique ({@link lastGame}),
	 * pour permettre un retour en arrière ultérieur.
	 */
	const saveGame = () => {
		// Copie du tableau de sauvegarde
		let tmpLastGame = [...lastGame];

		// Copie du jeu actuel
		let saveGameTmp = copyGame();

		// Ajoute le jeu actuel dans le tableau des sauvegardes
		tmpLastGame.push(saveGameTmp);

		// Met à jour le tableau des sauvegardes
		setLastGame(tmpLastGame);
	};

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Ajouter carte et".
	 *
	 * Une seule et unique carte doit être sélectionnée sinon un popup d'erreur apparaît avec ce message :
	 *    Si 2 cartes sont sélectionnées :  "Vous devez sélectionner une seule carte !"
	 *    Si 0 carte sont sélectionnées  :  "Vous devez sélectionner une carte !"
	 *
	 * La carte sélectionner doit avoir une liaison principale de type "et" sinon un popup d'erreur apparait avec ce message :
	 *    "La carte sélectionnée doit avoir une liaison principale de type "et" !"
	 *
	 * Si toutes les conditions énumérées au-dessus sont respectées les parties gauche et droite de la carte sont ajoutées au Deck.
	 */
	const addCardAnd = () => {
		if (navigation || win)
			return;

		// Si 2 cartes sont sélectionnées
		if (nbSelec > 1)
		{
			error("Vous devez sélectionner une seule carte !");
			return;
		}

		// Si aucune carte n'est sélectionnée
		if (nbSelec === 0)
		{
			error("Vous devez sélectionner une carte !");
			return;
		}

		/**
		 * Prend la carte qui est sélectionnée.
		 * Si elle n'est pas sélectionnée c'est -1 donc on prend la plus haute valeur.
		 */
		let deckI = Math.max(selecDeck1, selecDeck2);
		let cardI = Math.max(selecCard1, selecCard2);

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
		let tmp = [...game];

		// Ajoute la partie gauche de la carte dans le jeu
		let tmpCard1 = game[deckI][cardI].left.copy();
		addToGame(tmp, deckI, tmpCard1, false);

		// Ajoute la partie droite de la carte dans le jeu
		let tmpCard2 = game[deckI][cardI].right.copy();
		addToGame(tmp, deckI, tmpCard2, false);

		// Vérifie si l'exercice est fini, si oui affiche le popup de victoire
		isWin([["On a ", tmpCard1.copy(), ". On a ", tmpCard2.copy(), "."]], [0], tmp);
	};

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Ajouter carte =>".
	 *
	 * Deux cartes sont demandées pour faire fonctionner cette fonction sinon un popup d'erreur apparaît avec ce message :
	 *    "Vous devez sélectionner deux cartes !"
	 *
	 * Au moins une des deux cartes doit avoir une liaison principale du type "=>" sinon un popup d'erreur apparaît avec ce message :
	 *    Une des deux cartes doit avoir une liaison principale de type "=>" !"
	 *
	 * La partie gauche de la carte la plus complexe doit être égale à l'autre carte sinon un popup d'erreur apparaît avec ce message :
	 *    "La partie gauche de la carte "=>" doit être égale à la deuxième carte sélectionnée !"
	 *
	 * Si toutes les conditions énumérées au-dessus sont respectées la partie droite est ajoutée au deck le plus haut.
	 */
	const addCardFuse = () => {
		if (navigation || win)
			return;

		// S'il n'y a pas 2 cartes sélectionnées
		if (nbSelec !== 2)
		{
			error("Vous devez sélectionner deux cartes !");
			return;
		}

		// Prend le deck le plus grand
		let finalDeck = Math.max(selecDeck1, selecDeck2);
		if (finalDeck === game.length - 1)
		{
			error("Vous ne pouvez pas utiliser une carte de l'objectif avec ce bouton !");
			return;
		}

		// Copie du jeu actuel
		let tmp = [...game];
			/**
			 * Vérifie si la 2ème carte a une liaison => et si sa partie gauche est égale à l'autre carte.
			 * Met le résultat dans {@link bool}.
			 * On ne met pas directement la condition dans le if car on veut savoir avec quelle condition on y est rentré.
			 */

		let bool =
			tmp[selecDeck2][selecCard2].link === "=>" &&
			tmp[selecDeck2][selecCard2].left.equals(tmp[selecDeck1][selecCard1]);

		// Une des 2 cartes doit avoir une liaison =>
		if (bool ||
			(tmp[selecDeck1][selecCard1].link === "=>" &&
			tmp[selecDeck1][selecCard1].left.equals(
			tmp[selecDeck2][selecCard2])))
		{
			// Initialisation de la carte où la liaison => va être utilisée
			let deckCarteComplex;
			let cardCarteComplex;

			// Détermine & affecte l'id de la carte => utilisée
			if (bool)
			{
				deckCarteComplex = selecDeck2;
				cardCarteComplex = selecCard2;
			}
			else
			{
				deckCarteComplex = selecDeck1;
				cardCarteComplex = selecCard1;
			}

			if (containCard(game,finalDeck, tmp[deckCarteComplex][cardCarteComplex].right))
			{
				error("La carte que vous voulez ajouter existe déjà !");
				return;
			}

			// Sauvegarde du jeu actuel
			saveGame();

			// Ajoute la partie droite de la carte => utilisée dans le deck le plus haut
			let cardToAdd = tmp[deckCarteComplex][cardCarteComplex].right.copy();
			addToGame(tmp, finalDeck, cardToAdd);

			// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
			isWin(
				[
					[
						"Puisque ",
						tmp[deckCarteComplex][cardCarteComplex].left.copy(),
						", on a ",
						tmp[deckCarteComplex][cardCarteComplex].right.copy(),
						".",
					],
				],
				[0],
				tmp
			);
		}
		else
		{
			// Si aucune des 2 cartes n'a de liaison =>
			if (tmp[selecDeck2][selecCard2].link !== "=>" &&
				tmp[selecDeck1][selecCard1].link !== "=>")
			{
				error('Une des deux cartes doit avoir une liaison principale de type "=>" !');
			}
			else
				error('La partie gauche de la carte "=>" doit être égale à la deuxième carte sélectionnée !');
		}
	};

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Fusion carte et".
	 *
	 * Deux cartes sont demandées pour faire fonctionner cette fonction sinon un popup d'erreur apparaît avec ce message :
	 *    "Vous devez sélectionner deux cartes !"
	 *
	 * Si toutes les conditions énumérées au-dessus sont respectées les deux cartes fusionnent en une nouvelle carte qui prend la liaison "et" dans le deck le plus haut des deux cartes.
	 */
	const fuseCardAnd = () => {
		if (!navigation && !win)
		{
			// Si 2 cartes sont sélectionnées
			if (selecCard1 !== -1 && selecCard2 !== -1 &&
				selecDeck1 !== -1 && selecDeck2 !== -1)
			{
				// Prend le deck le plus haut
				let finalDeck = Math.max(selecDeck1, selecDeck2);
				if (finalDeck !== game.length - 1)
				{
					// Copie du jeu actuel
					let tmp = [...game];

					if (!containCard(game, finalDeck, new Card(0, null, false, "et", tmp[selecDeck1][selecCard1], tmp[selecDeck2][selecCard2], true, false)))
					{
						// Sauvegarde du jeu actuel
						saveGame();

						// Copie les 2 cartes sélectionnées
						let tmpCard1 = tmp[selecDeck1][selecCard1].copy();
						let tmpCard2 = tmp[selecDeck2][selecCard2].copy();
						tmpCard1.id = 0;
						tmpCard2.id = 1;
						tmpCard1.setOld(true);
						tmpCard2.setOld(true);

						// Ajoute la nouvelle carte dans le deck le plus haut avec les 2 autres cartes & une liaison "et"
						let cardToAdd = new Card(tmp[finalDeck].length, null, false, "et", tmpCard1, tmpCard2, true, false);
						if (!addToGame(tmp, finalDeck, cardToAdd))
							return;

						// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
						isWin([["On a ", tmpCard1.copy(), "^", tmpCard2.copy(), ".",], ], [0], tmp);
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
	};

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Ajouter objectif".
	 *
	 * Une seule & unique carte doit être sélectionnée sinon un popup d'erreur apparaît avec ce message :
	 *    Si 2 cartes sont sélectionnées :  "Vous devez sélectionner une seule carte !"
	 *    Si 0 carte sont sélectionnées  :  "Vous devez sélectionner une carte !"
	 *
	 * La carte sélectionnée doit avoir une liaison principale de type "=>" sinon un popup d'erreur apparaît avec ce message :
	 *    "L'objectif secondaire doit avoir une liaison "=>" !
	 *
	 * Si toutes les conditions énumérées au-dessus sont respectées il y a 2 possibilités :
	 *    La carte sélectionnée est dans les objectifs : ajoute la partie gauche dans le dernier deck avant l'objectif
	 *    et la droite dans l'objectif et défini cet objectif comme un objectif secondaire.
	 *    Le reste : ajoute la partie gauche dans l'objectif et ne le considère pas comme un objectif secondaire.
	 */
	const addObjectif = () => {
		if (!navigation && !win)
		{
			// S'il n'y a qu'une carte de sélectionné
			if ((selecCard1 !== -1 && selecCard2 === -1 && selecDeck1 !== -1 && selecDeck2 === -1) ||
				(selecCard1 === -1 && selecCard2 !== -1 && selecDeck1 === -1 && selecDeck2 !== -1))
			{
				// Prend la carte sélectionnée
				let deckI = Math.max(selecDeck1, selecDeck2);
				let cardI = Math.max(selecCard1, selecCard2);

				// Si le 1er sous-objectif choisi n'est pas l'objectif principal
				if (deckI === game.length - 1 || game.length > 2)
				{
					// Si le sous-objectif n'existe pas déjà
					if (!deckContain(deckI, cardI))
					{
						// Si la carte choisie pour créer le sous-objectif a une liaison principal =>
						if (game[deckI][cardI].link === "=>")
						{
							// Initialisation de la variable du sous-objectif
							let secondObjectif;

							// Copie du jeu actuel
							let tmp = [...game];

							// Initialisation d'une variable temporaire
							let tmpCard;

							// Si la carte sélectionnée est dans le deck objectif
							if (deckI === game.length - 1)
							{
								// Sauvegarde du jeu actuel
								saveGame();

								// Message en mode tutoriel
								if (mode === "Tutorial" && numero === 3)
								{
									setMessageTutorial([
										"Vous devez maintenant compléter l’objectif secondaire.",
										"Si vous complétez l’objectif secondaire cela créera la carte d’où il a été créé dans deck avant, dans notre cas dans le deck départ cela complétera l’objectif principal.",
									]);
								}

								// Copie de la partie droite de la carte sélectionnée
								secondObjectif = game[deckI][cardI].right.copy();

								// Rajoute le second objectif dans le deck objectif
								if (!addToGame(tmp, tmp.length - 1, secondObjectif))
									return;

								// Copie de la partie gauche de la carte sélectionnée
								tmpCard = tmp[deckI][cardI].left.copy();

								// Rajoute le deck intermediaire
								tmp.splice(tmp.length - 1, 0, []);

								// Ajoute cette partie dans le deck qui vient d'etre créer
								addToGame(tmp, tmp.length - 2, tmpCard);

								// Copie du tableau objectif
								let tmpObj = [...tabObjectif];

								// Ajoute l'objectif secondaire dans le tableau objectif
								tmpObj.push([tabObjectif.length, tmp[tmp.length - 1].length - 1, true,]);

								// Met à jour le tableau objectif
								setTabObjectif(tmpObj);
								addLineDemonstration([["Supposons ", tmpCard.copy(), ". Montrons ", secondObjectif.copy(), ".",], ], [0]);
								setIndentationDemonstration((prev) => prev + 1);

								// Met à jour le jeu & désélectionne toutes les cartes
								allFalse(tmp);
								setSavedGame(tmp);
							}
							else
							{
								// Si la carte est pas dans le deck objectif 1 si la partie gauche de la carte a une liaison =>
								if (game[deckI][cardI].left.haveImpliqueLinkRecur())
								{
									// Sauvegarde du jeu actuel
									saveGame();

									// Copie de la partie gauche de la carte sélectionnée
									secondObjectif = tmp[deckI][cardI].left.copy();

									// Met la carte copiée dans le deck objectif (ce n'est pas un objectif secondaire)
									if (!addToGame(tmp, tmp.length - 1, secondObjectif))
										return;

									addLineDemonstration([["Montrons ", secondObjectif.copy(), ".", ], ], [0]);

									// Met à jour le jeu & désélectionne toutes les cartes
									allFalse(tmp);
									setSavedGame(tmp);
								}
								else
									error('La partie gauche de l\'objectif secondaire doit avoir une liaison "=>" !');
							}
						}
						else if (game[deckI][cardI].isCardEtObjectif())
						{
							if (deckI === game.length - 1)
							{
								let tmp = [...game];

								// Sauvegarde du jeu actuel
								saveGame();

								// Copie de les deux parties de la carte sélectionnée
								let secondObjectif1 = game[deckI][cardI].left.copy();
								let secondObjectif2 = game[deckI][cardI].right.copy();
								let firstArrayDemo = [];
								let secondArrayDemo = [];
								if (secondObjectif1.haveImpliqueLinkRecur())
								{
									if (addToGame(tmp, tmp.length - 1, secondObjectif1, false))
										firstArrayDemo = ["Montrons ", secondObjectif1.copy(), ". ",];
								}

								if (secondObjectif2.haveImpliqueLinkRecur())
								{
									if (addToGame(tmp, tmp.length - 1, secondObjectif2, false))
										secondArrayDemo = ["Montrons ", secondObjectif2.copy(), ".",];
								}

								addLineDemonstration([firstArrayDemo.concat(secondArrayDemo)], [0]);

								// Met à jour le jeu & désélectionne toutes les cartes
								allFalse(tmp);
								setSavedGame(tmp);
							}
						}
						else
							error('L\'objectif secondaire doit avoir une liaison "=>" ou une carte "et" avec au moins une liaison "=>" a l\'interieur!');
					}
					else
						error("Cet objectif existe déjà !");
				}
				else
					error("Le premier objectif secondaire doit être créé à l'aide de l'objectif principal !");
			}
			else
			{
				if (nbSelec > 1)
					error("Vous devez sélectionner une seule carte !");
				else if (nbSelec === 0)
					error("Vous devez sélectionner une carte !");
			}
		}
	};

	/**
	 * Applique le "tiers exclu" (élimination de la double négation) sur la carte sélectionnée :
	 * si elle est de la forme non(non(X)), ajoute X au deck. Si la carte sélectionnée
	 * est dans le deck objectif, délègue plutôt à {@link transformIntoNonCard}.
	 */
	const tiersExclus = () => {
		if (navigation || win)
			return;

		// S'il n'y a qu'une carte de sélectionné
		if ((selecCard1 !== -1 && selecCard2 === -1 && selecDeck1 !== -1 && selecDeck2 === -1) ||
			(selecCard1 === -1 && selecCard2 !== -1 && selecDeck1 === -1 && selecDeck2 !== -1))
		{
			// Prend la carte sélectionnée
			let deckI = Math.max(selecDeck1, selecDeck2);
			let cardI = Math.max(selecCard1, selecCard2);
			let tmp = [...game];
			let cardTmp = tmp[deckI][cardI];
			if (deckI === tmp.length - 1)
			{
				transformIntoNonCard();
				return;
			}

			if (!cardTmp.canUseTiersExclus())
			{
				error(`La carte${cardTmp.toString()} n'est pas une carte non(non(Carte))`);
				return;
			}

			let cardToAdd = cardTmp.left.left;
			if (!addToGame(tmp, deckI, cardToAdd))
				return;

			// Vérifie si l'exercice est résolu, si oui affiche le popup de victoire
			isWin([["Puisque ", cardTmp.copy(), ", on a ", cardToAdd.copy(), ".", ], ], [0], tmp);
		}
	};

	/**
	 * Construit le texte affiché pour une ligne de démonstration, en concaténant les segments
 	 * de texte brut et les cartes (converties via toString()) du tableau reçu.
	 *
	 * @param {Array<string|Card>} tab - séquence de textes et de cartes à afficher
	 *
	 * @returns {string} le texte final, formaté pour l'affichage
	 */
	const constructDemonstration = (tab) => {
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
	};

	/**
	 * Ajoute une ou plusieurs lignes à la zone de démonstration, et met à jour l'indexation
	 * qui permet de "revenir" à l'état du jeu correspondant à chaque ligne.
	 *
	 * @param {Array} msgArray - tableau de messages à ajouter (chaque message est lui-même
	 *                           un tableau de textes/cartes, voir {@link constructDemonstration})
	 * @param {number[]} indentationArray - indentation associée à chaque message de msgArray
	 * @param {number} [num] - si différent de 0, force l'ajout des lignes même si la démonstration
	 *                         n'est pas vide (utilisé pour les sous-objectifs imbriqués)
	 * @param {boolean} [reset=false] - true pour repartir d'une démonstration vide (nouveau niveau)
	 */
	const addLineDemonstration = (msgArray, indentationArray, num, reset) => {
		if (reset === undefined)
			reset = false;

		let tmpTabIndentation = [];
		let tmpDemonstration = [];
		let indentation = 0;
		let tmpTabIndiceDemonstration = [];

		/**
		 * Base de départ pour l'indexation : -1 si on réinitialise le niveau
		 * (la première ligne doit alors pointer vers l'index 0, cohérent avec
		 * lastGame vide), sinon on repart de la dernière valeur connue.
		 */
		let baseIndice = -1;
		if (!reset)
		{
			tmpTabIndentation = [...tabIndentation];
			tmpDemonstration = [...demonstration];
			indentation = indentationDemonstration;
			tmpTabIndiceDemonstration = [...tabIndiceDemonstration];
			baseIndice = tabIndiceDemonstration[tabIndiceDemonstration.length - 1];
		}

		msgArray.forEach((msg, index) => {
			if (indentationArray[index] === undefined)
				indentationArray[index] = 0;

			indentation += indentationArray[index];

			tmpTabIndentation.push(indentationDemonstration);

			if (tmpDemonstration.length === 0 || num !== 0)
				tmpDemonstration.push([indentation, msg,]);

			tmpTabIndiceDemonstration.push(baseIndice + 1);
			baseIndice += 1;
		});

		setDemonstration(tmpDemonstration);
		setTabIndentation(tmpTabIndentation);
		setIndentationDemonstration(indentation);
		setTabIndiceDemonstration(tmpTabIndiceDemonstration);
	};

	/**
	 * Cette fonction sert à déterminer si un objectif est déjà créé.
	 * Cherche dans les objectifs s'il existe une carte qui est égale à :
	 * - Si le deck est l'objectif, alors la partie droite de la carte est reçue ;
	 * - Sinon, c'est la partie gauche de la carte qui est reçue.
	 *
	 * @param {number} deck - indice du deck
	 * @param {number} card - indice de la carte
	 *
	 * @returns {boolean} true ou false
	 */
	const deckContain = (deck, card) => {
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
	};

	/**
	 * Redirige vers le prochain exercice si il existe.
	 */
	const nextExercise = () => {
		// S'il y a un prochain exercice
		if (numero + 2 <= nbExo)
		{
			// url du prochain exercice
			let url = "/Exercise/" + mode + "/" + (numero + 2);

			// Redirige vers cet url
			navigate(url);
		}

		setPopupWin(false);
	};

	/**
	 * Enregistre la progression du niveau actuel auprès du backend, si l'utilisateur est connecté.
	 */
	const saveProgress = () => {
		if (!user || mode === "Create")
			return;

		fetch(`${API}/api/progress`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				mode: mode,
				num: numero + 1,
				completed: true,
			}),
		});
	};

	/**
	 * Fait une copie du jeu actuel en créant un nouveau tableau & en copiant toutes les cartes.
	 *
	 * @returns {Card[][]} une copie de la partie actuelle
	 */
	const copyGame = () => {
		// Nouveau tableau vide que l'on va retourner
		let tmp = [];

		// Boucle de la taille du jeu
		for (let i = 0; i < game.length; i++)
		{
			// Crée le deck vide
			tmp[i] = [];

			for (let j = 0; j < game[i].length; j++)
			{
				// Ajoute une copie de la carte dans le deck
				try {
					tmp[i].push(game[i][j].copy());
				} catch (error) {
					console.error(error);
				}
			}
		}

		// Retourne le nouveau tableau
		return tmp;
	};

	/**
	 * Récupère le numéro de la démonstration et met le jeu à ce moment-là de la partie.
	 *
	 * @param {Event} event - on utilise event.target.id
	 */
	const demonstrationClickHandler = (event) => {
		let id = event.currentTarget.id.substring(4, 20);
		let indiceRecu = parseInt(id, 10);
		let indiceRetour = tabIndiceDemonstration[indiceRecu];

		if (indiceRetour === undefined)
			return;

		if (indiceRetour !== lastGame.length)
		{
			let tmpLastGame = [...lastGame];
			let tmpSavedGame = tmpLastGame[indiceRetour];
			if (tmpSavedGame === undefined || tmpSavedGame === null)
				return;

			setNavigation(true);

			// Initialise le futur tableau de jeu.
			let tmpFutureGame = [];

			// Copie le dernier tableau de jeu sauvegardé dans le futur tableau.
			for (let i = 0; i < tmpSavedGame.length; i++)
			{
				tmpFutureGame[i] = [];
				for (let j = 0; j < tmpSavedGame[i].length; j++)
					tmpFutureGame[i].push(tmpSavedGame[i][j].copy());
			}

			allFalse(tmpFutureGame);
		}
		else
		{
			setNavigation(false);
			allFalse(savedGame);
		}
	};

	/**
	 * Affiche un message d'erreur à l'utilisateur.
	 * 
	 * @param {string} message - le message d'erreur à afficher
	 * @param {boolean} [allFalseBool=true] - si false, n'annule pas la sélection de cartes en cours
	 */
	const error = (message, allFalseBool) => {
		if (allFalseBool === undefined)
			allFalseBool = true;

		setMessageError(message);

		if (!allFalseBool)
			return;

		allFalseGame();
	};

	/**
	 * Remplace les notations logiques brutes (^, =>, <=>, non, ∨) par leurs symboles unicode
	 * espacés, pour un affichage plus lisible dans le texte des démonstrations.
	 * 
	 * @param {string} str - la chaîne de caractères à formater
	 * 
	 * @returns {string} - la chaîne de caractères formatée pour l'affichage
	 */
	const stringToLogicText = (str) => {
		str = str.replaceAll("^", " ∧ ");
		str = str.replaceAll("non", " ¬ ");
		str = str.replaceAll("<=>", " ⇔ ");
		str = str.replaceAll("=>", " ⇒ ");
		str = str.replaceAll("∨", " ∨ ");

		return str;
	};

	/**
	 * Intercepte la copie de texte sélectionné dans la zone de démonstration : reconvertit
	 * les symboles logiques affichés (∧, ⇒, ⇔, ¬) en notation ASCII (^, =>, <=>, non),
	 * nettoie les espaces insécables, et déduplique les segments répétés avant de placer
	 * le résultat dans le presse-papier.
	 */
	const copyHandler = () => {
		let str = window.getSelection().toString();
		str = str.replaceAll("∧", "^");
		str = str.replaceAll("⇔", "<=>");
		str = str.replaceAll("⇒", "=>");
		str = str.replaceAll("¬", "non");

		let espaceInsec = new RegExp(String.fromCharCode(160), "g");
		str = str.replaceAll(espaceInsec, " ");
		str = str.replaceAll("  ", " ");
		str = str.replaceAll(" .", ".");

		let arrayLine = str.split("\n");
		let futurArrayLine = [];
		arrayLine.forEach((line) => {
			let arrayElement = line.split(", ");
			let futurArrayElement = [];
			arrayElement.forEach((elementComa) => {
				let arrayPoint = elementComa.split(". ");
				let futurArrayPoint = [];
				arrayPoint.forEach((element) => {
					if (!futurArrayPoint.includes(element))
						futurArrayPoint.push(element);
				});

				let res = futurArrayPoint.join(". ");
				if (!futurArrayElement.includes(res))
					futurArrayElement.push(res);
			});

			futurArrayLine.push(futurArrayElement.join(", "));
		});

		str = futurArrayLine.join("\n");
		navigator.clipboard.writeText(str);
	};

	/**
	 * Active ou désactive l'affichage simplifié des cartes (connecteurs recomposés
	 * plutôt que leur décomposition logique brute), selon l'état de la case à cocher.
	 * 
	 * @param {Event} event - événement de changement de la case à cocher
	 */
	const affichageSimpleHandler = (event) => {
		setAffichageSimple(event.target.checked);
	};

	const getNextMove = () => {
		const nextMove = computeNextMove(game, tabObjectif);
		setCardHelp(nextMove.cardHelp);
		setCardHelp2(nextMove.cardHelp2);
	}

	/**
	 * Applique la transitivité sur deux cartes sélectionnées ayant chacune une liaison "=>",
	 * ou étant toutes deux des cartes "<=>" (équivalence), pour en déduire une nouvelle carte
	 * combinant les deux implications/équivalences.
	 */
	const transitivite = () => {
		if (navigation || win)
			return;

		// S'il n'y a pas 2 cartes sélectionnées
		if (nbSelec !== 2)
		{
			error("Vous devez sélectionner deux cartes !");
			return;
		}

		// Prend le deck le plus grand
		let finalDeck = Math.max(selecDeck1, selecDeck2);
		if (finalDeck === game.length - 1)
		{
			error("Vous ne pouvez pas utiliser une carte de l'objectif avec ce bouton !");
			return;
		}

		// Copie du jeu actuel
		let tmp = [...game];
		let card1 = tmp[selecDeck1][selecCard1];
		let card2 = tmp[selecDeck2][selecCard2];
		let cardToAdd;
		let cardRight;
		let cardLeft;
		let cardMiddle;
		let sign;
		if (card1.link === "=>" || card2.link === "=>")
		{
			sign = "=>";
			if (card1.left.equals(card2.right))
			{
				cardRight = card1.right;
				cardLeft = card2.left;
				cardMiddle = card1.left;
				cardToAdd = new Card(tmp[finalDeck].length, null, false, "=>", card2.left.copy(), card1.right.copy());
			}
			else if (card1.right.equals(card2.left))
			{
				cardRight = card2.right;
				cardLeft = card1.left;
				cardMiddle = card2.left;
				cardToAdd = new Card(tmp[finalDeck].length, null, false, "=>", card1.left.copy(), card2.right.copy());
			}
			else
			{
				error("Vous ne pouvez pas utiliser ce bouton avec ces cartes !");
				return;
			}
		}
		else if (card1.isDoubleArrow() && card2.isDoubleArrow())
		{
			sign = "<=>";
			if (card1.left.right.equals(card2.right.right))
			{
				cardRight = card2.left.right;
				cardLeft = card1.left.left;
				cardMiddle = card2.left.left;
				cardToAdd = new Card(
					tmp[finalDeck].length,
					null,
					false,
					"et",
					new Card(0, null, false, "=>", card1.left.left.copy(), card2.left.right.copy()),
					new Card(0, null, false, "=>", card2.left.right.copy(), card1.left.left.copy())
				);
			}
			else if (card2.left.right.equals(card1.right.right))
			{
				cardRight = card2.left.left;
				cardLeft = card1.left.right;
				cardMiddle = card2.left.right;
				cardToAdd = new Card(
					tmp[finalDeck].length,
					null,
					false,
					"et",
					new Card(0, null, false, "=>", card1.left.right.copy(), card2.left.left.copy()),
					new Card(0, null, false, "=>", card2.left.left.copy(), card1.left.right.copy())
				);
			}
			else
			{
				error("Vous ne pouvez pas utiliser ce bouton avec ces cartes !");
				return;
			}
		}
		else
		{
			error('Les cartes sélectionnées doivent avoir des liaisons "=>" ou "<=>".');
			return;
		}

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
	};

	/**
	 * Gestionnaire de raccourcis clavier, sous forme d'Effect Event (useEffectEvent)
	 */
	const onKeyDown = useEffectEvent((event) => {
		if (event.code.toLowerCase().includes("arrow"))
		{
			event.preventDefault();
			const isCurrentPositionInvalid =
				currentCardArrow === undefined ||
				currentCardArrow[0] >= game.length ||
				currentCardArrow[1] >= game[currentCardArrow[0]].length;

			if (isCurrentPositionInvalid)
			{
				const tmp = [...game];
				tmp[0][0].hover = true;
				setGame(tagDecks(tmp));
				setcurrentCardArrow([0, 0]);
			}
			else if (event.code.toLowerCase().includes("down"))
			{
				const futurHover = Math.min(currentCardArrow[1] + 1, game[currentCardArrow[0]].length - 1);
				changeHover(currentCardArrow[9], futurHover);
			}
			else if (event.code.toLowerCase().includes("up"))
			{
				const futurHover = Math.max(currentCardArrow[1] - 1, 0);
				changeHover(currentCardArrow[0], futurHover);
			}
			else if (event.code.toLowerCase().includes("left"))
			{
				const futurHover = Math.max(currentCardArrow[0] - 1, 0);
				changeHover(futurHover, Math.min(currentCardArrow[1], game[futurHover].length - 1));
			}
			else if (event.code.toLowerCase().includes("right"))
			{
				const futurHover = Math.min(currentCardArrow[0] + 1, game.length - 1);
				changeHover(futurHover, Math.min(currentCardArrow[1], game[futurHover].length - 1));
			}
		}
		else if (currentCardArrow !== undefined && event.code.toLowerCase().includes("space"))
		{
			event.preventDefault();
			update(currentCardArrow[0], currentCardArrow[1]);
		}

		switch (event.key.toLowerCase())
		{
			case "q":
				addCardAnd();
				break;

			case "w":
				addCardFuse();
				break;

			case "e":
				fuseCardAnd();
				break;

			case "r":
				addObjectif();
				break;

			case "t":
				retourEnArriere();
				break;

			case "escape":
				if (currentCardArrow !== undefined)
				{
					const tmp = [...game];
					tmp[currentCardArrow[0]][currentCardArrow[1]].hover = false;
					setGame(tagDecks(tmp));
					setcurrentCardArrow(undefined);
				}
				break;

			default:
				break;
			}
	});

	useEffect(() => {
		document.addEventListener("keydown", onKeyDown);

		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<div className="game">
			{win && numero + 2 <= nbExo && (
				<button className="buttonWin" onClick={nextExercise}>
					Niveau suivant
				</button>
			)}
			<div className="bouton">
				{/* Revient à la partie avant l'ajout d'une carte */}
				<div>
					<button id="back" className="buttonAction " onClick={retourEnArriere}>
						<span className="buttonFormula">↶</span>
						<span className="tooltiptext">Retour arrière</span>
					</button>
				</div>

				{mode !== "Create" && (
					<div>
						<button id="aide" className="buttonAction " onClick={getNextMove}>
							<span className="buttonFormula">?</span>
							<span className="tooltiptext">Aide</span>
						</button>
					</div>
				)}

				{/* Bouton pour obtenir les 2 parties d'une carte "et" */}
				{mode !== "Create" && (
					<div>
						<button id="addAnd" className={"buttonAction " + (mode === "Tutorial" && numero === 0 ? "boutonSelection" : "")} onClick={addCardAnd}>
							<span className="buttonFormula">[1∧2] → [1] [2]</span>
							<span className="tooltiptext">Séparation</span>
						</button>
					</div>
				)}

				{/* Bouton pour obtenir la partie droite d'une carte "=>" si l'on a sélectionné une autre carte qui est égale à la partie gauche */}
				{mode !== "Create" && (
					<div>
						<button id="addImplique" className={"buttonAction " + (mode === "Tutorial" && numero === 1 ? "boutonSelection" : "")} onClick={addCardFuse}>
							<span className="buttonFormula">[1] [1⇒2] → [2]</span>
							<span className="tooltiptext">Implique</span>
						</button>
					</div>
				)}

				{/* Fusionne 2 cartes (taille double max) et crée une 3ème carte composée de la partie gauche (1ère carte sélectionnée) & la partie droite (2ème carte sélectionnée). La carte créée aura une liaison "et" */}
				{mode !== "Create" && (
					<div>
						<button id="fuseAnd" className={"buttonAction " + (mode === "Tutorial" && numero === 2 ? "boutonSelection" : "")} onClick={fuseCardAnd}>
							<span className="buttonFormula">[1] [2] → [1∧2]</span>
							<span className="tooltiptext">Fusion</span>
						</button>
					</div>
				)}

				{/* Ajout objectif secondaire */}
				{mode !== "Create" && (
					<div>
						<button id="addGoal" className={"buttonAction " + (mode === "Tutorial" && numero === 3 ? "boutonSelection" : "")} onClick={addObjectif}>
							<span className="buttonFormula">+ 🏁</span>
							<span className="tooltiptext">+ Objectif</span>
						</button>
					</div>
				)}

				{mode !== "Create" && (
					<div>
						<button id="tiersExclus" className={"buttonAction " + (mode === "Tutorial" && numero === 6 ? "boutonSelection" : "")} onClick={tiersExclus}>
							<span className="buttonFormula">¬¬[1] → [1]</span>
							<span className="tooltiptext">Tiers Exclus</span>
						</button>
					</div>
				)}

				{mode !== "Create" && (
					<div>
						<button id="transitivite" className={"buttonAction " + (mode === "Tutorial" && (numero === 4 || numero === 5) ? "boutonSelection" : "")} onClick={transitivite}>
							<span className="buttonFormula">[1⇒2] [2⇒3] → [1⇒3]</span>
							<span className="tooltiptext">Transitivité</span>
						</button>
					</div>
				)}

				{/* Bouton pour ouvrir un fichier JSON et afficher l'exercice à l'écran pour le modifier */}
				{mode === "Create" && (
					<label className="fileButton">
						{openFileJson !== "" ? openFileJson : "Choisir un fichier"}
						<input type="file" accept="application/json" onChange={openFile}></input>
					</label>
				)}

				{/* Copie du jeu actuel en format JSON dans le presse-papier */}
				{mode === "Create" && (
					<button className="fileDownload" onClick={saveAsFile}>Télécharger le fichier</button>
				)}

				{
					<span id="checkBoxSimple">
						<input
							type="checkbox"
							id="afficheSimple"
							name="Affichage Simplifié"
							onChange={affichageSimpleHandler}
							checked={affichageSimple}
						></input>
						<label htmlFor="afficheSimple">
							<span className="tooltiptext">
								Affichage Simplifié
							</span>
						</label>
					</span>
				}
			</div>

			{/* Message d'aide en mode tutoriel */}
			{mode === "Tutorial" && messageTutorial !== "" && (
				<div className="toast toastTutorial">
					{messageTutorial.map((element, index) => {
						return <div key={index}>{element}</div>;
					})}
				</div>
			)}

			{/* Message d'erreur si on essaye de faire un mouvement illégal (ex: vouloir séparer une carte qui n'a pas une liaison "et") */}
			{messageErreur !== "" && (
				<div className="toast toastError">{messageErreur}</div>
			)}

			<GameTab.Provider value={game}>
				<div className="deckRow">
					{/* Ajout des decks */}
					{game.map((deck, index) => (
						<Deck
							updateGame={update}
							indice={index}
							addCardFunc={addCard}
							deleteCardFunc={confirmDeleteCard}
							transformIntoNonCard={transformIntoNonCard}
							nbDeck={game.length}
							mode={mode}
							objectif={tabObjectif}
							isWin={win}
							affichageSimple={affichageSimple}
							cardHelp={cardHelp}
							cardHelp2={cardHelp2}
							key={deck.__deckId ?? index}
						></Deck>
					))}
				</div>
			</GameTab.Provider>

			{/* Affichage de la démonstration de logique mathématique de l'exercice */}
			<div className="demonstration" onCopy={copyHandler}>
				{demonstration.map((element, index) => {
					return (
						<div
							key={index}
							id={"demo" + index}
							onClick={demonstrationClickHandler}
							style={
								index === 1
									? {marginLeft: 20 + element[0] * 20, marginTop: 20, }
									: { marginLeft: 20 + element[0] * 20 }
							}
						>
							<LogicText>{constructDemonstration(element[1])}</LogicText>
						</div>
					);
				})}
			</div>

			{popupAddCard && (
				<Popup
					size={50}
					content={
						<>
							<b>Choisissez une couleur</b>
							<div className="colorGrid" onChange={choixCouleur}>
								{[
									["red", "Rouge"],
									["yellow", "Jaune"],
									["blue", "Bleue"],
									["orange", "Orange"],
									["green", "Verte"],
									["purple", "Mauve"],
									["black", "Vrai"],
									["white", "Faux"],
								].map(([value, label]) => (
									<label className="colorSwatchLabel" key={value}>
										<input type="radio" value={value} name="couleur" />
										<span className="colorSwatch" style={{ backgroundColor: value }}></span>
										<span className="colorSwatchName">{label}</span>
									</label>
								))}
							</div>

							<button className="popupClose" onClick={function () {setPopupAddCard(false);}}>✕</button>
						</>
					}
				/>
			)}

			{/* Popup disponible en mode création quand on sélectionne 2 cartes pour choisir la liaison de la future carte */}
			{popupFusion && (
				<Popup
					size={50}
					content={
						<>
							<b>Choisissez une liaison</b>
							<div className="connectorGrid" onChange={choixLiaison}>
								{[
									["et", "∧", "Et"],
									["ou", "∨", "Ou"],
									["=>", "⇒", "Implique"],
									["<=>", "⇔", "Équivaut"],
								].map(([value, symbol, label]) => (
									<label className="connectorLabel" key={value}>
										<input type="radio" value={value} name="liaison" />
										<span className="connectorSymbol">{symbol}</span>
										<span className="connectorName">{label}</span>
									</label>
								))}
							</div>
							<button className="popupClose" onClick={function () {setPopupFusion(false);}}>✕</button>
						</>
					}
				/>
			)}

			{/* Popup disponible en mode création pour supprimer une carte avec un bouton qui lui est dédié */}
			{popupDeleteCard && !(selecCard1 === -1 || selecDeck1 === -1) && (
				<Popup
					size={50}
					content={
						<>
							<b>
								Voulez-vous supprimer cette carte{" "}
								{game[selecDeck1][selecCard1].toString()} : [
								{selecDeck1}][{selecCard1}] ?
							</b>
							<br />
							<div className="popupDeleteActions">
								<button className="btnSecondary" onClick={() => setPopupDeleteCard(false)}>
									Annuler
								</button>
								<button className="btnDanger" onClick={deleteCard}>
									Supprimer
								</button>
							</div>
						</>
					}
				/>
			)}

			{/* Popup de victoire quand on réussit l'objectif principal */}
			{popupWin && (
				<Popup
					content={
						<>
							<b>Bravo, vous avez trouvé la solution !</b>
							<span
								className="closeButton"
								onClick={function () {
									setPopupWin(false);
									if (mode === "Tutorial")
										nextExercise();
								}}
							>
								✖
							</span>
							<div className="demonstration-win" onCopy={copyHandler}>
								{demonstration.map((element, index) => {
									return (
										<div
											key={index}
											style={index === 1 ?
												{ marginLeft: 20 + element[0] * 20, marginTop: 20, } :
												{ marginLeft: 20 + element[0] * 20, }
											}
										>
											<LogicText>{constructDemonstration(element[1])}</LogicText>
										</div>
									);
								})}
							</div>
							<div className="popupWinActions">
								<button className="popupSecondary" onClick={function() {setPopupWin(false);}}>
									Revoir le niveau
								</button>
								{numero + 2 <= nbExo && (
									<button className="popupPrimary" onClick={nextExercise}>Niveau suivant</button>
								)}
							</div>
						</>
					}
				/>
			)}
		</div>
	);
};

export default Game;