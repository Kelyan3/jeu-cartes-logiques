import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL as API } from "../config/api";


/**
 * Gère la persistance de la progression du joueur : chronométrage de l'exercice,
 * comptage des coups, sauvegarde côté backend et navigation vers l'exercice suivant.
 *
 * @param {Object} params
 * @param {"Play"|"Tutorial"|"Create"} params.mode
 * @param {number} params.numero
 * @param {number} params.nbExo
 * @param {Object|null} params.user - utilisateur connecté (depuis useAuth), ou null
 * @param {Function} params.setPopupWin
 * @param {Function} params.setSaveProgressFailed
 *
 * @returns {{incrementMoves: Function, saveProgress: Function, nextExercise: Function}}
 */
export function useProgressSave({ mode, numero, nbExo, user, setPopupWin, setSaveProgressFailed })
{
	const navigate = useNavigate();

	/**
	 * Horodatage de début de partie, utilisé pour calculer elapsed_seconds envoyé à /api/progress.
	 */
	const startTimeRef = useRef(null);
	useEffect(() => {
		startTimeRef.current = Date.now();
	}, []);

	/**
	 * Nombre de coups joués (un coup = un appel à saveGame()), utilisé pour le calcul du score.
	 */
	const movesRef = useRef(0);

	/**
	 * Comptabilise un coup joué.
	 */
	const incrementMoves = () => {
		movesRef.current += 1;
	};

	/**
	 * Enregistre la progression du niveau actuel auprès du backend, si l'utilisateur est connecté.
	 */
	const saveProgress = () => {
		setSaveProgressFailed(false);

		if (!user || mode === "Create")
			return;

		const elapsedSeconds = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);

		fetch(`${API}/api/progress`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				mode: mode,
				num: numero + 1,
				completed: true,
				elapsed_seconds: elapsedSeconds,
				moves: movesRef.current,
			}),
		})
			.then((response) => {
				if (!response.ok)
					throw new Error("Échec de l'enregistrement de la progression.");
			})
			.catch(() => setSaveProgressFailed(true));
	};

	/**
	 * Redirige vers le prochain exercice si il existe.
	 */
	const nextExercise = () => {
		// S'il y a un prochain exercice
		if (numero + 2 <= nbExo)
		{
			// url du prochain exercice
			let url = "/exercise/" + mode + "/" + (numero + 2);

			// Redirige vers cet url
			navigate(url);
		}

		setPopupWin(false);
	};

	return { incrementMoves, saveProgress, nextExercise };
}