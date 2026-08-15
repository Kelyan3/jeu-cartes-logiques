import LogicText from "../LogicText";


/**
 * Affiche la démonstration logique de l'exercice (liste de lignes indentées).
 * Présentation uniquement.
 */
const GameDemonstration = ({
	demonstration,
	constructDemonstration,
	onLineClick,
	onCopy,
	className = "demonstration",
}) => {
	return (
		<div className={className} onCopy={onCopy}>
			{demonstration.map((element, index) => (
				<div
					key={index}
					id={"demo" + index}
					onClick={onLineClick}
					style={
						index === 1
							? { marginLeft: 20 + element[0] * 20, marginTop: 20 }
							: { marginLeft: 20 + element[0] * 20 }
					}
				>
					<LogicText>{constructDemonstration(element[1])}</LogicText>
				</div>
			))}
		</div>
	);
};

export default GameDemonstration;