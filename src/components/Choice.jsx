import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";
import { formatTime } from "../utils/formatTime";


const Choice = ({ mode }) => {
	/**
	 * Configuration par défaut du mode Tutorial (basée sur le manifeste de
	 * fichiers exN.json), seul mode qui n'utilise pas encore le système de
	 * chapitres en base de données. Le mode "Play" est entièrement piloté
	 * par /api/chapters (voir plus bas).
	 */
	const defaultConfig = {
		Tutorial: {
			jsonCount: 7,
			difficulty: [[1, 7, "Tutoriels"]],
		},
	};

	const [jsonCount, setJsonCount] = useState(defaultConfig.Tutorial?.jsonCount ?? 0);
	const [difficulty, setDifficulty] = useState(defaultConfig.Tutorial?.difficulty ?? []);

	const navigate = useNavigate();
	const { user } = useAuth();
	const [completedLevels, setCompletedLevels] = useState([]);

	/**
	 * Chapitres réels (mode "Play" uniquement) : chaque niveau y porte son propre
	 * statut "unlocked"/"completed", calculé côté backend (voir get_chapters()).
	 * null = pas encore chargé, [] = chargé mais aucun chapitre en base,
	 * "error" = l'appel a échoué.
	 */
	const [chapters, setChapters] = useState(null);
	const [chaptersError, setChaptersError] = useState(false);

	// Réinitialise l'état des chapitres dès que mode/user change.
	const [chaptersKey, setChaptersKey] = useState({ mode, user });
	if (chaptersKey.mode !== mode || chaptersKey.user !== user)
	{
		setChaptersKey({ mode, user });
		setChapters(null);
		setChaptersError(false);
	}

	useEffect(() => {
		if (mode !== "Play")
			return;

		// Ignore la réponse si mode/user a de nouveau changé avant qu'elle n'arrive
		// (évite d'écraser des données plus récentes avec une réponse obsolète).
		let ignore = false;

		fetch(`${API}/api/chapters`, { credentials: "include" })
			.then((response) => {
				if (!response.ok)
					throw new Error("Impossible de charger les chapitres.");
				return response.json();
			})
			.then((data) => {
				if (!ignore)
					setChapters(data);
			})
			.catch(() => {
				if (!ignore)
					setChaptersError(true);
			});

		return () => {
			ignore = true;
		};
	}, [mode, user]);

	/**
	 * Charge le nombre réel de niveaux depuis le manifeste généré (mode
	 * Tutorial uniquement), et étend la dernière catégorie affichée si de
	 * nouveaux niveaux ont été ajoutés au-delà de ce qui était prévu.
	 */
	useEffect(() => {
		if (mode !== "Tutorial")
			return;

		fetch("/json/manifest.json")
			.then((response) => {
				if (!response.ok)
					throw new Error("Manifeste indisponible.");
				return response.json();
			})
			.then((manifest) => {
				const count = manifest[mode];
				if (!count)
					return;

				setJsonCount(count);
				setDifficulty((prevDifficulty) => {
					const updated = prevDifficulty.map((cat) => [...cat]);
					const lastCategory = updated[updated.length - 1];
					if (count > lastCategory[1])
						lastCategory[1] = count;

					return updated;
				})
			})
			.catch(() => {
				// Manifeste absent ou invalide : on garde la configuration par défaut.
			});
	}, [mode]);

	useEffect(() => {
		if (!user)
			return;

		fetch(`${API}/api/progress`, { credentials: "include" })
			.then((response) => {
				if (!response.ok)
					throw new Error("Impossible de charger la progression.");
				return response.json();
			})
			.then((data) => {
				const completedNums = data
					.filter((p) => p.mode === mode && p.completed)
					.map((p) => p.num);
				setCompletedLevels(completedNums);
			})
			.catch(() => {
				// Les niveaux complétés ne sont qu'un indicateur visuel (✓) ;
				// en cas d'échec, on garde silencieusement la dernière liste
				// connue plutôt que de bloquer l'affichage des niveaux.
			});
	}, [user, mode]);

	const visibleCompletedLevels = user ? completedLevels : [];

	/**
	 * Navigue vers la page du niveau.
	 * 
	 * @param {Event} event
	 */
	function goToExo(event)
	{
		const cell = event.currentTarget;
		if (cell.dataset.locked === "true")
			return;

		const url = cell.dataset.url;
		if (url)
			navigate(url);
	}

	/**
	 * Crée une ligne de niveaux à afficher (mode Tutorial).
	 * 
	 * @param {number} start - Le premier niveau de la ligne.
	 * @param {number} end - Le dernier niveau de la ligne.
	 * 
	 * @returns {JSX.Element} La ligne.
	 */
	const createRow = (start, end) => {
		let row = [];
		for (let index = start; index < end; index++)
		{
			if (index < jsonCount)
			{
				const isCompleted = visibleCompletedLevels.includes(index + 1);
				row.push(
					<td
						key={index}
						onClick={goToExo}
						data-url={"/exercise/" + mode + "/" + (index + 1)}
						className={isCompleted ? "levelCompleted" : ""}
					>
						<p>Niveau {index + 1} {isCompleted && "✓"}</p>
					</td>
				);
			}
			else
			{
				row.push(
					<td key={index} className="tdVoid">
						<p>Niveau XX</p>
					</td>
				);
			}
		}

		return <tr key={start + "-" + end}>{row}</tr>;
	}

	/**
	 * Crée une ligne de niveaux à afficher pour un chapitre donné (par lots de 5),
	 * en tenant compte du verrouillage individuel de chaque niveau.
	 *
	 * @param {Array} levels - sous-ensemble de niveaux du chapitre (avec num/unlocked/completed).
	 * @param {number} rowKey - clé React de la ligne.
	 *
	 * @returns {JSX.Element} La ligne.
	 */
	const createChapterRow = (levels, rowKey) => {
		const row = levels.map((level) => {
			const locked = !level.unlocked;
			const label = locked ? "🔒" : `Niveau ${level.num} ${level.completed ? "✓" : ""}`;

			return (
				<td
					key={level.num}
					onClick={goToExo}
					data-url={"/exercise/" + mode + "/" + level.num}
					data-locked={locked ? "true" : "false"}
					className={
						(level.completed ? "levelCompleted " : "") +
						(locked ? "levelLocked" : "")
					}
				>
					<p>{label}</p>
					{level.completed && (
						<p className="levelScore">
							{formatTime(level.best_time_seconds)} | {level.score} pts
						</p>
					)}
				</td>
			);
		});

		return <tr key={rowKey}>{row}</tr>;
	};

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par chapitre réel
	 * (avec déblocage séquentiel), pour le mode "Play".
	 *
	 * @returns {JSX.Element[]}
	 */
	function afficheChapters()
	{
		const chapterSections = [];
		chapters.forEach((chapter, chapterIndex) => {
			chapterSections.push(
				<h2 key={"h-" + chapter.id_chapter}>
					{chapter.name} {!chapter.unlocked && "🔒"}
				</h2>
			);

			const rows = [];
			for (let i = 0; i < chapter.levels.length; i += 5)
				rows.push(createChapterRow(chapter.levels.slice(i, i + 5), chapterIndex + "-" + i));

			chapterSections.push(
				<table key={chapter.id_chapter}>
					<tbody>{rows}</tbody>
				</table>
			);
		});

		return chapterSections;
	}

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par catégorie de difficulté
	 * (mode "Tutorial" uniquement).
	 * 
	 * @returns {JSX.Element[]}
	 */
	function afficheChoice()
	{
		const difficultySections = [];
		difficulty.forEach((category, index) => {
			let table = [];
			let y = 1;
			difficultySections.push(<h2 key={"h-" + index}>{category[2]}</h2>);

			for (let i = category[0] - 1; i <= category[1] - 1; i++)
			{
				if (i + 5 >= category[1] && y === 1)
				{
					table.push(createRow(i, category[1]));
					y = 5;
				}
				else if (i < category[1] && y === 1)
				{
					table.push(createRow(i, i + 5));
					y = 5;
				}
				else
					y--;
			}

			difficultySections.push(
				<table key={category[2]}>
					<tbody>{table}</tbody>
				</table>
			);
		});

		return difficultySections;
	}

	/**
	 * Contenu du mode "Play" : chargement, erreur, aucun chapitre, ou la liste.
	 * Ne rend jamais l'ancien système de difficulté codé en dur.
	 */
	function affichePlay()
	{
		if (chaptersError)
			return <p className="choiceMessage">Impossible de charger les niveaux pour le moment. Réessaie plus tard.</p>;

		if (chapters === null)
			return <p className="choiceMessage">Chargement des niveaux...</p>;

		if (chapters.length === 0)
			return <p className="choiceMessage">Aucun niveau n'est disponible pour le moment.</p>;

		return afficheChapters();
	}

	return (
		<div className="choice">
			{mode === "Play" ? affichePlay() : afficheChoice()}
		</div>
	);
};

export default Choice;