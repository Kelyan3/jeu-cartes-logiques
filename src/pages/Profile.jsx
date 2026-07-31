import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";

import { useAuth } from "../context/authHooks";

import { API_BASE_URL as API } from "../config/api";

const Profile = () => {
	const { user } = useAuth();

	const [playCompleted, setPlayCompleted] = useState(0);
	const [playTotal, setPlayTotal] = useState(0);
	const [tutorialCompleted, setTutorialCompleted] = useState(0);
	const [tutorialTotal, setTutorialTotal] = useState(0);
	const [loadingStats, setLoadingStats] = useState(true);
	const [resetting, setResetting] = useState(false);

	/**
	 * Supprime toute la progression de l'utilisateur en base de données,
	 * après confirmation, et remet les compteurs affichés à zéro localement.
	 */
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

	/**
	 * Charge en parallèle le nombre total de niveaux (manifeste) et la progression
	 * de l'utilisateur connecté, pour calculer le pourcentage de niveaux Play complétés
	 * et le compteur de tutoriels complétés.
	 */
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

	// Évite une division par zéro si le manifeste n'a pas encore chargé playTotal.
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