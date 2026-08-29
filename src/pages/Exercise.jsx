import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Game from "../components/Game";
import Navigation from "../components/Navigation";
import PopupForms from "../components/PopupForms";

import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";
import { DEFAULT_LEVEL_COUNTS } from "../config/levels";


const Exercise = () => {
	const { num: tmpNum, mode } = useParams();
	const { user } = useAuth();
	const [manifest, setManifest] = useState(null);
	const [unlockStatus, setUnlockStatus] = useState("ok");
	const navigate = useNavigate();

	const exerciseKey = mode + "-" + tmpNum;

	/**
	 * Seul le contenu réellement récupéré par fetch a besoin d'un state :
	 * c'est la seule donnée qui n'est pas déductible de tmpNum/mode/manifest.
	 */
	const [fetchedEx, setFetchedEx] = useState({ key: null, data: undefined });

	useEffect(() => {
		fetch("/json/manifest.json")
			.then((response) => {
				if (!response.ok)
					throw new Error("Manifeste indisponible.");
				return response.json();
			})
			.then((data) => setManifest(data))
			.catch(() => setManifest(DEFAULT_LEVEL_COUNTS));
	}, []);

	useEffect(() => {
		if (mode !== "Play" || !user)
			return;

		fetch(`${API}/api/chapters`, { credentials: "include" })
			.then((response) => response.json())
			.then((chapters) => {
				const level = chapters.flatMap((chapter) => chapter.levels).find((l) => l.num === Number(tmpNum));
				setUnlockStatus(level?.unlocked ? "ok" : "locked");
			})
			// En cas d'échec réseau, on ne bloque pas l'accès pour une raison indépendante du déblocage.
			.catch(() => setUnlockStatus("ok"));
	}, [mode, user, tmpNum]);

	/**
	 * Valeurs entièrement dérivées de tmpNum/mode/manifest : calculées au rendu,
	 * sans passer par un setState synchrone dans un effet.
	 */
	const num = tmpNum !== undefined ? Number(tmpNum) : NaN;
	const isValidNum = Number.isInteger(num) && num >= 1;
	const playLevelCount = manifest?.Play ?? DEFAULT_LEVEL_COUNTS.Play;
	const tutorialLevelCount = manifest?.Tutorial ?? DEFAULT_LEVEL_COUNTS.Tutorial;
	const isValidPlay = mode === "Play" && isValidNum && num <= playLevelCount;
	const isValidTutorial = mode === "Tutorial" && isValidNum && num <= tutorialLevelCount;
	const isValidCreate = mode === "Create" && tmpNum === undefined;
	const totalLevelCount = mode === "Play" ? playLevelCount : tutorialLevelCount;
	const effectiveUnlockStatus = mode === "Play" && user ? unlockStatus : "ok";

	useEffect(() => {
		// On attend d'avoir le manifeste (ou son repli) avant de valider le niveau demandé.
		if (manifest === null)
			return;

		if (isValidPlay || isValidTutorial)
		{
			const path = isValidPlay
				? `/json/exos_feuilles/ex${num}.json`
				: `/json/tutoriel/tuto${num}.json`;

			fetch(path)
				.then((response) => {
					if (!response.ok)
						throw new Error(`Exercice introuvable (${response.status})`);
					return response.json();
				})
				.then((data) => setFetchedEx({ key: exerciseKey, data }))
				.catch(() => navigate("/not-found"));
		}
		else if (!isValidCreate)
			navigate("/not-found");
	}, [tmpNum, mode, manifest, isValidPlay, isValidTutorial, isValidCreate, num, exerciseKey, navigate]);

	// Le mode "Create" n'a pas besoin de fetch : sa valeur de départ est constante.
	const ex = isValidCreate ? [[], []] : fetchedEx.key === exerciseKey ? fetchedEx.data : undefined;

	return (
		<div className="home">
			<Navigation />
			
			{effectiveUnlockStatus === "locked" && (
				<p className="levelLockedMessage">Vous n'avez pas encore débloqué ce niveau.</p>
			)}

			{effectiveUnlockStatus === "ok" && ex !== undefined && (
				<Game
					key={exerciseKey}
					mode={mode}
					ex={ex}
					levelIndex={num - 1}
					totalLevelCount={totalLevelCount}
				/>
			)}
			<PopupForms />
		</div>
	);
};

export default Exercise;