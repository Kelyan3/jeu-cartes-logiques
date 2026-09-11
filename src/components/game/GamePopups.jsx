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
							<div className="color-grid" onChange={onChooseColor}>
								{COLORS.map(([value, label]) => (
									<label className="color-swatch-label" key={value}>
										<input type="radio" value={value} name="couleur" />
										<span className="color-swatch" style={{ backgroundColor: value }}></span>
										<span className="color-swatch-name">{label}</span>
									</label>
								))}
							</div>
							<button className="popup-close" onClick={onCloseAddCard} aria-label="Fermer">✕</button>
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
							<div className="connector-grid" onChange={onChooseConnector}>
								{CONNECTORS.map(([value, name, symbol]) => (
									<label className="connector-label" key={value}>
										<input type="radio" value={value} name="connecteur" />
										<span className="connector-symbol">{symbol}</span>
										<span className="connector-name">{name}</span>
									</label>
								))}
							</div>
							<button className="popup-close" onClick={onCloseFusion} aria-label="Fermer">✕</button>
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
							<div className="popup-delete-actions">
								<button className="btn-secondary" onClick={onCloseDeleteCard}>
									Annuler
								</button>
								<button className="btn-danger" onClick={onConfirmDelete}>
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
								<p className="game-result-summary">
									Temps : {formatTime(gameResult.elapsedSeconds)}
									{mode === "Play" && gameResult.score !== null && ` | Score : ${gameResult.score}`}
								</p>
							)}
							{saveProgressFailed && (
								<p className="save-progress-warning">
									⚠ Votre progression n'a pas pu être enregistrée. Vérifiez votre connexion.
								</p>
							)}
							<span
								className="close-button"
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

							<div className="popup-win-actions">
								<button className="popup-secondary" onClick={onCloseWin}>
									Revoir le niveau
								</button>
								{levelIndex + 2 <= totalLevelCount && (
									<button className="popup-primary" onClick={onNextLevel}>
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