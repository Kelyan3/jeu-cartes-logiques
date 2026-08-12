import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { API_BASE_URL as API } from "../config/api";


const Leaderboard = () => {
	const [entries, setEntries] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
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
	}

	useEffect(() => {
		const query = selectedCategory ? `?category=${selectedCategory}` : "";

		// Ignore la réponse si selectedCategory a de nouveau changé avant qu'elle
		// n'arrive (évite d'écraser des données plus récentes avec une réponse obsolète).
		let ignore = false;

		Promise.all([
			fetch("/json/manifest.json").then((response) => response.json()),
			fetch(`${API}/api/leaderboard${query}`).then((response) => response.json()),
		])
			.then(([manifest, leaderboard]) => {
				if (ignore)
					return;

				setTotal(manifest.Play ?? 0);
				setEntries(leaderboard);
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
				<br /><br />
				<h2>Progression des joueurs</h2>

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

				{loading && <p className="profileLoading">Chargement...</p>}

				{!loading && (
					<table className="leaderboardTable">
						<thead>
							<tr>
								<th>Utilisateur</th>
								<th>Niveaux complétés</th>
								<th>Score</th>
								<th>Progression</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => {
								const percent = total > 0 ? Math.round((entry.completed / total) * 100) : 0;
								return (
									<tr key={entry.username}>
										<td>{entry.username}</td>
										<td>{entry.completed} / {total}</td>
										<td>{entry.score}</td>
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