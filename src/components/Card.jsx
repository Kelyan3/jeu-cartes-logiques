import { useGameTab } from "../context/GameTabContext";
import LogicText from "./LogicText";


const Card = ({ deckIndex, cardIndex, update, isWin, affichageSimple, isHelp }) => {
	/**
	 * Fonction qui détecte le clique sur une carte & qui appelle la fonction {@link update()} passée par le
	 * component Deck.
	 */
	const handleClick = () => {
		update(cardIndex);
	};

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
	 * @param {boolean} selec - true si la carte est sélectionnée, sinon false
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
					className={`cardSimple pattern-${currentCard.color} ` + (selec && currentCard.color !== "transparent" ? "selected " : "")}
					style={style}
				></span>
			);
		}

		if (affichageSimple)
			currentCard = currentCard.displayGoodCard();

		let className = "cardContainerVertical";
		let link = "linkVertical";

		if (count % 2 !== 0 || (originalCount === 2 && count === 2))
		{
			className = "cardContainerHorizontal";
			link = "";
		}

		if (count % 4 === 0)
			link = "linkVertical2";

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
		{
			return {
				width: "clamp(48px, 8vw, 72px)",
				height: "clamp(72px, 14vh, 110px)"
			};
		}

		if (prof < 4)
		{
			return {
				width: "clamp(96px, 14vw, 160px)",
				height: "clamp(72px, 14vh, 110px)",
			};
		}

		if (prof < 5)
			return {
				width: "clamp(110px, 16vw, 180px)",
				height: "clamp(100px, 18vh, 140px)",
			};

		if (prof < 6)
		{
			return {
				width: "clamp(130px, 18vw, 200px)",
				height: "clamp(100px, 18vh, 140px)",
			};
		}

		return {
			width: "clamp(140px, 20vw, 220px)",
			height: "clamp(120px, 22vh, 180px)",
		};
	}

	const game = useGameTab();

	return (
		<div
			role={isWin ? "presentation" : "button"}
			tabIndex={isWin ? -1 : 0}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleClick();
				}
			}}
			className={
				"card " +
				(isWin ? "" : "hoverable ") +
				(game[deckIndex][cardIndex].isNew ? "new " : "") +
				(isHelp ? "help" : "")}
			style={calcSizeCard(game[deckIndex][cardIndex])}
		>
			{renderCard(game[deckIndex][cardIndex], game[deckIndex][cardIndex].active)}
		</div>
	);
};

export default Card;