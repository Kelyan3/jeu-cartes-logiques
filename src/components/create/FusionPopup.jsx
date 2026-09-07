import Popup from "../Popup";


const CONNECTORS = [
	["et", "∧", "Et"],
	["ou", "∨", "Ou"],
	["=>", "⇒", "Implique"],
	["<=>", "⇔", "Équivaut"],
];

/**
 * Popup disponible en mode création quand on sélectionne 2 cartes, pour choisir la
 * liaison de la future carte fusionnée.
 */
const FusionPopup = ({ open, onChooseConnector, onClose }) => {
	if (!open)
		return null;

	return (
		<Popup
			size={50}
			content={
				<>
					<b>Choisissez une liaison</b>
					<div className="connectorGrid" onChange={onChooseConnector}>
						{CONNECTORS.map(([value, symbol, label]) => (
							<label className="connectorLabel" key={value}>
								<input type="radio" value={value} name="liaison" />
								<span className="connectorSymbol">{symbol}</span>
								<span className="connectorName">{label}</span>
							</label>
						))}
					</div>
					<button className="popupClose" onClick={onClose} aria-label="Fermer">✕</button>
				</>
			}
		/>
	);
};

export default FusionPopup;