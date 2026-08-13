import { useState, useEffect } from "react";

import { API_BASE_URL as API } from "../config/api";


/**
 * Charge les clés de boutons débloquées par quête (voir /api/quests) et expose
 * une fonction pour savoir si un bouton d'action donné doit être affiché.
 *
 * Uniquement pertinent en mode "Play" : en "Tutorial" et "Create", tous les
 * boutons restent toujours visibles.
 *
 * @param {"Play"|"Tutorial"|"Create"} mode
 * @param {Object|null} user - utilisateur connecté (depuis useAuth), ou null
 *
 * @returns {{isActionUnlocked: Function}}
 */
export function useUnlockedActions(mode, user)
{
	/**
	 * Clés de boutons débloquées par quête, regroupées par menu (voir /api/quests).
	 * null tant que non chargé.
	 */
	const [unlockedKeys, setUnlockedKeys] = useState(null);

	useEffect(() => {
		if (mode !== "Play")
			return;

		fetch(`${API}/api/quests`, { credentials: "include" })
			.then((response) => {
				if (!response.ok)
					throw new Error("Impossible de charger les quêtes débloquées.");
				return response.json();
			})
			.then(setUnlockedKeys)
			.catch(() => setUnlockedKeys({}));
	}, [mode, user]);

	/**
	 * Indique si le bouton d'action portant cette clé (ex: "addGoal") doit être affiché.
	 * Toujours vrai hors mode "Play" ; en "Play", vrai seulement si la clé fait partie
	 * d'un menu de quêtes débloqué pour l'utilisateur courant.
	 *
	 * @param {string} key - id du bouton (voir seed de la table "quests").
	 * @returns {boolean}
	 */
	function isActionUnlocked(key)
	{
		if (mode !== "Play")
			return true;
		if (unlockedKeys === null)
			return false; // chargement en cours

		return Object.values(unlockedKeys).some((keys) => keys.includes(key));
	}

	return { isActionUnlocked };
}