import Popup from "../Popup";


/**
 * Popup disponible en mode création pour confirmer la suppression d'une carte.
 * `card` doit être null/undefined si aucune carte valide n'est sélectionnée
 * (le popup ne s'affiche alors pas, comme dans le comportement d'origine).
 */
const DeleteCardPopup = ({ open, card, deckIndex, cardIndex, onConfirm, onCancel }) => {
	if (!open || card == null)
		return null;

	return (
		<Popup
			size={50}
			content={
				<>
					<b>
						Voulez-vous supprimer cette carte{" "}
						{card.toString()} : [
						{deckIndex}][{cardIndex}] ?
					</b>
					<br />
					<div className="popupDeleteActions">
						<button className="btnSecondary" onClick={onCancel}>
							Annuler
						</button>
						<button className="btnDanger" onClick={onConfirm}>
							Supprimer
						</button>
					</div>
				</>
			}
		/>
	);
};

export default DeleteCardPopup;