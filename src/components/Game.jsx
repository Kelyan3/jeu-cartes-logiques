import { useState, useEffect, useMemo } from "react";
import { Clock, Download, FileJson, Hash, Lightbulb, Play, Square, Undo2 } from "lucide-react";

import Deck from "./Deck";

import GameActionBar from "./game/GameActionBar";
import GamePopups from "./game/GamePopups";
import GameDemonstration from "./game/GameDemonstration";
import GameToasts from "./game/GameToasts";

import { GameTabProvider } from "../context/GameTabContext";

import { useAuth } from "../hooks/useAuth";
import { useGameFile } from "../hooks/useGameFile";
import { useCardSelection } from "../hooks/useCardSelection";
import { useGamePopups } from "../hooks/useGamePopups";
import { useProgressSave } from "../hooks/useProgressSave";
import { useUnlockedActions } from "../hooks/useUnlockedActions";

import Card from "../domain/Card";
import { computeNextMove, copyGameArray } from "../domain/gameSolver";
import { buildInitialGameSetup, buildInitialTutorialMessage, buildSelectionTutorialMessage, ensureDeckIds } from "../domain/gameInput";

import { removeCard, deckContain as deckContainCore } from "../domain/rules/goals";
import { getSingleSelectedCard as getSingleSelectedCardCore } from "../domain/rules/selection";
import { addToGame as addToGameCore } from "../domain/rules/addToGame";
import { constructDemonstration as constructDemonstrationCore, computeAddLineDemonstration } from "../domain/rules/demonstration";
import { runTiersExclus } from "../domain/rules/tiersExclus";
import { runAddObjectif } from "../domain/rules/addObjectif";
import { runAddCardAnd, runAddCardFuse, runFuseCardAnd } from "../domain/rules/mergeCards";
import { runIsWin } from "../domain/rules/isWin";
import { runTransitivite } from "../domain/rules/transitivite";
import { runChooseColor, runChooseConnector, runDeleteCard, runConfirmDeleteCard } from "../domain/rules/createMode";
import { computeUndo } from "../domain/rules/history";

import { formatTime } from "../utils/formatTime";
import { formatCopiedDemonstrationText } from "../utils/clipboardFormat";


