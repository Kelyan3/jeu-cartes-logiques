import { createContext, useContext } from "react";


/**
 * Contexte permettant à Card.jsx et Deck.jsx de lire l'état du jeu (game)
 * sans avoir à le faire remonter par props sur toute la hiérarchie.
 */
const GameTabContext = createContext(null);

/**
 * Hook d'accès à l'état du jeu.
 * Doit être utilisé uniquement à l'intérieur d'un <GameTabProvider>.
 */
export const useGameTab = () => {
	const game = useContext(GameTabContext);
	if (game === null)
		throw new Error("useGameTab doit être utilisé à l'intérieur d'un GameTabProvider");

	return game;
};

export const GameTabProvider = GameTabContext.Provider;