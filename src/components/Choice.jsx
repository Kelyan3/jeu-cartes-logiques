import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/authHooks";
import { API_BASE_URL as API } from "../config/api";

const Choice = ({ mode }) => {
	/**
	 * Configuration par défaut, utilisée en attendant que le manifeste
	 * (nombre réel de niveaux) soit chargé, et comme repli si le manifeste
	 * est absent ou illisible.
	 */
	const defaultConfig = {
		Play: {
			jsonCount: 36,
			difficulty: [
				[1, 20, "Démonstrations"],
				[21, 35, "Raisonnements"],
				[36, 40, "Autres"],
			],
		},
		Tutorial: {
			jsonCount: 7,
			difficulty: [[1, 7, "Tutoriels"]],
		},
	};

	const [jsonCount, setJsonCount] = useState(defaultConfig[mode].jsonCount);
	const [difficulty, setDifficulty] = useState(defaultConfig[mode].difficulty);

	const navigate = useNavigate();
	const { user } = useAuth();
	const [completedLevels, setCompletedLevels] = useState([]);

	/**
	 * Chapitres réels (mode "Play" uniquement) : chaque niveau y porte son propre
	 * statut "unlocked"/"completed", calculé côté backend (voir get_chapters()).
	 */
	const [chapters, setChapters] = useState(null);

	useEffect(() => {
		if (mode !== "Play")
			return;

		fetch(`${API}/api/chapters`, { credentials: "include" })
			.then((response) => response.json())
			.then(setChapters)
			.catch(() => {
				// API indisponible : on retombe sur l'ancien affichage par difficulté, sans verrouillage (chapters reste null).
			});
	}, [mode, user]);

	/**
	 * Charge le nombre réel de niveaux depuis le manifeste généré,
	 * et étend la dernière catégorie affichée si de nouveaux niveaux
	 * ont été ajoutés au-delà de ce qui était prévu manuellement.
	 */
	useEffect(() => {
		fetch("/json/manifest.json")
			.then((response) => response.json())
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
			.then((response) => response.json())
			.then((data) => {
				const completedNums = data
					.filter((p) => p.mode === mode && p.completed)
					.map((p) => p.num);
				setCompletedLevels(completedNums);
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
		if (event.target.getAttribute("locked") === "true")
			return;

		const url = event.target.getAttribute("url");
		navigate(url);
	}

	/**
	 * Crée une ligne de niveaux à afficher.
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
						url={"/Exercise/" + mode + "/" + (index + 1)}
						className={isCompleted ? "levelCompleted" : ""}
					>
						<p url={"/Exercise/" + mode + "/" + (index + 1)}>Niveau {index + 1} {isCompleted && "✓"}</p>
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
					url={"/Exercise/" + mode + "/" + level.num}
					locked={locked ? "true" : "false"}
					className={
						(level.completed ? "levelCompleted " : "") +
						(locked ? "levelLocked" : "")
					}
				>
					<p url={"/Exercise/" + mode + "/" + level.num} locked={locked ? "true" : "false"}>
						{label}
					</p>
				</td>
			);
		});

		return <tr key={rowKey}>{row}</tr>;
	};

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par chapitre réel
	 * (avec déblocage séquentiel), pour le mode "Play" une fois /api/chapters chargé.
	 *
	 * @returns {JSX.Element[]}
	 */
	function afficheChapters()
	{
		const res = [];
		chapters.forEach((chapter, chapterIndex) => {
			res.push(
				<h2 key={"h-" + chapter.id_chapter}>
					{chapter.name} {!chapter.unlocked && "🔒"}
				</h2>
			);

			const rows = [];
			for (let i = 0; i < chapter.levels.length; i += 5)
				rows.push(createChapterRow(chapter.levels.slice(i, i + 5), chapterIndex + "-" + i));

			res.push(
				<table key={chapter.id_chapter}>
					<tbody>{rows}</tbody>
				</table>
			);
		});

		return res;
	}

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par catégorie de difficulté.
	 * 
	 * @returns {JSX.Element[]}
	 */
	function afficheChoice()
	{
		const res = [];
		difficulty.forEach((category, index) => {
			let table = [];
			let y = 1;
			res.push(<h2 key={"h-" + index}>{category[2]}</h2>);

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

			res.push(
				<table key={category[2]}>
					<tbody>{table}</tbody>
				</table>
			);
		});

		return res;
	}

	return (
		<div className="choice">
			{mode === "Play" && chapters ? afficheChapters() : afficheChoice()}
		</div>
	);
};

export default Choice;