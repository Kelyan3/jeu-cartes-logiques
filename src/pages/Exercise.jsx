import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Game from "../components/Game";
import Navigation from "../components/Navigation";
import PopupForms from "../components/PopupForms";


/**
 * Nombre de niveaux par défaut, utilisé en repli si le manifeste
 * n'a pas encore été chargé ou est indisponible.
 */
const defaultCounts = { Play: 36, Tutorial: 7 };


const Exercise = () => {
	const { num: tmpNum, mode } = useParams();
	const navigate = useNavigate();
	const [manifest, setManifest] = useState(null);
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
			.catch(() => setManifest(defaultCounts));
	}, []);

	/**
	 * Valeurs entièrement dérivées de tmpNum/mode/manifest : calculées au rendu,
	 * sans passer par un setState synchrone dans un effet.
	 */
	const num = tmpNum !== undefined ? Number(tmpNum) : NaN;
	const isValidNum = Number.isInteger(num) && num >= 1;
	const nbExo = manifest?.Play ?? defaultCounts.Play;
	const nbTuto = manifest?.Tutorial ?? defaultCounts.Tutorial;
	const isValidPlay = mode === "Play" && isValidNum && num <= nbExo;
	const isValidTutorial = mode === "Tutorial" && isValidNum && num <= nbTuto;
	const isValidCreate = mode === "Create" && tmpNum === undefined;
	const nbExoConfondu = mode === "Play" ? nbExo : nbTuto;

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
			{ex !== undefined && (
				<Game
					key={exerciseKey}
					mode={mode}
					ex={ex}
					numero={num - 1}
					nbExo={nbExoConfondu}
				/>
			)}
			<PopupForms />
		</div>
	);
};

export default Exercise;