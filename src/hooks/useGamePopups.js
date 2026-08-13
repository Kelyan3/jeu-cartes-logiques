import { useState } from "react";


/**
 * Regroupe l'état des popups liées au jeu (ajout/suppression de carte, fusion,
 * victoire) ainsi que l'indice de deck associé au popup d'ajout de carte.
 *
 * @returns {Object} état des popups + setters
 */
export function useGamePopups()
{
	/**
	 * Variable gérant le popup d'ajout de carte en mode création
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupAddCard, setPopupAddCard] = useState(false);

	/**
	 * Variable gérant le popup de suppression de carte en mode création.
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupDeleteCard, setPopupDeleteCard] = useState(false);

	/**
	 * Indice du deck dans lequel sera ajouté la carte en mode création avec le bouton "Ajout carte"
	 * ou en sélectionnant deux cartes en choisissant la liaison.
	 */
	const [indiceDeckAddCard, setIndiceDeckAddCard] = useState(0);

	/**
	 * Popup en mode création pour choisir la liaison quand deux cartes sont sélectionnées.
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupFusion, setPopupFusion] = useState(false);

	/**
	 * Popup quand on finit un exercice (objectif principal dans le deck 0).
	 * - false = on ne voit pas le popup
	 * - true  = on voit le popup
	 */
	const [popupWin, setPopupWin] = useState(false);

	const [saveProgressFailed, setSaveProgressFailed] = useState(false);

	return {
		popupAddCard, setPopupAddCard,
		popupDeleteCard, setPopupDeleteCard,
		indiceDeckAddCard, setIndiceDeckAddCard,
		popupFusion, setPopupFusion,
		popupWin, setPopupWin,
		saveProgressFailed, setSaveProgressFailed,
	};
}