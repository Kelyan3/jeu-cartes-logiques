import { GameTab } from "../context/GameTab";
import LogicText from  "./LogicText";

const Card = ({ deckIndice, cardIndice, update, isWin, affichageSimple, isHelp }) => {
	/**
	 * Fonction qui détecte le clique sur une carte & qui appelle la fonction {@link update()} passée par le
	 * component Deck.
	 */
	const handleClick = () => {
		update(cardIndice);
	}

	/**
	 * Convertit les liaisons en symboles unicode affichés sur les cartes.
	 * 
	 * @param {string} str - La liaison.
	 * 
	 * @returns {string} Le symbole LaTeX.
	 */
	const afficheLink = (str) => {
		if (str === "=>")
			return "⇒";
		else if (str === "<=>")
			return "⇔";
		else if (str === "non")
			return "¬";
		else
			return str;
	};

	/**
	 * Construit récursivement l'affichage d'une carte (simple ou composée de sous-cartes reliées
	 * par un connecteur), en gérant l'orientation d'affichage selon la profondeur de récursion.
	 *
	 * @param {Card} currentCard - La carte sur laquelle on est actuellement
	 * @param {number} count
	 * @param {true|false} selec - true si la carte est sélectionnée, sinon false
	 * @param {number} originalCount
	 * @param {string} path - chemin ("L"/"R" empilés) jusqu'à cette sous-carte depuis la racine,
	 *                        utilisé comme clé React unique.
	 *
	 * @returns {JSX.Element}
	 */
	const recursiveRender = (currentCard, count, selec, originalCount, path) => {
		if (currentCard.color !== null)
		{
			let style = { backgroundColor: currentCard.color };
			if (currentCard.color === "transparent")
				style["border"] = "none";

			return (
				<span
					key={path}
					className={`card_simple ` + (selec && currentCard.color !== "transparent" ? "selectionner " : "")}
					style={style}
				></span>
			);
		}

		if (affichageSimple)
			currentCard = currentCard.displayGoodCard();

		let className = "carte_container_vertical";
		let link = "link_vertical";

		if (count % 2 !== 0 || (originalCount === 2 && count === 2))
		{
			className = "carte_container_horizon";
			link = "";
		}

		if (count % 4 === 0)
			link = "link_vertical2";

		return (
			<span className={className} key={path}>
				{[
					recursiveRender(currentCard.left, count - 1, selec, originalCount, path + "L"),
					<span key={path + "link"} className={`link ${link}`}>
						<LogicText>{afficheLink(currentCard.link)}</LogicText>
					</span>,
					recursiveRender(currentCard.right, count - 1, selec, originalCount, path + "R"),
				]}
			</span>
		);
	};

	/**
	 * Affiche la carte donnée en props, ou un élément vide si elle n'existe pas encore.
	 * 
	 * @param {{currentCard: Card, selec: boolean}} props
	 * 
	 * @returns {JSX.Element}
	 */
	function renderCard(currentCard, selec) {
		if (currentCard === undefined)
			return <span></span>;

		if (affichageSimple)
			currentCard = currentCard.displayGoodCardRecur();

		const profondeurCard = currentCard.getProfondeur();

		return recursiveRender(currentCard, profondeurCard, selec, profondeurCard, "root");
	}

	/**
	 * Renvoie les dimensions (largeur et longueur) de la carte selon sa profondeur dans la carte complexe.
	 * 
	 * @param {Card} card - La carte.
	 * 
	 * @returns {JSX.Element} - La largeur et la longueur de la carte.
	 */
	function calcSizeCard(card)
	{
		if (card === undefined)
			return { minWidth: 0, minHeight: 0 };

		if (affichageSimple)
			card = card.displayGoodCardRecur();

		const prof = card.getProfondeur();
		if (prof === 1)
			return { width: "5vw", height: "13vh" };
		if (prof < 4)
			return { width: "11vw", height: "13vh" };
		if (prof < 5)
			return { width: "11vw", height: "20vh" };
		if (prof < 6)
			return { width: "15vw", height: "20vh" };

		return { width: "15vw", height: "28vh" };
	}

	return (
		<GameTab.Consumer>
			{(game) => {
				return (
					<div
						onClick={handleClick}
						className={
							"card " +
							(isWin ? "" : "hoverable ") +
							(game[deckIndice][cardIndice].hover && !isWin ? "activeHover " : "") +
							(game[deckIndice][cardIndice].nouveau ? "nouveau " : "") +
							(isHelp ? "aide" : "")}
						style={calcSizeCard(game[deckIndice][cardIndice])}
					>
						{renderCard(game[deckIndice][cardIndice], game[deckIndice][cardIndice].active)}
					</div>
				);
			}}
		</GameTab.Consumer>
	);
};

export default Card;