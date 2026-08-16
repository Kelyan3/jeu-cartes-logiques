import { useRef } from "react";
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
 * @param {Function} params.setGameResult - reçoit {elapsedSeconds, moves, score} ; le temps et les
 *                                          coups sont connus immédiatement, le score n'arrive qu'une
 *                                          fois la réponse du serveur reçue (voir saveProgress ci-dessous).
 *
 * @returns {{incrementMoves: Function, saveProgress: Function, nextExercise: Function}}
 */
export function useProgressSave({ mode, numero, nbExo, user, setPopupWin, setSaveProgressFailed, setGameResult })
{
	const navigate = useNavigate();

	/**
	 * Horodatage de début de partie, utilisé pour calculer elapsed_seconds envoyé à /api/progress.
	 */
	const startTimeRef = useRef(null);

	/**
	 * Démarre le chrono, si ce n'est pas déjà fait.
	 */
	const startTimer = () => {
		if (startTimeRef.current === null)
			startTimeRef.current = Date.now();
	};

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

		const elapsedSeconds = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
		const moves = movesRef.current;

		// Le temps et le nombre de coups sont connus tout de suite, donc on les affiche immédiatement.
		setGameResult({ elapsedSeconds, moves, score: null });

		if (!user || mode === "Create")
			return;

		fetch(`${API}/api/progress`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				mode: mode,
				num: numero + 1,
				completed: true,
				elapsed_seconds: elapsedSeconds,
				moves: moves,
			}),
		})
			.then((response) => {
				if (!response.ok)
					throw new Error("Échec de l'enregistrement de la progression.");
				return response.json();
			})
			.then((data) => setGameResult((prev) => ({ ...prev, score: data.score })))
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

	return { incrementMoves, saveProgress, nextExercise, startTimer };
}