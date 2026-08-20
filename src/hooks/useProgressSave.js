import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL as API } from "../config/api";


/**
 * Gère la persistance de la progression du joueur : chronométrage de l'exercice,
 * comptage des coups, sauvegarde côté backend et navigation vers l'exercice suivant.
 *
 * @param {Object} params
 * @param {"Play"|"Tutorial"|"Create"} params.mode
 * @param {number} params.levelIndex - index zéro-based du niveau courant
 * @param {number} params.totalLevelCount - nombre total de niveaux du mode courant
 * @param {Object|null} params.user - utilisateur connecté (depuis useAuth), ou null
 * @param {Function} params.setPopupWin
 * @param {Function} params.setSaveProgressFailed
 * @param {Function} params.setGameResult - reçoit {elapsedSeconds, moves, score} ; le temps et les
 *                                          coups sont connus immédiatement, le score n'arrive qu'une
 *                                          fois la réponse du serveur reçue (voir saveProgress ci-dessous).
 *
 * @returns {{incrementMoves: Function, saveProgress: Function, nextExercise: Function,
 *            startTimer: Function, displaySeconds: number, displayMoves: number}}
 */
export function useProgressSave({ mode, levelIndex, totalLevelCount, user, setPopupWin, setSaveProgressFailed, setGameResult })
{
	const navigate = useNavigate();

	/**
	 * Horodatage de début de partie, utilisé pour calculer elapsed_seconds envoyé à /api/progress.
	 */
	const startTimeRef = useRef(null);
	const intervalRef = useRef(null);

	/**
	 * Versions réactives du temps écoulé et du nombre de coups.
	 */
	const [displaySeconds, setDisplaySeconds] = useState(0);

	/**
	 * Démarre le chrono, si ce n'est pas déjà fait.
	 */
	const startTimer = () => {
		if (startTimeRef.current !== null)
			return;

		startTimeRef.current = Date.now();
		intervalRef.current = setInterval(() => {
			setDisplaySeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
		}, 1000);
	};

	/**
	 * Arrête le chrono affiché (le temps ne défile plus une fois la partie gagnée).
	 */
	const stopTimer = () => {
		if (intervalRef.current !== null)
		{
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	// Ne laisse jamais un intervalle tourner dans le vide si le composant est démonté en cours de partie.
	useEffect(() => stopTimer, []);

	/**
	 * Nombre de coups joués (un coup = un appel à saveGame()), utilisé pour le calcul du score.
	 */
	const movesRef = useRef(0);
	const [displayMoves, setDisplayMoves] = useState(0);

	/**
	 * Comptabilise un coup joué.
	 */
	const incrementMoves = () => {
		movesRef.current += 1;
		setDisplayMoves(movesRef.current);
	};

	/**
	 * Enregistre la progression du niveau actuel auprès du backend, si l'utilisateur est connecté.
	 */
	const saveProgress = () => {
		stopTimer();
		setSaveProgressFailed(false);

		const elapsedSeconds = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
		const moves = movesRef.current;

		setGameResult({ elapsedSeconds, moves, score: null });

		if (!user || mode === "Create")
			return;

		fetch(`${API}/api/progress`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				mode: mode,
				num: levelIndex + 1,
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
		if (levelIndex + 2 <= totalLevelCount)
		{
			// url du prochain exercice
			let url = "/exercise/" + mode + "/" + (levelIndex + 2);

			// Redirige vers cet url
			navigate(url);
		}

		setPopupWin(false);
	};

	return { incrementMoves, saveProgress, nextExercise, startTimer, displaySeconds, displayMoves };
}