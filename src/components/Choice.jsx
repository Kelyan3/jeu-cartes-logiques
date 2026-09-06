import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthModal } from "../context/AuthModalContext";
import { API_BASE_URL as API } from "../config/api";
import { DEFAULT_LEVEL_COUNTS, TUTORIAL_DIFFICULTY } from "../config/levels";
import { CheckCircle, Lock, Clock, Trophy } from "lucide-react";
import { formatTime } from "../utils/formatTime";


const ChoiceContent = ({ mode, user }) => {
	const [jsonCount, setJsonCount] = useState(DEFAULT_LEVEL_COUNTS.Tutorial);
	const [difficulty, setDifficulty] = useState(() =>
		TUTORIAL_DIFFICULTY.map((cat) => [...cat])
	);

	const navigate = useNavigate();
	const { openAuthModal } = useAuthModal();
	const [completedLevels, setCompletedLevels] = useState([]);

	/**
	 * Chapitres réels (mode "Play" uniquement) : chaque niveau y porte son propre
	 * statut "unlocked"/"completed", calculé côté backend (voir get_chapters()).
	 * null = pas encore chargé, [] = chargé mais aucun chapitre en base,
	 * "error" = l'appel a échoué.
	 */
	const [chapters, setChapters] = useState(null);
	const [chaptersError, setChaptersError] = useState(false);

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
		if (!url)
			return;

		if (!user)
		{
			openAuthModal(url);
			return;
		}

		navigate(url);
	}

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par chapitre réel
	 * (avec déblocage séquentiel), pour le mode "Play".
	 *
	 * @returns {JSX.Element[]}
	 */
	function afficheChapters()
	{
		return chapters.map((chapter) => (
			<div key={chapter.id_chapter} className="levelCategory">
				<div className="categoryHeader">
					<h2>{chapter.name}</h2>
					{!chapter.unlocked && <Lock size={20} className="categoryLockedIcon" />}
				</div>
				<div className="levelsGrid">
					{chapter.levels.map((level) => {
						const locked = !level.unlocked;
						return (
							<div
								key={level.num}
								onClick={goToExo}
								data-url={"/exercise/" + mode + "/" + level.num}
								data-locked={locked ? "true" : "false"}
								className={`levelCard ${level.completed ? "levelCompleted" : ""} ${locked ? "levelLocked" : ""}`}
							>
								<div className="levelCardTop">
									<span className="levelTitle">Niveau {level.num}</span>
									{locked ? <Lock size={16} className="levelIcon lockedIcon" /> : level.completed ? <CheckCircle size={16} className="levelIcon completedIcon" /> : null}
								</div>
								{level.completed && (
									<div className="levelScoreInfo">
										<span className="levelTime" title="Meilleur temps">
											<Clock size={12} /> {formatTime(level.best_time_seconds)}
										</span>
										<span className="levelScoreValue" title="Score">
											<Trophy size={12} /> {level.score} pts
										</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		));
	}

	/**
	 * Renvoie la liste de choix des niveaux, regroupés par catégorie de difficulté
	 * (mode "Tutorial" uniquement).
	 * 
	 * @returns {JSX.Element[]}
	 */
	function afficheChoice()
	{
		return difficulty.map((category) => {
			const startIdx = category[0] - 1;
			const endIdx = category[1];
			
			// Si on dépasse le nombre de niveaux existants, on s'arrête
			const limit = Math.min(endIdx, jsonCount);
			const levels = [];
			
			for (let i = startIdx; i < limit; i++) {
				const num = i + 1;
				const isCompleted = visibleCompletedLevels.includes(num);
				levels.push(
					<div
						key={num}
						onClick={goToExo}
						data-url={"/exercise/" + mode + "/" + num}
						className={`levelCard ${isCompleted ? "levelCompleted" : ""}`}
					>
						<div className="levelCardTop">
							<span className="levelTitle">Niveau {num}</span>
							{isCompleted && <CheckCircle size={16} className="levelIcon completedIcon" />}
						</div>
					</div>
				);
			}

			return (
				<div key={category[2]} className="levelCategory">
					<div className="categoryHeader">
						<h2>{category[2]}</h2>
					</div>
					<div className="levelsGrid">
						{levels}
					</div>
				</div>
			);
		});
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

const Choice = ({ mode }) => {
	const { user } = useAuth();

	return (
		<ChoiceContent
			key={`${mode}-${user?.id ?? "anon"}`}
			mode={mode}
			user={user}
		/>
	);
};

export default Choice;