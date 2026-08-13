import { useState, useEffect, useRef } from "react";

import Deck from "./Deck";
import Popup from "./Popup";
import LogicText from "./LogicText";
import Card from "../domain/Card";

import { API_BASE_URL as API } from "../config/api";

import { GameTab } from "../context/GameTab";
import { useAuth } from "../hooks/useAuth";
import { useGameFile } from "../hooks/useGameFile";
import { useCardSelection } from "../hooks/useCardSelection";
import { useGamePopups } from "../hooks/useGamePopups";
import { useProgressSave } from "../hooks/useProgressSave";
import { useClickOutsideMenu } from "../hooks/useClickOutsideMenu";
import { useUnlockedActions } from "../hooks/useUnlockedActions";

import { containCard, containCardSymmetric, computeNextMove } from "../domain/gameSolver";
import { toClass, gameInput, buildInitialGameSetup, buildInitialTutorialMessage, buildSelectionTutorialMessage, tagDecks } from "../domain/gameInput";

import { delCard, delDeck, delCardWithEquals, checkSubObj, CreatTabObj, findObjectifRelative, stringToLogicText } from "../domain/rules/goals";
import { addToGame as addToGameCore } from "../domain/rules/addToGame";
import { constructDemonstration as constructDemonstrationCore, computeAddLineDemonstration } from "../domain/rules/demonstration";


