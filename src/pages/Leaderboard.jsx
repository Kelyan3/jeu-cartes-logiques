import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { API_BASE_URL as API } from "../config/api";
import { Trophy, Medal } from "lucide-react";


const Leaderboard = () => {
	const [entries, setEntries] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");

	useEffect(() => {
		fetch(`${API}/api/categories`)
			.then((response) => response.json())
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

	// Repasse en "Chargement..." dès que la catégorie sélectionnée change.
	const [loadingCategory, setLoadingCategory] = useState(selectedCategory);
	if (loadingCategory !== selectedCategory)
	{
		setLoadingCategory(selectedCategory);
		setLoading(true);
		setLoadError(false);
	}

	useEffect(() => {
		const query = selectedCategory ? `?category=${selectedCategory}` : "";

		// Ignore la réponse si selectedCategory a de nouveau changé avant qu'elle
		// n'arrive (évite d'écraser des données plus récentes avec une réponse obsolète).
		let ignore = false;

		Promise.all([
			fetch("/json/manifest.json")
				.then((response) => {
					if (!response.ok)
						throw new Error("Impossible de charger le manifeste des niveaux.");
					return response.json();
				}),
			fetch(`${API}/api/leaderboard${query}`)
				.then((response) => {
					if (!response.ok)
						throw new Error("Impossible de charger le classement.");
					return response.json();
				}),
		])
			.then(([manifest, leaderboard]) => {
				if (ignore)
					return;

				setTotal(manifest.Play ?? 0);
				setEntries(leaderboard);
			})
			.catch(() => {
				if (!ignore)
					setLoadError(true);
			})
			.finally(() => {
				if (!ignore)
					setLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [selectedCategory]);

	return (
		<div className="home">
			<Navigation />
			<div className="leaderboardCard">
				<span className="eyebrow">Classement</span>
				<h2>Progression des joueurs</h2>

				<div className="filterContainer">
					<select
						className="leaderboardFilter"
						value={selectedCategory}
						onChange={(event) => setSelectedCategory(event.target.value)}
					>
						<option value="">Toutes les catégories</option>
						{categories.map((category) => (
							<option key={category.id_category} value={category.id_category}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{loading && <p className="profileLoading">Chargement en cours...</p>}

				{!loading && loadError && (
					<p className="profileLoading">Impossible de charger le classement pour le moment. Réessayez plus tard.</p>
				)}

				{!loading && !loadError && entries.length === 0 && (
					<div className="emptyLeaderboard">
						<Trophy size={48} className="emptyIcon" />
						<p>Aucun joueur dans cette catégorie pour le moment.</p>
					</div>
				)}

				{!loading && !loadError && entries.length > 0 && (
					<table className="leaderboardTable">
						<thead>
							<tr>
								<th className="rankCol">Rang</th>
								<th>Utilisateur</th>
								<th>Niveaux</th>
								<th>Score</th>
								<th>Progression</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry, index) => {
								const percent = total > 0 ? Math.round((entry.completed / total) * 100) : 0;
								return (
									<tr key={entry.username} className={index < 3 ? `top-rank top-rank-${index + 1}` : ""}>
										<td className="rankCol">
											{index === 0 && <Trophy size={20} className="rankIcon gold" />}
											{index === 1 && <Medal size={20} className="rankIcon silver" />}
											{index === 2 && <Medal size={20} className="rankIcon bronze" />}
											{index > 2 && <span className="rankNumber">{index + 1}</span>}
										</td>
										<td className="userCol">{entry.username}</td>
										<td>{entry.completed} <span className="totalLevels">/ {total}</span></td>
										<td className="scoreCol">{entry.score.toLocaleString()}</td>
										<td>
											<div className="progressTrack leaderboardProgress">
												<div className="progressFill" style={{ width: percent + "%", }}></div>
											</div>
											<span className="leaderboardPercent">{percent}%</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
};

export default Leaderboard;