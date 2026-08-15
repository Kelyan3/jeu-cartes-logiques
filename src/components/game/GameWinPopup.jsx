import Popup from "../Popup";
import GameDemonstration from "./GameDemonstration";
import { formatTime } from "../../utils/formatTime";


/**
 * Popup affiché lorsque l'objectif principal est atteint.
 */
const GameWinPopup = ({
	open,
	mode,
	numero,
	nbExo,
	saveProgressFailed,
	gameResult,
	demonstration,
	constructDemonstration,
	onCopy,
	onClose,
	onNext,
}) => {
	if (!open)
		return null;

	return (
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
							onClose();
							if (mode === "Tutorial")
								onNext();
						}}
					>
						✖
					</span>

					<GameDemonstration
						demonstration={demonstration}
						constructDemonstration={constructDemonstration}
						onCopy={onCopy}
						className="demonstration-win"
					/>

					<div className="popupWinActions">
						<button className="popupSecondary" onClick={onClose}>
							Revoir le niveau
						</button>
						{numero + 2 <= nbExo && (
							<button className="popupPrimary" onClick={onNext}>
								Niveau suivant
							</button>
						)}
					</div>
				</>
			}
		/>
	);
};

export default GameWinPopup;