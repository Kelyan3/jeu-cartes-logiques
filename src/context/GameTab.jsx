import { createContext } from "react";

/**
 * Contexte permettant à Card.jsx et Deck.jsx de lire l'état du jeu (game)
 * sans avoir à le faire remonter par props sur toute la hiérarchie.
 */
export const GameTab = createContext();