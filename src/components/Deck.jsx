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
						<img src={"img/objectif.png"} alt={"Ajout objectif"} />
					</h3>
				)}

				{mode === "Create" && (
					<button onClick={addCardToDeck}>Ajouter une carte</button>
				)}

				<br />

				{mode === "Create" && (
					<button onClick={deleteCardToDeck}>Supprimer une carte</button>
				)}

				<br />

				{mode === "Create" && (
					<button onClick={transformIntoNonCard}>Transformer en carte négative</button>
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