const Game = ({ mode, ex, levelIndex, totalLevelCount }) => {
	const { user } = useAuth();

	const { isActionUnlocked, actionsReady } = useUnlockedActions(mode, user);

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
		selectedCardCount,
		firstSelectedDeckIndex, firstSelectedCardIndex,
		secondSelectedDeckIndex, secondSelectedCardIndex,
		helpCardPos, setHelpCardPos,
		helpCardPos2, setHelpCardPos2,
		selectCard, resetSelection,
	} = useCardSelection();

	const {
		popupAddCard, setPopupAddCard,
		popupDeleteCard, setPopupDeleteCard,
		addCardDeckIndex, setAddCardDeckIndex,
		popupFusion, setPopupFusion,
		popupWin, setPopupWin,
		saveProgressFailed, setSaveProgressFailed,
	} = useGamePopups();

	// Tableau de sauvegarde de copie de l'ancien tableau "game"
	const [gameHistory, setGameHistory] = useState([]);

	/**
	 * Message à afficher en cas de coup illégal. Si le message est "" on affiche rien.
	 */
	const [errorMessage, setErrorMessage] = useState("");

	/**
	 * Message tutoriel à afficher en mode tutoriel.
	 * Attention c'est un tableau de strings.
	 * Si le message est "" on affiche rien.
	 */
	const [tutorialMessage, setTutorialMessage] = useState(() => buildInitialTutorialMessage(levelIndex));

	/**
	 * Tableau des objectifs.
	 * Sous cette forme : [numero objectif, indice de la carte dans le deck, (numero != indice)]
	 * Il se peut qu'il y ait des cartes entre les sous-objectifs comme dans l'exercice 5.
	 */
	const [objectives, setObjectives] = useState([[0, 0, false]]);

	const [demonstration, setDemonstration] = useState(initialSetup.demonstration);

	const [indentationDemonstration, setIndentationDemonstration] = useState(0);

	const [tabIndiceDemonstration, setTabIndiceDemonstration] = useState([-1]);

	const [navigation, setNavigation] = useState(false);

	const [win, setWin] = useState(false);

	const [savedGame, setSavedGame] = useState(initialSetup.game);

	const [tabIndentation, setTabIndentation] = useState([0]);

	const [affichageSimple, setAffichageSimple] = useState(true);

	const [isTestingMode, setIsTestingMode] = useState(false);
	const [preTestState, setPreTestState] = useState(null);

	/**
	 * Résultat de la partie gagnée, affiché dans le popup de victoire.
	 */
	const [gameResult, setGameResult] = useState(null);

	const { incrementMoves, saveProgress, nextExercise, startTimer, displaySeconds, displayMoves } = useProgressSave({
		mode, levelIndex, totalLevelCount, user, setPopupWin, setSaveProgressFailed, setGameResult,
	});

	/**
	 * Démarre le chrono une fois les boutons d'action réellement affichés.
	 */
	useEffect(() => {
		if (actionsReady)
			startTimer();
	}, [actionsReady, startTimer]);

	/**
	 * Synchronise la zone de démonstration en temps réel avec les cartes présentes
	 * sur le plateau en mode "Create" (LPU -> "On a ...", Objectif -> "Montrons ...").
	 */
	const computedCreateDemonstration = useMemo(() => {
		if (mode !== "Create" || isTestingMode)
			return null;

		let demonstrationLines = [];
		if (game[0])
		{
			game[0].forEach((element) => {
				demonstrationLines.push("On a ");
				demonstrationLines.push(element.copy());
				demonstrationLines.push(". ");
			});
		}

		if (game.length >= 2 && game[1] && game[1].length > 0)
		{
			demonstrationLines.push("Montrons ");
			demonstrationLines.push(game[1][0].copy());
			demonstrationLines.push(".");
		}

		return demonstrationLines.length > 0 ? [[0, demonstrationLines]] : [];
	}, [game, mode, isTestingMode]);

	const activeDemonstration = (mode === "Create" && !isTestingMode && computedCreateDemonstration !== null)
		? computedCreateDemonstration
		: demonstration;

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
			setErrorMessage("");

			/**
			 * Copie du jeu dans nextGameState (copie aussi le deck concerné, pas seulement
			 * le tableau extérieur, pour ne pas modifier `game` avant setGame())
			 */
			let nextGameState = game.map((d, di) => (di === i ? [...d] : d));

			setAllCardOld(nextGameState);

			const { selectedCardCount: nextSelectedCardCount, firstSelectedDeckIndex: nextFirstSelectedDeckIndex, secondSelectedDeckIndex: nextSecondSelectedDeckIndex } = selectCard(i, j, nextGameState);

			setGame(ensureDeckIds(nextGameState));

			if (nextSelectedCardCount === 2 && mode === "Create" && !isTestingMode)
				setPopupFusion(true);

			if (mode === "Tutorial")
			{
				const nextTutorialMessage = buildSelectionTutorialMessage(levelIndex, nextSelectedCardCount, nextFirstSelectedDeckIndex, nextSecondSelectedDeckIndex, game.length);
				if (nextTutorialMessage !== null)
					setTutorialMessage(nextTutorialMessage);
			}
		}
	};

	/**
	 * Marque toutes les cartes du tableau reçu comme "non nouvelles" (arrête l'animation d'apparition).
	 *
	 * @param {Card[][]} gameState - tableau du jeu temporaire
	 */
	const setAllCardOld = (gameState) => {
		gameState.forEach((deck) => {
			deck.forEach((card) => {
				card.setNew(false);
			});
		});
	};

	/**
	 * Désélectionne toutes les cartes, puis met à jour le state `game`.
	 * Si `gameState` est fourni, on l'utilise (déjà une copie de travail) ;
	 * sinon on part d'une copie du jeu courant.
	 *
	 * @param {Card[][]} [gameState]
	 */
	const clearSelection = (gameState) => {
		resetSelection();

		const nextGame = gameState ?? copyGameArray(game);

		nextGame.forEach((deck) => {
			deck.forEach((card) => {
				card.select(false);
			});
		});

		setGame(ensureDeckIds(nextGame));
	};

	/**
	 * /!\ Attention cette fonction doit être uniquement appelée en mode Create ou pour faire des tests !
	 * Fait apparaître le popup qui nous demande la couleur de la carte qu'on veut ajouter.
	 *
	 * @param {number} deckIndex - l'indice du deck où l'on ajoute une carte
	 */
	const addCard = (deckIndex) => {
		// Indique dans quel deck on veut ajouter une carte
		setAddCardDeckIndex(deckIndex);

		// Affiche le popup pour ajouter une carte simple
		setPopupAddCard(true);
	};

	/**
	 * Objet regroupant les dépendances communes aux actions du mode Création.
	 */
	const createModeDeps = () => ({
		game, addCardDeckIndex, firstSelectedDeckIndex, firstSelectedCardIndex, secondSelectedDeckIndex, secondSelectedCardIndex,
		setPopupFusion, setPopupDeleteCard, saveGame, addToGame, clearSelection, removeCard,
	});

	const chooseColor = (event) => runChooseColor(event, createModeDeps());
	const chooseConnector = (event) => runChooseConnector(event, createModeDeps());
	const deleteCard = () => runDeleteCard(createModeDeps());
	const confirmDeleteCard = () => runConfirmDeleteCard(createModeDeps());

	const returnNonCard = (gameState) => {
		let deckI = Math.max(firstSelectedDeckIndex, secondSelectedDeckIndex);
		let cardI = Math.max(firstSelectedCardIndex, secondSelectedCardIndex);
		const futureCardNon = gameState[deckI][cardI].copy();

		let cardToAdd = new Card(
			0,
			null,
			false,
			"=>",
			futureCardNon,
			new Card(1, "white", false, "", null, null, true),
			true
		);

		return cardToAdd;
	};
	
	/**
	 * Transforme la carte sélectionnée en sa version "négation" (ajoute une carte
	 * "carte => Faux" au deck), si une carte est bien sélectionnée.
	 */
	const transformIntoNonCard = () => {
		if (!(firstSelectedCardIndex !== -1 && firstSelectedDeckIndex !== -1))
		{
			clearSelection();
			return;
		}

		saveGame();

		const gameState = copyGameArray(game);
		if (!addToGame(gameState, firstSelectedDeckIndex, returnNonCard(gameState)))
			return;

		clearSelection(gameState);
	};

	/**
	 * Adaptateur autour de `runIsWin` : lui fournit les callbacks nécessaires, pour
	 * garder inchangés tous les appels existants à `isWin(...)`.
	 */
	const isWin = (arrayMsg, arrayIndent, gameState, originel=true) => runIsWin(arrayMsg, arrayIndent, gameState, originel, {
		addToGame, addLineDemonstration, setSavedGame, clearSelection, setObjectives, setWin, setPopupWin, saveProgress,
	});

	/**
	 * Fonction appelée après avoir appuyé sur le bouton "Retour arrière".
	 */
	const undo = () => {
		if (navigation || win)
			return;

		const result = computeUndo({
			gameHistory, demonstration, tabIndentation, tabIndiceDemonstration,
			initialDemonstration: initialSetup.demonstration,
		});

		if (result.hasHistory)
		{
			clearSelection(result.futureGame);
			setSavedGame(result.futureGame);
			setGameHistory(result.gameHistory);
		}
		else
			clearSelection();

		setIndentationDemonstration(result.indentationDemonstration);
		setDemonstration(result.demonstration);
		setTabIndentation(result.tabIndentation);
		setTabIndiceDemonstration(result.tabIndiceDemonstration);
	};

	/**
	 * Sauvegarde une copie de l'état actuel du jeu dans l'historique ({@link gameHistory}),
	 * pour permettre un retour en arrière ultérieur.
	 */
	const saveGame = () => {
		// Copie du tableau de sauvegarde
		let historyCopy = [...gameHistory];

		// Copie du jeu actuel
		let saveGameTmp = copyGame();

		// Ajoute le jeu actuel dans le tableau des sauvegardes
		historyCopy.push(saveGameTmp);

		// Met à jour le tableau des sauvegardes
		setGameHistory(historyCopy);

		// Comptabilise ce coup pour le calcul du score
		incrementMoves();
	};

	/**
	 * Objet regroupant les dépendances communes à `addCardAnd`, `addCardFuse` et
	 * `fuseCardAnd`, pour éviter de le reconstruire 3 fois.
	 */
	const cardActionDeps = () => ({
		navigation, win, selectedCardCount, firstSelectedDeckIndex, secondSelectedDeckIndex, firstSelectedCardIndex, secondSelectedCardIndex, game, error, saveGame, addToGame, isWin,
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
		firstSelectedCardIndex, secondSelectedCardIndex, firstSelectedDeckIndex, secondSelectedDeckIndex, selectedCardCount, onError: error,
	});

	/**
	 * Adaptateur autour de la fonction pure `runAddObjectif` : lui fournit tout l'état
	 * et les callbacks nécessaires, pour garder inchangé l'appel existant à
	 * `addObjectif(variant)` (menu "+ Objectif").
	 */
	const addObjectif = (variant) => runAddObjectif(variant, {
		game, mode, levelIndex, objectives, navigation, win,
		setObjectives, setIndentationDemonstration, setSavedGame, setTutorialMessage,
		saveGame, addToGame, addLineDemonstration, clearSelection, error, deckContain, getSingleSelectedCard,
	});

	/**
	 * Adaptateur autour de la fonction pure `runTiersExclus` : lui fournit l'état de
	 * sélection/jeu et les callbacks nécessaires, pour garder inchangé l'appel existant
	 * à `tiersExclus()` (bouton "Tiers Exclus").
	 */
	const tiersExclus = () => runTiersExclus({
		navigation, win, firstSelectedCardIndex, secondSelectedCardIndex, firstSelectedDeckIndex, secondSelectedDeckIndex, game,
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
	const addLineDemonstration = (msgArray, indentationArray) => {
		const result = computeAddLineDemonstration(
			{ demonstration, tabIndentation, indentationDemonstration, tabIndiceDemonstration, lastGameLength: gameHistory.length },
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
		if (mode === "Create" && !isTestingMode)
			return;

		let id = event.currentTarget.id.substring(4, 20);
		let indiceRecu = parseInt(id, 10);
		let indiceRetour = tabIndiceDemonstration[indiceRecu];

		if (indiceRetour === undefined)
			return;

		// Ligne initiale de la consigne : état de départ.
		if (indiceRetour === -1)
		{
			if (gameHistory.length > 0)
			{
				const initialGameArray = gameHistory[0];
				if (initialGameArray === undefined || initialGameArray === null)
					return;

				setNavigation(true);
				clearSelection(copyGameArray(initialGameArray));
			}
			else
			{
				setNavigation(false);
				clearSelection(savedGame);
			}

			return;
		}

		// État juste après l'action taguée indiceRetour.
		const afterIndex = indiceRetour + 1;
		if (afterIndex < gameHistory.length)
		{
			const savedGameState = gameHistory[afterIndex];
			if (savedGameState === undefined || savedGameState === null)
				return;

			setNavigation(true);
			clearSelection(copyGameArray(savedGameState));
		}
		else
		{
			// Dernière action (ou au-delà) : plateau courant.
			setNavigation(false);
			clearSelection(savedGame);
		}
	};

	/**
	 * Affiche un message d'erreur à l'utilisateur.
	 * 
	 * @param {string} message - le message d'erreur à afficher
	 * @param {boolean} [allFalseBool=true] - si false, n'annule pas la sélection de cartes en cours
	 */
	const error = (message, allFalseBool=true) => {
		setErrorMessage(message);

		if (!allFalseBool)
			return;

		clearSelection();
	};

	/**
	 * Adaptateur autour de la fonction pure `addToGameCore` (domain/rules/addToGame) :
	 * lui fournit `error` comme callback d'erreur, pour garder inchangés tous les
	 * appels existants à `addToGame(...)` dans ce composant.
	 */
	const addToGame = (gameState, deckIndex, card, defaultEmitError) =>
		addToGameCore(gameState, deckIndex, card, (message) => error(message, false), defaultEmitError);

	/**
	 * Copie le texte actuellement sélectionné dans la zone de démonstration vers le
	 * presse-papier, reformaté en notation ASCII (voir formatCopiedDemonstrationText).
	 */
	const copyHandler = () => {
		const str = formatCopiedDemonstrationText(window.getSelection().toString());
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
		const nextMove = computeNextMove(game, objectives);
		setHelpCardPos(nextMove.helpCardPos);
		setHelpCardPos2(nextMove.helpCardPos2);
	}

	/**
	 * Adaptateur autour de `runTransitivite` : lui fournit tout l'état et les callbacks
	 * nécessaires, pour garder inchangé l'appel existant à `transitivite(variant)`
	 * (menu "Transitivité").
	 */
	const transitivite = (variant) => runTransitivite(variant, {
			navigation, win, selectedCardCount, firstSelectedDeckIndex, secondSelectedDeckIndex, firstSelectedCardIndex, secondSelectedCardIndex, game, error, addToGame, isWin,
	});

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
				return;

			if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey))
			{
				e.preventDefault();
				undo();
			}
			else if (e.key === 'h' || e.key === 'H')
			{
				if (mode !== "Create") {
					e.preventDefault();
					getNextMove();
				}
			}
			else if (e.key === 'Escape')
			{
				e.preventDefault();
				if (popupAddCard || popupFusion || popupDeleteCard)
				{
					setPopupAddCard(false);
					setPopupFusion(false);
					setPopupDeleteCard(false);
				}
				else
					clearSelection();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gameHistory, game, mode, popupAddCard, popupFusion, popupDeleteCard]);

	return (
		<div className="game">
			<div className="game-toolbar">
				{mode === "Play" && (
					<div className="game-status">
						<div className="status-badge" title="Temps écoulé">
							<Clock size={16} className="status-icon" />
							<span className="status-value">{formatTime(displaySeconds)}</span>
						</div>
						<div className="status-badge" title="Nombre de coups">
							<Hash size={16} className="status-icon" />
							<span className="status-value">{displayMoves}</span>
							<span className="status-label">coup{displayMoves !== 1 ? "s" : ""}</span>
						</div>
					</div>
				)}

				<div className="game-actions">
					{/* Revient à la partie avant l'ajout d'une carte */}
					<button id="back" className="button-action" onClick={undo} title="Retour arrière (Ctrl+Z)">
						<Undo2 size={18} />
					</button>

					{mode !== "Create" && (
						<button id="aide" className="button-action" onClick={getNextMove} title="Aide (H)">
							<Lightbulb size={18} />
						</button>
					)}

					<GameActionBar
						mode={mode === "Create" && isTestingMode ? "Play" : mode}
						levelIndex={levelIndex}
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
						<label className="file-button">
							<FileJson size={18} />
							<span style={{marginLeft: "6px"}}>{openFileJson !== "" ? openFileJson : "Importer un niveau"}</span>
							<input type="file" accept="application/json" onChange={openFile}></input>
						</label>
					)}

					{/* Copie du jeu actuel en format JSON dans le presse-papier */}
					{mode === "Create" && (
						<button className="file-download" onClick={saveAsFile}>
							<Download size={18} />Télécharger le niveau
						</button>
					)}

					{/* Bouton pour tester le niveau en mode Create */}
					{mode === "Create" && (
						<button 
							className="file-download" 
							style={{ padding: "0 12px", display: "flex", gap: "6px", width: "auto" }}
							onClick={() => {
								if (isTestingMode)
								{
									// Sortie du mode test
									setIsTestingMode(false);
									if (preTestState)
									{
										setGame(preTestState.game);
										setDemonstration(preTestState.demonstration);
										setGameHistory([]);
										setIndentationDemonstration(preTestState.indentationDemonstration);
										setTabIndiceDemonstration(preTestState.tabIndiceDemonstration);
										setSavedGame(preTestState.game);
										setTabIndentation(preTestState.tabIndentation);
										setObjectives([[0, 0, false]]);
										setWin(false);
										setPreTestState(null);
									}
								}
								else
								{
									// Entrée en mode test
									setPreTestState({
										game: game.map(d => d.map(c => c.copy())),
										demonstration: demonstration.map(row => [row[0], [...row[1]]]),
										indentationDemonstration,
										tabIndiceDemonstration: [...tabIndiceDemonstration],
										tabIndentation: [...tabIndentation]
									});
									setIsTestingMode(true);
								}
							}}
						>
							{isTestingMode ? <Square size={16} /> : <Play size={16} />}
							<span>{isTestingMode ? "Arrêter le test" : "Tester le niveau"}</span>
						</button>
					)}

					<span id="check-box-simple" title="Affichage complet">
						<input
							type="checkbox"
							id="afficheSimple"
							name="Affichage Simplifié"
							onChange={affichageSimpleHandler}
							checked={affichageSimple}
						/>
						<label htmlFor="afficheSimple">
							<span className="tooltiptext">Affichage Simplifié</span>
						</label>
					</span>
				</div>
			</div>

			{win && levelIndex + 2 <= totalLevelCount && (
				<button className="button-win" onClick={nextExercise}>
					Niveau suivant
				</button>
			)}

			<GameToasts
				mode={mode}
				tutorialMessage={tutorialMessage}
				errorMessage={errorMessage}
			/>

			<GameTabProvider value={game}>
				<div className="deck-row">
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
							objectif={objectives}
							isWin={win}
							affichageSimple={affichageSimple}
							helpCardPos={helpCardPos}
							helpCardPos2={helpCardPos2}
							key={deck.__deckId ?? index}
						></Deck>
					))}
				</div>
			</GameTabProvider>

			<GameDemonstration
				demonstration={activeDemonstration}
				constructDemonstration={constructDemonstration}
				onLineClick={demonstrationClickHandler}
				onCopy={copyHandler}
			/>

			<GamePopups
				popupAddCard={popupAddCard}
				popupFusion={popupFusion}
				popupDeleteCard={popupDeleteCard}
				popupWin={popupWin}
				
				onCloseAddCard={() => setPopupAddCard(false)}
				onCloseFusion={() => setPopupFusion(false)}
				onCloseDeleteCard={() => setPopupDeleteCard(false)}
				onCloseWin={() => setPopupWin(false)}
				
				onChooseColor={chooseColor}
				onChooseConnector={chooseConnector}
				
				cardToDelete={game[firstSelectedDeckIndex]?.[firstSelectedCardIndex]}
				deleteDeckIndex={firstSelectedDeckIndex}
				deleteCardIndex={firstSelectedCardIndex}
				onConfirmDelete={deleteCard}
				
				mode={mode}
				levelIndex={levelIndex}
				totalLevelCount={totalLevelCount}
				saveProgressFailed={saveProgressFailed}
				gameResult={gameResult}
				demonstration={activeDemonstration}
				constructDemonstration={constructDemonstration}
				onCopyDemonstration={copyHandler}
				onNextLevel={nextExercise}
			/>
		</div>
	);
};

export default Game;