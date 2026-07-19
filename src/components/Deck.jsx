import React from "react";
import Card from "./Card";
import { GameTab } from "./Game";

const Deck = ({
	updateGame,
	indice,
	addCardFunc,
	deleteCardFunc,
	transformIntoNonCard,
	nbDeck,
	mode,
	objectif,
	cardHelp,
	cardHelp2,
	isWin,
	affichageSimple,
	suppr,
	nouveau,
}) => {

	/**
	 * Méthode qui est appelée au moment d'un clique sur une carte & qui appelle la fonction updateGame passée par le component Game.
	 * 
	 * @param {number} indiceCard - Index de la carte dans le tableau.
	 */
	const update = (indiceCard) => {
		updateGame(indice, indiceCard);
	}

	/**
	 * @see Card#addCard()
	 */
	const addCardToDeck = () => {
		addCardFunc(indice);
	}

	/**
	 * @see Card#deleteCard()
	 */
	const deleteCardToDeck = () => {
		deleteCardFunc();
	}

	/**
	 * @returns {"start"|"goal"|"other"}
	 */
	const setClassname = () => {
		if (indice === 0)
			return "start";
		if (indice === nbDeck - 1)
			return "goal";

		return "other" + indice;
	};

	/**
	 * Indique quel est l'objectif à la ième position.
	 * 
	 * @param {number} i - La position de l'objectif
	 * 
	 * @returns {string|-1} soit "principal", soit "secondaire" suivi de son numéro
	 */
	const getObjectifNum = (i) => {
		let num = -1;
		objectif.forEach((element) => {
			if (element[1] === i)
				num = element[0];
		});

		let res = -1;
		if (num === 0)
			res = "principal";
		if (num !== -1 && num !== 0)
			res = "secondaire " + num;

		return res;
	};

	return (
		<div className={setClassname()}>
			<div className="deck">
				{indice !== nbDeck - 1 && indice !== 0 && <h3>LPU {indice}</h3>}

				{indice !== nbDeck - 1 && indice === 0 && <h3>LPU</h3>}

				{indice === nbDeck - 1 && (
					<h3>
						Objectifs{" "}
						<img src={"/img/objectif.png"} alt={"Ajout objectif"} />
					</h3>
				)}

				{mode === "Create" && (
					<div className="deckToolbar">
						<button className="deckAction" onClick={addCardToDeck}>
							<svg viewBox="0 0 24 24" fill="none">
								<path
									d="M12 5v14M5 12h14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
							<span className="deckTooltip">Ajouter une carte</span>
						</button>

						<button className="deckAction" onClick={deleteCardToDeck}>
							<svg viewBox="0 0 24 24" fill="none">
								<polyline
									points="3 6 5 6 21 6"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<line
									x1="10" y1="11" x2="10" y2="17"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
								/>
								<line
									x1="15" y1="11" x2="15" y2="17"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
								/>
							</svg>
							<span className="deckTooltip">Supprimer une carte</span>
						</button>

						<button className="deckAction deckActionSymbol" onClick={transformIntoNonCard}>
							¬
							<span className="deckTooltip">Transformer en carte négative</span>
						</button>
					</div>
				)}

				<GameTab.Consumer>
					{(game) => {
						return game[indice].map((card, index) => (
							<div key={index}>
								{mode !== "Create" && indice === nbDeck - 1 && getObjectifNum(index) !== -1 && (
									<b>
										Objectif {getObjectifNum(index)} : <br></br>
									</b>
								)}
								
								<Card
									deckIndice={indice}
									cardIndice={index}
									update={update}
									cardHelp={cardHelp}
									cardHelp2={cardHelp2}
									isWin={isWin}
									affichageSimple={affichageSimple}
								/>
							</div>
						));
					}}
				</GameTab.Consumer>
			</div>
		</div>
	);
};

export default Deck;