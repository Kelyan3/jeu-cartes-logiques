import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { API_BASE_URL as API } from "../config/api";


const Leaderboard = () => {
	const [entries, setEntries] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			fetch("/json/manifest.json").then((response) => response.json()),
			fetch(`${API}/api/leaderboard`).then((response) => response.json()),
		])
			.then(([manifest, leaderboard]) => {
				setTotal(manifest.Play ?? 0);
				setEntries(leaderboard);
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="home">
			<Navigation />
			<div className="leaderboardCard">
				<span className="eyebrow">Classement</span>
				<br /><br />
				<h2>Progression des joueurs</h2>

				{loading && <p className="profileLoading">Chargement...</p>}

				{!loading && (
					<table className="leaderboardTable">
						<thead>
							<tr>
								<th>Utilisateur</th>
								<th>Niveaux complétés</th>
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