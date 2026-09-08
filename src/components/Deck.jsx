import Card from "./Card";
import { useGameTab } from "../context/GameTabContext";

const Deck = ({
	updateGame,
	indice,
	addCardFunc,
	deleteCardFunc,
	transformIntoNonCard,
	nbDeck,
	mode,
	objectif,
	isWin,
	affichageSimple,
	helpCardPos,
	helpCardPos2,
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
	 * @see Game#addCard - fonction transmise via la prop addCardFunc.
	 */
	const addCardToDeck = () => {
		addCardFunc(indice);
	}

	/**
	 * @see Game#confirmDeleteCard - fonction transmise via la prop deleteCardFunc.
	 */
	const deleteCardToDeck = () => {
		deleteCardFunc();
	}

	/**
	 * @returns {"start"|"goal"|string} "start", "goal", ou "otherN" (N = indice du deck).
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
	 * @returns {string|-1} "principal", "secondaire" suivi de son numéro, ou -1 si cette carte
	 *                       n'est l'objectif d'aucun numéro (position sans objectif associé).
	 */
	const getObjectifNum = (i) => {
		let num = -1;
		objectif.forEach((element) => {
			if (element[1] === i)
				num = element[0];
		});

		let objectiveLabel = -1;
		if (num === 0)
			objectiveLabel = "principal";
		if (num !== -1 && num !== 0)
			objectiveLabel = "secondaire " + num;

		return objectiveLabel;
	};

	const isCardHelp = (index) => {
		return (
			(helpCardPos !== null && helpCardPos[0] === indice && helpCardPos[1] === index) ||
			(helpCardPos2 !== null && helpCardPos2[0] === indice && helpCardPos2[1] === index)
		);
	}

	const game = useGameTab();

	if (indice === nbDeck - 1 && mode !== "Create")
	{
		const entries = game[indice].map((card, index) => ({
			card,
			index,
			num: getObjectifNum(index),
		}));
		const principalEntries = entries.filter((e) => e.num === "principal");
		const secondaryEntries = entries
			.filter((e) => e.num !== "principal")
			.map((e, i) => ({
				...e,
				num: `secondaire ${i + 1}`,
			}));

		return (
			<div className="goal-group">
				{secondaryEntries.length > 0 && (
					<div className="subgoal">
						<div className="deck">
							<h3>Objectifs secondaires</h3>

							{secondaryEntries.map(({ card, index, num }) => (
								<div key={card.toString()}>
									<b>
										Objectif {num} : <br />
									</b>

									<Card
										deckIndex={indice}
										cardIndex={index}
										update={update}
										isWin={isWin}
										affichageSimple={affichageSimple}
										isHelp={isCardHelp(index)}
									/>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="goal">
					<div className="deck">
						<h3>
							Objectif principal{" "}
							<img src={"/img/objectif.png"} alt={"Ajout d'objectif"} />
						</h3>

						{principalEntries.map(({ card, index }) => (
							<Card
								key={card.toString()}
								deckIndex={indice}
								cardIndex={index}
								update={update}
								isWin={isWin}
								affichageSimple={affichageSimple}
								isHelp={isCardHelp(index)}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

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
					<div className="deck-toolbar">
						<button className="deck-action" onClick={addCardToDeck}>
							<p>+</p>
							<span className="deck-tooltip">Ajouter une carte</span>
						</button>

						<button className="deck-action" onClick={deleteCardToDeck}>
							<p>🗑</p>
							<span className="deck-tooltip">Supprimer une carte</span>
						</button>

						<button className="deck-action deck-action-symbol" onClick={transformIntoNonCard}>
							<p>¬</p>
							<span className="deck-tooltip">Transformer en carte négative</span>
						</button>
					</div>
				)}

				{game[indice].map((card, index) => (
					<div key={card.toString()}>
						<Card
							deckIndex={indice}
							cardIndex={index}
							update={update}
							isWin={isWin}
							affichageSimple={affichageSimple}
							isHelp={isCardHelp(index)}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default Deck;