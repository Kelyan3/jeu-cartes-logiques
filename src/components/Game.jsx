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

import { delCard, delDeck, delCardWithEquals, checkSubObj, CreatTabObj, findObjectifRelative, stringToLogicText, deckContain as deckContainCore } from "../domain/rules/goals";
import { getSingleSelectedCard as getSingleSelectedCardCore } from "../domain/rules/selection";
import { addToGame as addToGameCore } from "../domain/rules/addToGame";
import { constructDemonstration as constructDemonstrationCore, computeAddLineDemonstration } from "../domain/rules/demonstration";
import { runTiersExclus } from "../domain/rules/tiersExclus";
import { runAddObjectif } from "../domain/rules/addObjectif";
import { runAddCardAnd, runAddCardFuse, runFuseCardAnd } from "../domain/rules/mergeCards";
import { runIsWin } from "../domain/rules/isWin";
import { runTransitivite } from "../domain/rules/transitivite"


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
	 * Adaptateur autour de `runIsWin` : lui fournit les callbacks nécessaires, pour
	 * garder inchangés tous les appels existants à `isWin(...)`.
	 */
	const isWin = (arrayMsg, arrayIndent, tmp, originel) => runIsWin(arrayMsg, arrayIndent, tmp, originel, {
		addToGame, addLineDemonstration, setSavedGame, allFalse, setTabObjectif, setWin, setPopupWin, saveProgress,
	});

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
	 * Objet regroupant les dépendances communes à `addCardAnd`, `addCardFuse` et
	 * `fuseCardAnd`, pour éviter de le reconstruire 3 fois.
	 */
	const cardActionDeps = () => ({
		navigation, win, nbSelec, selecDeck1, selecDeck2, selecCard1, selecCard2, game, error, saveGame, addToGame, isWin,
	});

	/**
	 * Adaptateur autour de `runAddCardAnd` : garde inchangé l'appel existant à `addCardAnd()`.
	 */
	const addCardAnd = () => runAddCardAnd(cardActionDeps());

	/**
	 * Adaptateur autour de `runAddCardFuse` : garde inchangé l'appel existant à `addCardFuse()`.
	 */
	const addCardFuse = () => runAddCardFuse(cardActionDeps());

	/**
	 * Adaptateur autour de `runFuseCardAnd` : garde inchangé l'appel existant à `fuseCardAnd()`.
	 */
	const fuseCardAnd = () => runFuseCardAnd(cardActionDeps());

	/**
	 * Adaptateur autour de la fonction pure `getSingleSelectedCardCore` : lui fournit
	 * l'état de sélection et `error` comme callback, pour garder inchangé l'appel
	 * existant à `getSingleSelectedCard()`.
	 */
	const getSingleSelectedCard = () => getSingleSelectedCardCore({
		selecCard1, selecCard2, selecDeck1, selecDeck2, nbSelec, onError: error,
	});

	/**
	 * Adaptateur autour de la fonction pure `runAddObjectif` : lui fournit tout l'état
	 * et les callbacks nécessaires, pour garder inchangé l'appel existant à
	 * `addObjectif(variant)` (menu "+ Objectif").
	 */
	const addObjectif = (variant) => runAddObjectif(variant, {
		game, mode, numero, tabObjectif, navigation, win,
		setTabObjectif, setIndentationDemonstration, setSavedGame, setMessageTutorial,
		saveGame, addToGame, addLineDemonstration, allFalse, error, deckContain, getSingleSelectedCard,
	});

	/**
	 * Adaptateur autour de la fonction pure `runTiersExclus` : lui fournit l'état de
	 * sélection/jeu et les callbacks nécessaires, pour garder inchangé l'appel existant
	 * à `tiersExclus()` (bouton "Tiers Exclus").
	 */
	const tiersExclus = () => runTiersExclus({
		navigation, win, selecCard1, selecCard2, selecDeck1, selecDeck2, game,
		transformIntoNonCard, error, addToGame, isWin,
	});

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
	 * Adaptateur autour de la fonction pure `deckContainCore` : lui fournit `game`
	 * (état React), pour garder inchangé l'appel existant à `deckContain(deck, card)`.
	 */
	const deckContain = (deck, card) => deckContainCore(game, deck, card);

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
	 * Adaptateur autour de `runTransitivite` : lui fournit tout l'état et les callbacks
	 * nécessaires, pour garder inchangé l'appel existant à `transitivite(variant)`
	 * (menu "Transitivité").
	 */
	const transitivite = (variant) => runTransitivite(variant, {
		navigation, win, nbSelec, selecDeck1, selecDeck2, selecCard1, selecCard2, game, error, addToGame, isWin,
	});

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