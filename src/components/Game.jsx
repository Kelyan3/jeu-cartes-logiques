import { useState } from "react";

import Deck from "./Deck";

import GameActionBar from "./game/GameActionBar";
import GameDemonstration from "./game/GameDemonstration";
import GameToasts from "./game/GameToasts";
import GameWinPopup from "./game/GameWinPopup";

import AddCardPopup from "./create/AddCardPopup";
import FusionPopup from "./create/FusionPopup";
import DeleteCardPopup from "./create/DeleteCardPopup";

import { GameTabProvider } from "../context/GameTabContext";

import { useAuth } from "../hooks/useAuth";
import { useGameFile } from "../hooks/useGameFile";
import { useCardSelection } from "../hooks/useCardSelection";
import { useGamePopups } from "../hooks/useGamePopups";
import { useProgressSave } from "../hooks/useProgressSave";
import { useUnlockedActions } from "../hooks/useUnlockedActions";

import Card from "../domain/Card";
import { computeNextMove, copyGameArray } from "../domain/gameSolver";
import { buildInitialGameSetup, buildInitialTutorialMessage, buildSelectionTutorialMessage, tagDecks } from "../domain/gameInput";

import { delCard, CreatTabObj, deckContain as deckContainCore } from "../domain/rules/goals";
import { getSingleSelectedCard as getSingleSelectedCardCore } from "../domain/rules/selection";
import { addToGame as addToGameCore } from "../domain/rules/addToGame";
import { constructDemonstration as constructDemonstrationCore, computeAddLineDemonstration } from "../domain/rules/demonstration";
import { runTiersExclus } from "../domain/rules/tiersExclus";
import { runAddObjectif } from "../domain/rules/addObjectif";
import { runAddCardAnd, runAddCardFuse, runFuseCardAnd } from "../domain/rules/mergeCards";
import { runIsWin } from "../domain/rules/isWin";
import { runTransitivite } from "../domain/rules/transitivite";
import { runChoixCouleur, runChoixLiaison, runDeleteCard, runConfirmDeleteCard } from "../domain/rules/createMode";


const Game = ({ mode, ex, numero, nbExo }) => {
	const { user } = useAuth();

	const { isActionUnlocked } = useUnlockedActions(mode, user);

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

	const { openFileJson, saveAsFile, openFile } = useGameFile(game, setGame);

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

	/**
	 * Résultat de la partie gagnée, affiché dans le popup de victoire.
	 */
	const [gameResult, setGameResult] = useState(null);

	const { incrementMoves, saveProgress, nextExercise } = useProgressSave({
		mode, numero, nbExo, user, setPopupWin, setSaveProgressFailed, setGameResult,
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
		tmp.forEach((deck) => {
			deck.forEach((card) => {
				card.setOld(false);
			});
		});
	};

	/**
	 * Désélectionne toutes les cartes dans le tableau reçu et devient le jeu.
	 *
	 * @param {Card[][]} tmp - tableau du jeu temporaire
	 */
	const allFalse = (tmp) => {
		resetSelection();

		// On désélectionne toutes les cartes du jeu passé en paramètre
		tmp.forEach((deck) => {
			deck.forEach((card) => {
				card.select(false);
			});
		});

		// On actualise le jeu
		setGame(tagDecks(tmp));
	};

	/**
	 * Désélectionne toutes les cartes du jeu.
	 */
	const allFalseGame = () => {
		resetSelection();

		// Copie du jeu actuel
		const tmp = copyGameArray(game);

		// On désélectionne toutes les cartes du jeu actuel
		tmp.forEach((deck) => {
			deck.forEach((card) => {
				card.select(false);
			});
		});

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
	 * Objet regroupant les dépendances communes aux actions du mode Création.
	 */
	const createModeDeps = () => ({
		game, indiceDeckAddCard, selecDeck1, selecCard1, selecDeck2, selecCard2,
		setPopupFusion, setPopupDeleteCard, saveGame, addToGame, allFalse, allFalseGame, delCard,
	});

	const choixCouleur = (event) => runChoixCouleur(event, createModeDeps());
	const choixLiaison = (event) => runChoixLiaison(event, createModeDeps());
	const deleteCard = () => runDeleteCard(createModeDeps());
	const confirmDeleteCard = () => runConfirmDeleteCard(createModeDeps());

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

		const tmp = copyGameArray(game);
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
	 */
	const copyGame = () => copyGameArray(game);

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

				<GameActionBar
					mode={mode}
					numero={numero}
					isActionUnlocked={isActionUnlocked}
					addCardAnd={addCardAnd}
					addCardFuse={addCardFuse}
					fuseCardAnd={fuseCardAnd}
					addObjectif={addObjectif}
					tiersExclus={tiersExclus}
					transitivite={transitivite}
				/>

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
							<span className="tooltiptext">Affichage Simplifié</span>
						</label>
					</span>
				}
			</div>

			<GameToasts
				mode={mode}
				messageTutorial={messageTutorial}
				messageErreur={messageErreur}
			/>

			<GameTabProvider value={game}>
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
			</GameTabProvider>

			<GameDemonstration
				demonstration={demonstration}
				constructDemonstration={constructDemonstration}
				onLineClick={demonstrationClickHandler}
				onCopy={copyHandler}
			/>

			<AddCardPopup
				open={popupAddCard}
				onChooseColor={choixCouleur}
				onClose={() => setPopupAddCard(false)}
			/>

			<FusionPopup
				open={popupFusion}
				onChooseConnector={choixLiaison}
				onClose={() => setPopupFusion(false)}
			/>

			<DeleteCardPopup
				open={popupDeleteCard}
				card={game[selecDeck1]?.[selecCard1]}
				deckIndex={selecDeck1}
				cardIndex={selecCard1}
				onConfirm={deleteCard}
				onCancel={() => setPopupDeleteCard(false)}
			/>

			<GameWinPopup
				open={popupWin}
				mode={mode}
				numero={numero}
				nbExo={nbExo}
				saveProgressFailed={saveProgressFailed}
				gameResult={gameResult}
				demonstration={demonstration}
				constructDemonstration={constructDemonstration}
				onCopy={copyHandler}
				onClose={() => setPopupWin(false)}
				onNext={nextExercise}
			/>
		</div>
	);
};

export default Game;