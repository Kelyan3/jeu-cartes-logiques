import { Popup } from "../Modals";
import GameDemonstration from "./GameDemonstration";
import { formatTime } from "../../utils/formatTime";

const COLORS = [
	["red", "Rouge"],
	["yellow", "Jaune"],
	["blue", "Bleue"],
	["orange", "Orange"],
	["green", "Verte"],
	["purple", "Mauve"],
	["black", "Vrai"],
	["white", "Faux"],
];

const CONNECTORS = [
	["et", "Et", "∧"],
	["ou", "Ou", "∨"],
	["=>", "Implique", "⇒"],
	["<=>", "Équivaut", "⇔"],
];

/**
 * Gère l'affichage de tous les popups du jeu.
 * Il suffit d'importer ce composant et de lui passer les paramètres nécessaires.
 */
const GamePopups = ({
	// États d'ouverture
	popupAddCard,
	popupFusion,
	popupDeleteCard,
	popupWin,

	// Callbacks de fermeture
	onCloseAddCard,
	onCloseFusion,
	onCloseDeleteCard,
	onCloseWin,

	// Props pour AddCard
	onChooseColor,

	// Props pour Fusion
	onChooseConnector,

	// Props pour DeleteCard
	cardToDelete,
	deleteDeckIndex,
	deleteCardIndex,
	onConfirmDelete,

	// Props pour Win
	mode,
	levelIndex,
	totalLevelCount,
	saveProgressFailed,
	gameResult,
	demonstration,
	constructDemonstration,
	onCopyDemonstration,
	onNextLevel,
}) => {
	return (
		<>
			{/* Popup d'ajout de carte */}
			{popupAddCard && (
				<Popup
					size={50}
					content={
						<>
							<b>Choisissez une couleur</b>
							<div className="colorGrid" onChange={onChooseColor}>
								{COLORS.map(([value, label]) => (
									<label className="colorSwatchLabel" key={value}>
										<input type="radio" value={value} name="couleur" />
										<span className="colorSwatch" style={{ backgroundColor: value }}></span>
										<span className="colorSwatchName">{label}</span>
									</label>
								))}
							</div>
							<button className="popupClose" onClick={onCloseAddCard} aria-label="Fermer">✕</button>
						</>
					}
				/>
			)}

			{/* Popup de fusion de cartes */}
			{popupFusion && (
				<Popup
					size={50}
					content={
						<>
							<b>Choisissez un connecteur</b>
							<div className="connectorGrid" onChange={onChooseConnector}>
								{CONNECTORS.map(([value, name, symbol]) => (
									<label className="connectorLabel" key={value}>
										<input type="radio" value={value} name="connecteur" />
										<span className="connectorSymbol">{symbol}</span>
										<span className="connectorName">{name}</span>
									</label>
								))}
							</div>
							<button className="popupClose" onClick={onCloseFusion} aria-label="Fermer">✕</button>
						</>
					}
				/>
			)}

			{/* Popup de suppression de carte */}
			{popupDeleteCard && cardToDelete != null && (
				<Popup
					size={50}
					content={
						<>
							<b>
								Voulez-vous supprimer cette carte{" "}
								{cardToDelete.toString()} : [
								{deleteDeckIndex}][{deleteCardIndex}] ?
							</b>
							<br />
							<div className="popupDeleteActions">
								<button className="btnSecondary" onClick={onCloseDeleteCard}>
									Annuler
								</button>
								<button className="btnDanger" onClick={onConfirmDelete}>
									Supprimer
								</button>
							</div>
						</>
					}
				/>
			)}

			{/* Popup de victoire */}
			{popupWin && (
				<Popup
					content={
						<>
							<b>Bravo, vous avez trouvé la solution !</b>
							{gameResult && mode !== "Create" && (
								<p className="gameResultSummary">
									Temps : {formatTime(gameResult.elapsedSeconds)}
									{mode === "Play" && gameResult.score !== null && ` | Score : ${gameResult.score}`}
								</p>
							)}
							{saveProgressFailed && (
								<p className="saveProgressWarning">
									⚠ Votre progression n'a pas pu être enregistrée. Vérifiez votre connexion.
								</p>
							)}
							<span
								className="closeButton"
								onClick={() => {
									onCloseWin();
									if (mode === "Tutorial")
										onNextLevel();
								}}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										onCloseWin();
										if (mode === "Tutorial")
											onNextLevel();
									}
								}}
							>
								✖
							</span>

							<GameDemonstration
								demonstration={demonstration}
								constructDemonstration={constructDemonstration}
								onCopy={onCopyDemonstration}
								className="demonstration-win"
							/>

							<div className="popupWinActions">
								<button className="popupSecondary" onClick={onCloseWin}>
									Revoir le niveau
								</button>
								{levelIndex + 2 <= totalLevelCount && (
									<button className="popupPrimary" onClick={onNextLevel}>
										Niveau suivant
									</button>
								)}
							</div>
						</>
					}
				/>
			)}
		</>
	);
};

export default GamePopups;
