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
			.then((response) => response.json())
			.then((data) => setManifest(data))
			.catch(() => setManifest(defaultCounts));
	}, []);

	/**
	 * Valeurs entièrement dérivées de tmpNum/mode/manifest : calculées au rendu,
	 * sans passer par un setState synchrone dans un effet.
	 */
	const nbExo = manifest?.Play ?? defaultCounts.Play;
	const nbTuto = manifest?.Tutorial ?? defaultCounts.Tutorial;
	const isValidPlay = mode === "Play" && tmpNum <= nbExo;
	const isValidTutorial = mode === "Tutorial" && tmpNum <= nbTuto;
	const isValidCreate = mode === "Create" && tmpNum === undefined;
	const nbExoConfondu = mode === "Play" ? nbExo : nbTuto;
	const num = Number(tmpNum);

	useEffect(() => {
		// On attend d'avoir le manifeste (ou son repli) avant de valider le niveau demandé.
		if (manifest === null)
			return;

		if (isValidPlay)
		{
			fetch("/json/exos_feuilles/ex" + tmpNum + ".json")
				.then((response) => response.text())
				.then((data) => setFetchedEx({ key: exerciseKey, data: JSON.parse(data) }));
		}
		else if (isValidTutorial)
		{
			fetch("/json/tutoriel/tuto" + tmpNum + ".json")
				.then((response) => response.text())
				.then((data) => setFetchedEx({ key: exerciseKey, data: JSON.parse(data) }));
		}
		else if (!isValidCreate)
			navigate("/NotFound");
	}, [tmpNum, mode, manifest, isValidPlay, isValidTutorial, isValidCreate, navigate]);

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