const Game = ({ mode, ex, numero, nbExo }) => {
	const { user } = useAuth();

	const { isActionUnlocked } = useUnlockedActions(mode, user);

	/**
	 * Ouverture/fermeture du menu déroulant "+ Objectif" (3 sous-fonctionnalités).
	 * Se ferme au clic en dehors du menu (bouton compris).
	 */
	const { isOpen: objectifMenuOpen, setIsOpen: setObjectifMenuOpen, menuRef: objectifMenuRef } = useClickOutsideMenu();

	/**
	 * Ouverture/fermeture du menu déroulant "Transitivité" (3 sous-fonctionnalités).
	 * Même logique que pour le menu "+ Objectif" ci-dessus.
	 */
	const { isOpen: transitiviteMenuOpen, setIsOpen: setTransitiviteMenuOpen, menuRef: transitiviteMenuRef } = useClickOutsideMenu();

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

	const { openFileJson, gameOutput, saveAsFile, openFile } = useGameFile(game, setGame);

	const {
		nbSelec,
		selecDeck1, selecCard1,
		selecDeck2, selecCard2,
		cardHelp, setCardHelp,
		cardHelp2, setCardHelp2,
		selectCard, resetSelection,
	} = useCardSelection();

	// Bouton "Aide" désactivé temporairement.
	const HELP_BUTTON_ENABLED = false;

	const {
		popupAddCard, setPopupAddCard,
		popupDeleteCard, setPopupDeleteCard,
		indiceDeckAddCard, setIndiceDeckAddCard,
		popupFusion, setPopupFusion,
		popupWin, setPopupWin,
		saveProgressFailed, setSaveProgressFailed,
	} = useGamePopups();

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

	const { incrementMoves, saveProgress, nextExercise } = useProgressSave({
		mode, numero, nbExo, user, setPopupWin, setSaveProgressFailed,
	});


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

			/**
			 * Copie du jeu dans tmp (copie aussi le deck concerné, pas seulement
			 * le tableau extérieur, pour ne pas modifier `game` avant setGame())
			 */
			let tmp = game.map((d, di) => (di === i ? [...d] : d));

			setAllCardOld(tmp);

			const { nbSelec: tmpNbselec, selecDeck1: tmpSelecDeck1, selecDeck2: tmpSelecDeck2 } = selectCard(i, j, tmp);

			setGame(tagDecks(tmp));

			if (tmpNbselec === 2 && mode === "Create")
				setPopupFusion(true);

			if (mode === "Tutorial")
			{
				const tutorialMessage = buildSelectionTutorialMessage(numero, tmpNbselec, tmpSelecDeck1, tmpSelecDeck2, game.length);
				if (tutorialMessage !== null)
					setMessageTutorial(tutorialMessage);
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
		resetSelection();

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
		resetSelection();

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

		const findIntermediateDeckFor = (cardObj) => {
			const findObj = findObjectifRelative(cardObj, tmp);
			if (findObj === -1)
				return -1;

			const hypothesis = tmp[tmp.length - 1][findObj].left;
			for (let d = 1; d < tmp.length - 1; d++)
			{
				if (containCard(tmp, d, hypothesis))
					return d;
			}

			return -1;
		};

		const checkWinForEveryObjectif = (cardArray) => {
			const cardObj = cardArray[0];
			const numObj = cardArray[1][0];
			const isLinked = cardArray[1][2];

			const intermediaireDeck = numObj === 0 ? 0 : findIntermediateDeckFor(cardObj);

			const checkWin = (card, deckIndex) => {
				if (card == null || cardObj == null)
					return;

				if (modif || bool)
					return;

				if (!card.equals(cardObj) && card.color !== "white")
					return;

				// Objectif principal.
				if (numObj === 0)
				{
					bool = true;
					return;
				}

				// La carte doit être dans la bonne LPU ou dans le deck de départ.
				if (deckIndex !== 0 && deckIndex !== intermediaireDeck)
					return;

				if (intermediaireDeck === -1)
					return;

				const findObj = findObjectifRelative(cardObj, tmp);
				if (findObj === -1)
					return;

				modif = true;

				const tmpCard = tmp[tmp.length - 1][findObj].copy();

				// Remonte "A ⇒ B" dans le deck juste au-dessus de la LPU
				if (!addToGame(tmp, intermediaireDeck - 1, tmpCard))
					return;

				// Retire B des objectifs.
				tmp[tmp.length - 1] = delCardWithEquals(tmp[tmp.length - 1], cardObj);

				// Retire "A ⇒ B" du deck objectif s'il était lié.
				if (findObj !== 0 && isLinked)
					tmp[tmp.length - 1] = delCard(tmp[tmp.length - 1], findObj);

				// Supprime la LPU intermédiaire trouvée (plus delDeck(tmp, numObj))
				tmp = delDeck(tmp, intermediaireDeck);

				arrayMsg.push(["On a ", tmpCard.copy(), "."]);
				arrayIndent.push(-1);
			};

			// Parcourt tous les decks utiles : départ + LPU intermédiaires.
			for (let d = 0; d < tmp.length - 1; d++)
				tmp[d].forEach((card) => checkWin(card, d));

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

			// Tag des lignes ajoutées par l'action que l'on annule.
			const tag = tmpLastGame.length - 1;

			let demonstrationTmp = [...demonstration];
			let tabIndentationTmp = [...tabIndentation];
			let tabIndiceTmp = [...tabIndiceDemonstration];

			// Retire toutes les lignes de démonstration associées à cette action.
			while (tabIndiceTmp.length > 0 && tabIndiceTmp[tabIndiceTmp.length - 1] === tag)
			{
				demonstrationTmp.pop();
				tabIndentationTmp.pop();
				tabIndiceTmp.pop();
			}

			setDemonstration(demonstrationTmp);
			setTabIndentation(tabIndentationTmp);
			setTabIndiceDemonstration(tabIndiceTmp);

			tmpLastGame.pop();
			setLastGame(tmpLastGame);

			// Retour au tout début : restaurer la démonstration initiale.
			if (tmpLastGame.length === 0)
			{
				setDemonstration(initialSetup.demonstration);
				setTabIndentation([0]);
				setTabIndiceDemonstration([0]);
				setIndentationDemonstration(0);
			}
		}
		else
		{
			allFalseGame();
			setDemonstration(initialSetup.demonstration); // S'il n'y a plus d'historique, on force la démonstration initiale.
			setTabIndentation([0]);
			setTabIndiceDemonstration([0]);
			setIndentationDemonstration(0);
		}
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

		// Comptabilise ce coup pour le calcul du score
		incrementMoves();
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
	 * Vérifie qu'une seule carte est sélectionnée et renvoie ses coordonnées [deckI, cardI].
	 * Renvoie null si la sélection n'est pas valide (un message d'erreur a alors déjà
	 * été affiché). Factorisé pour être partagé par les 3 variantes du bouton "+ Objectif".
	 */
	function getSingleSelectedCard()
	{
		// S'il n'y a qu'une carte de sélectionné
		if ((selecCard1 !== -1 && selecCard2 === -1 && selecDeck1 !== -1 && selecDeck2 === -1) ||
			(selecCard1 === -1 && selecCard2 !== -1 && selecDeck1 === -1 && selecDeck2 !== -1))
			return [Math.max(selecDeck1, selecDeck2), Math.max(selecCard1, selecCard2)];

		if (nbSelec > 1)
			error("Vous devez sélectionner une seule carte !");
		else if (nbSelec === 0)
			error("Vous devez sélectionner une carte !");

		return null;
	}

	/**
	 * Variante "=> dans objectif" : la carte sélectionnée (dans le deck objectif, liaison
	 * "=>") devient un objectif secondaire : sa partie droite reste dans l'objectif, sa
	 * partie gauche est déposée dans un nouveau deck LPU intermédiaire à compléter.
	 */
	function addObjectifDepuisObjectif(deckI, cardI)
	{
		// Copie du jeu actuel
		let tmp = [...game];

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
		let secondObjectif = game[deckI][cardI].right.copy();

		// Rajoute le second objectif dans le deck objectif
		if (!addToGame(tmp, tmp.length - 1, secondObjectif))
			return;

		// Copie de la partie gauche de la carte sélectionnée
		let tmpCard = tmp[deckI][cardI].left.copy();

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

	/**
	 * Variante "=> dans LPU" : la carte sélectionnée (dans une LPU, liaison "=>", partie
	 * gauche elle-même munie d'une liaison "=>") a sa partie gauche déposée directement
	 * dans le deck objectif. Ce n'est pas considéré comme un objectif secondaire.
	 */
	function addObjectifDepuisLPU(deckI, cardI)
	{
		// Copie du jeu actuel
		let tmp = [...game];

		// Sauvegarde du jeu actuel
		saveGame();

		// Copie de la partie gauche de la carte sélectionnée
		let secondObjectif = tmp[deckI][cardI].left.copy();

		// Met la carte copiée dans le deck objectif (ce n'est pas un objectif secondaire)
		if (!addToGame(tmp, tmp.length - 1, secondObjectif))
			return;

		addLineDemonstration([["Montrons ", secondObjectif.copy(), ".", ], ], [0]);

		// Met à jour le jeu & désélectionne toutes les cartes
		allFalse(tmp);
		setSavedGame(tmp);
	}

	/**
	 * Variante "et" : la carte sélectionnée (dans le deck objectif, carte "et") a chacune
	 * de ses deux parties ajoutée comme nouvel objectif à démontrer, pour celles qui ont
	 * elles-mêmes une liaison "=>".
	 */
	function addObjectifEt(deckI, cardI)
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

	/**
	 * Fonction appelée après avoir choisi une des 3 options du menu "+ Objectif".
	 *
	 * @param {"objectif"|"lpu"|"et"} variant - la sous-fonctionnalité choisie :
	 *   "objectif" : la carte sélectionnée doit être dans le deck objectif, liaison "=>".
	 *   "lpu"      : la carte sélectionnée doit être dans une LPU, liaison "=>" et partie
	 *                gauche elle-même munie d'une liaison "=>".
	 *   "et"       : la carte sélectionnée doit être dans le deck objectif, carte "et".
	 *
	 * Une seule & unique carte doit être sélectionnée, sinon un popup d'erreur apparaît.
	 * Si la carte sélectionnée ne correspond pas à la variante choisie, un message
	 * d'erreur spécifique à cette variante est affiché plutôt qu'un message générique.
	 */
	const addObjectif = (variant) => {
		if (navigation || win)
			return;

		const selection = getSingleSelectedCard();
		if (selection === null)
			return;

		const [deckI, cardI] = selection;
		const isObjectifDeck = deckI === game.length - 1;

		// Si le 1er sous-objectif choisi n'est pas créé à partir de l'objectif principal
		if (!isObjectifDeck && game.length <= 2)
		{
			error("Le premier objectif secondaire doit être créé à l'aide de l'objectif principal !");
			return;
		}

		// Si le sous-objectif existe déjà
		if (deckContain(deckI, cardI))
		{
			error("Cet objectif existe déjà !");
			return;
		}

		const card = game[deckI][cardI];

		if (variant === "objectif")
		{
			if (!isObjectifDeck)
				error("Ce bouton ne fonctionne que sur une carte de l'objectif !");
			else if (card.link !== "=>")
				error('L\'objectif secondaire doit avoir une liaison "=>" !');
			else
				addObjectifDepuisObjectif(deckI, cardI);
		}
		else if (variant === "lpu")
		{
			if (isObjectifDeck)
				error("Ce bouton ne fonctionne que sur une carte de la LPU !");
			else if (card.link !== "=>")
				error('L\'objectif secondaire doit avoir une liaison "=>" !');
			else if (!card.left.haveImpliqueLinkRecur())
				error('La partie gauche de l\'objectif secondaire doit avoir une liaison "=>" !');
			else
				addObjectifDepuisLPU(deckI, cardI);
		}
		else if (variant === "et")
		{
			if (!isObjectifDeck)
				error("Ce bouton ne fonctionne que sur une carte de l'objectif !");
			else if (!card.isCardEtObjectif())
				error('La carte sélectionnée doit être une carte "et" contenant au moins une liaison "=>" !');
			else
				addObjectifEt(deckI, cardI);
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
	 * Adaptateur autour de la fonction pure `constructDemonstrationCore` : lui fournit
	 * `affichageSimple` (état React), pour garder inchangés tous les appels existants.
	 */
	const constructDemonstration = (tab) => constructDemonstrationCore(tab, affichageSimple);

	/**
	 * Adaptateur autour de la fonction pure `computeAddLineDemonstration` : lui fournit
	 * l'état actuel de la démonstration, puis enregistre le résultat calculé via les
	 * setters React. Garde inchangés tous les appels existants à `addLineDemonstration(...)`.
	 */
	const addLineDemonstration = (msgArray, indentationArray, num, reset) => {
		const result = computeAddLineDemonstration(
			{ demonstration, tabIndentation, indentationDemonstration, tabIndiceDemonstration, lastGameLength: lastGame.length },
			msgArray,
			indentationArray,
			num,
			reset,
		);

		setDemonstration(result.demonstration);
		setTabIndentation(result.tabIndentation);
		setIndentationDemonstration(result.indentationDemonstration);
		setTabIndiceDemonstration(result.tabIndiceDemonstration);
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
	 * Adaptateur autour de la fonction pure `addToGameCore` (domain/rules/addToGame) :
	 * lui fournit `error` comme callback d'erreur, pour garder inchangés tous les
	 * appels existants à `addToGame(...)` dans ce composant.
	 */
	const addToGame = (tmp, deckId, card, defaultEmitError) =>
		addToGameCore(tmp, deckId, card, (message) => error(message, false), defaultEmitError);

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
	 * Vérifie la sélection commune aux 3 variantes du bouton Transitivité : exactement
	 * 2 cartes sélectionnées, ni l'une ni l'autre dans le deck objectif.
	 *
	 * @returns {[number, Card, Card]|null} [finalDeck, card1, card2], ou null si la
	 * sélection n'est pas valide (un message d'erreur a alors déjà été affiché).
	 */
	function getTransitiviteSelection()
	{
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
	function finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, sign, skipAdd)
	{
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
	function transitiviteArrow()
	{
		const selection = getTransitiviteSelection();
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

		finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, "=>", false);
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
	function transitiviteEquiv(symmetric)
	{
		const selection = getTransitiviteSelection();
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
		finalizeTransitivite(finalDeck, cardToAdd, cardLeft, cardMiddle, cardRight, "<=>", isDuplicate);
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
	 */
	const transitivite = (variant) => {
		if (navigation || win)
			return;

		if (variant === "arrow")
			transitiviteArrow();
		else if (variant === "equiv")
			transitiviteEquiv(false);
		else if (variant === "equiv_sym")
			transitiviteEquiv(true);
	};

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

				{HELP_BUTTON_ENABLED && mode !== "Create" && (
					<div>
						<button id="aide" className="buttonAction " onClick={getNextMove}>
							<span className="buttonFormula">?</span>
							<span className="tooltiptext">Aide</span>
						</button>
					</div>
				)}

				{/* Bouton pour obtenir les 2 parties d'une carte "et" */}
				{mode !== "Create" && isActionUnlocked("addAnd") && (
					<div>
						<button id="addAnd" className={"buttonAction " + (mode === "Tutorial" && numero === 0 ? "boutonSelection" : "")} onClick={addCardAnd}>
							<span className="buttonFormula">[P ∧ Q] → [P] [Q]</span>
							<span className="tooltiptext">Séparation</span>
						</button>
					</div>
				)}

				{/* Bouton pour obtenir la partie droite d'une carte "=>" si l'on a sélectionné une autre carte qui est égale à la partie gauche */}
				{mode !== "Create" && isActionUnlocked("addImplique") && (
					<div>
						<button id="addImplique" className={"buttonAction " + (mode === "Tutorial" && numero === 1 ? "boutonSelection" : "")} onClick={addCardFuse}>
							<span className="buttonFormula">[P] [P ⇒ Q] → [Q]</span>
							<span className="tooltiptext">Implique</span>
						</button>
					</div>
				)}

				{/* Fusionne 2 cartes (taille double max) et crée une 3ème carte composée de la partie gauche (1ère carte sélectionnée) & la partie droite (2ème carte sélectionnée). La carte créée aura une liaison "et" */}
				{mode !== "Create" && isActionUnlocked("fuseAnd") && (
					<div>
						<button id="fuseAnd" className={"buttonAction " + (mode === "Tutorial" && numero === 2 ? "boutonSelection" : "")} onClick={fuseCardAnd}>
							<span className="buttonFormula">[P] [Q] → [P ∧ Q]</span>
							<span className="tooltiptext">Fusion</span>
						</button>
					</div>
				)}

				{/* Menu déroulant "+ Objectif" : 3 sous-fonctionnalités débloquées indépendamment */}
				{mode !== "Create" &&
					(isActionUnlocked("addGoal_objectif") || isActionUnlocked("addGoal_lpu") || isActionUnlocked("addGoal_et")) && (
					<div className="actionDropdown" ref={objectifMenuRef}>
						<button
							type="button"
							id="addGoal"
							className="buttonAction"
							onClick={() => setObjectifMenuOpen((open) => !open)}
						>
							<span className="buttonFormula">+ ⚑</span>
							<span className="tooltiptext">+ Objectif</span>
						</button>
						{objectifMenuOpen && (
							<div className="actionDropdownMenu">
								{isActionUnlocked("addGoal_objectif") && (
									<button
										type="button"
										className={mode === "Tutorial" && numero === 3 ? "boutonSelection" : ""}
										onClick={() => { setObjectifMenuOpen(false); addObjectif("objectif"); }}
									>
										{"=> dans objectif"}
									</button>
								)}
								{isActionUnlocked("addGoal_lpu") && (
									<button type="button" onClick={() => { setObjectifMenuOpen(false); addObjectif("lpu"); }}>
										{"=> dans LPU"}
									</button>
								)}
								{isActionUnlocked("addGoal_et") && (
									<button type="button" onClick={() => { setObjectifMenuOpen(false); addObjectif("et"); }}>
										et
									</button>
								)}
							</div>
						)}
					</div>
				)}

				{mode !== "Create" && isActionUnlocked("tiersExclus") && (
					<div>
						<button id="tiersExclus" className={"buttonAction " + (mode === "Tutorial" && numero === 6 ? "boutonSelection" : "")} onClick={tiersExclus}>
							<span className="buttonFormula">¬[¬[P]] → [P]</span>
							<span className="tooltiptext">Tiers Exclus</span>
						</button>
					</div>
				)}

				{/* Menu déroulant "Transitivité" : 3 sous-fonctionnalités débloquées indépendamment */}
				{mode !== "Create" &&
					(isActionUnlocked("transitivite_arrow") || isActionUnlocked("transitivite_equiv") || isActionUnlocked("transitivite_equiv_sym")) && (
					<div className="actionDropdown" ref={transitiviteMenuRef}>
						<button
							type="button"
							id="transitivite"
							className="buttonAction"
							onClick={() => setTransitiviteMenuOpen((open) => !open)}
						>
							<span className="buttonFormula">[P ⇒ Q] [Q ⇒ R] → [P ⇒ R]</span>
							<span className="tooltiptext">Transitivité</span>
						</button>
						{transitiviteMenuOpen && (
							<div className="actionDropdownMenu">
								{isActionUnlocked("transitivite_arrow") && (
									<button
										type="button"
										className={mode === "Tutorial" && numero === 4 ? "boutonSelection" : ""}
										onClick={() => { setTransitiviteMenuOpen(false); transitivite("arrow"); }}
									>
										{"=>"}
									</button>
								)}
								{isActionUnlocked("transitivite_equiv") && (
									<button
										type="button"
										className={mode === "Tutorial" && numero === 5 ? "boutonSelection" : ""}
										onClick={() => { setTransitiviteMenuOpen(false); transitivite("equiv"); }}
									>
										{"<=>"}
									</button>
								)}
								{isActionUnlocked("transitivite_equiv_sym") && (
									<button type="button" onClick={() => { setTransitiviteMenuOpen(false); transitivite("equiv_sym"); }}>
										{"<=> (symétrique)"}
									</button>
								)}
							</div>
						)}
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
							{saveProgressFailed && (
								<p className="saveProgressWarning">
									⚠ Votre progression n'a pas pu être enregistrée. Vérifiez votre connexion.
								</p>
							)}
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