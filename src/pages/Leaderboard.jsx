import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
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

	const handleCategoryChange = (event) => {
		setSelectedCategory(event.target.value);
		setLoading(true);
		setLoadError(false);
	};

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
			<div className="leaderboard-card">
				<span className="eyebrow">Classement</span>
				<h2>Progression des joueurs</h2>

				<div className="filter-container">
					<select
						className="leaderboard-filter"
						value={selectedCategory}
						onChange={handleCategoryChange}
					>
						<option value="">Toutes les catégories</option>
						{categories.map((category) => (
							<option key={category.id_category} value={category.id_category}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{loading && <p className="profile-loading">Chargement en cours...</p>}

				{!loading && loadError && (
					<p className="profile-loading">Impossible de charger le classement pour le moment. Réessayez plus tard.</p>
				)}

				{!loading && !loadError && entries.length === 0 && (
					<div className="empty-leaderboard">
						<Trophy size={48} className="empty-icon" />
						<p>Aucun joueur dans cette catégorie pour le moment.</p>
					</div>
				)}

				{!loading && !loadError && entries.length > 0 && (
					<table className="leaderboard-table">
						<thead>
							<tr>
								<th className="rank-col">Rang</th>
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
										<td className="rank-col">
											{index === 0 && <Trophy size={20} className="rank-icon gold" />}
											{index === 1 && <Medal size={20} className="rank-icon silver" />}
											{index === 2 && <Medal size={20} className="rank-icon bronze" />}
											{index > 2 && <span className="rank-number">{index + 1}</span>}
										</td>
										<td className="user-col">
											<NavLink to={`/profile/${entry.username}`} className="user-profile-link" title={`Voir le profil de ${entry.username}`}>
												{entry.username}
											</NavLink>
										</td>
										<td>{entry.completed} <span className="total-levels">/ {total}</span></td>
										<td className="score-col">{entry.score.toLocaleString()}</td>
										<td>
											<div className="progress-track leaderboard-progress">
												<div className="progress-fill" style={{ width: percent + "%", }}></div>
											</div>
											<span className="leaderboard-percent">{percent}%</span>
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