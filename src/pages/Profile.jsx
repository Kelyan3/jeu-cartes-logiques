import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Profile = () => {
	const { user } = useAuth();
	const { theme, toggleTheme } = useTheme();

	const [playCompleted, setPlayCompleted] = useState(0);
	const [playTotal, setPlayTotal] = useState(0);
	const [tutorialCompleted, setTutorialCompleted] = useState(0);
	const [tutorialTotal, setTutorialTotal] = useState(0);
	const [loadingStats, setLoadingStats] = useState(true);
	const [resetting, setResetting] = useState(false);

	const API = import.meta.env.DEV ? "http://localhost:80" : "";

	const handleReset = () => {
		const confirmed = window.confirm("Réinitialiser toute votre progression ? Cette action est irréversible.");
		if (!confirmed)
			return;

		setResetting(true);
		fetch(`${API}/api/progress`, { method: "DELETE", credentials: "include", })
			.then(() => {
				setPlayCompleted(0);
				setTutorialCompleted(0);
			})
			.finally(() => setResetting(false));
	};

	useEffect(() => {
		if (!user)
			return;

		Promise.all([
			fetch("/json/manifest.json")
				.then((response) => response.json()),
			fetch(`${API}/api/progress`, { credentials: "include" })
				.then((response) => response.json()),
		])
			.then(([manifest, progress]) => {
				setPlayTotal(manifest.Play ?? 0);
				setTutorialTotal(manifest.Tutorial ?? 0);
				setPlayCompleted(progress.filter((p) => p.mode === "Play" && p.completed).length);
				setTutorialCompleted(progress.filter((p) => p.mode === "Tutorial" && p.completed).length);
			})
			.finally(() => setLoadingStats(false));
	}, [user]);

	const playPercent = playTotal > 0 ? Math.round((playCompleted / playTotal) * 100) : 0;

	return (
		<div className="forms">
			<Navigation />
			<div id="forms" className="profileCard">
				<span className="eyebrow">Mon compte</span>
				<h2>{user?.username}</h2>

				{loadingStats && <p className="profileLoading">Chargement des statistiques...</p>}

				{!loadingStats && (
					<>
						<div className="progressBlock">
							<div className="progressLabel">
								<span>Niveaux complétés</span>
								<span>{playPercent}%</span>
							</div>

							<div className="progressTrack">
								<div className="progressFill" style={{ width: playPercent + "%"}}></div>
							</div>

							<div className="progressCount">{playCompleted} / {playTotal}</div>

							<div className="tutorialCount">Tutoriels complétés : {tutorialCompleted} / {tutorialTotal}</div>

							<div className="preferencesBlock">
								<span className="eyebrow">Préférences</span>
								<label className="themeSwitch">
									<input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
									<span className="themeSwitchTrack"></span>
									<span className="themeSwitchLabel">Mode sombre</span>
								</label>
							</div>

							<button className="resetButton" onClick={handleReset}>
								{resetting ? "Réinitialisation..." : "Réinitialiser ma progression"}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Profile;