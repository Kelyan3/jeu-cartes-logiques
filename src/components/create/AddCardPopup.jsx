import Popup from "../Popup";


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

/**
 * Popup disponible en mode création pour choisir la couleur d'une carte simple à ajouter.
 */
const AddCardPopup = ({ open, onChooseColor, onClose }) => {
	if (!open)
		return null;

	return (
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

					<button className="popupClose" onClick={onClose}>✕</button>
				</>
			}
		/>
	);
};

export default AddCardPopup;