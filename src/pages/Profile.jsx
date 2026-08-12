import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Navigation from "../components/Navigation";

import { useAuth } from "../hooks/authHooks";

import { API_BASE_URL as API } from "../config/api";


const Profile = () => {
	const { user, setUser, loading: authLoading } = useAuth();

	const [playCompleted, setPlayCompleted] = useState(0);
	const [playTotal, setPlayTotal] = useState(0);
	const [playScore, setPlayScore] = useState(0);
	const [loadingStats, setLoadingStats] = useState(true);
	const [statsError, setStatsError] = useState(false);
	const [resetting, setResetting] = useState(false);

	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [savingCategory, setSavingCategory] = useState(false);

	/**
	 * Charge la liste des catégories disponibles (Professeur, Étudiant L1...),
	 * pour le menu déroulant de sélection.
	 */
	useEffect(() => {
		fetch(`${API}/api/categories`)
			.then((response) => response.json())
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

	/**
	 * Enregistre la catégorie choisie par l'utilisateur, puis met à jour
	 * le contexte d'authentification pour refléter le changement partout.
	 */
	const handleCategorySubmit = (event) => {
		event.preventDefault();
		if (!selectedCategory)
			return;

		setSavingCategory(true);
		fetch(`${API}/api/profile/category`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ id_category: Number(selectedCategory) }),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.ok)
					setUser((prevUser) => ({ ...prevUser, id_category: Number(selectedCategory) }));
			})
			.finally(() => setSavingCategory(false));
	};

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
				setPlayScore(0);
			})
			.finally(() => setResetting(false));
	};

	// Ajuste loadingStats dès que user change, pendant le rendu.
	const [statsUser, setStatsUser] = useState(user);
	if (statsUser !== user)
	{
		setStatsUser(user);
		setLoadingStats(!!user);
		setStatsError(false);
	}

	useEffect(() => {
		if (!user)
			return;

		// Ignore la réponse si user a de nouveau changé avant qu'elle arrive
		// (évite d'écraser des données plus récentes avec une réponse obsolète)
		let ignore = false;

		Promise.all([
			fetch("/json/manifest.json")
				.then((response) => {
					if (!response.ok)
						throw new Error("Impossible de charger le manifeste des niveaux.");
					return response.json();
				}),
			fetch(`${API}/api/progress`, { credentials: "include" })
				.then((response) => {
					if (!response.ok)
						throw new Error("Impossible de charger la progression.");
					return response.json();
				}),
		])
			.then(([manifest, progress]) => {
				if (ignore)
					return;

				setPlayTotal(manifest.Play ?? 0);
				setPlayCompleted(progress.filter((p) => p.mode === "Play" && p.completed).length);
				setPlayScore(
					progress
						.filter((p) => p.mode === "Play" && p.completed)
						.reduce((total, p) => total + p.score, 0)
				);
			})
			.catch(() => {
				if (!ignore)
					setStatsError(true);
			})
			.finally(() => {
				if (!ignore)
					setLoadingStats(false);
			});

		return () => {
			ignore = true;
		};
	}, [user]);

	// Évite une division par zéro si le manifeste n'a pas encore chargé playTotal.
	const playPercent = playTotal > 0 ? Math.round((playCompleted / playTotal) * 100) : 0;

	if (authLoading)
	{
		return (
			<div className="forms">
				<Navigation />
			</div>
		);
	}

	if (!user)
	{
		return (
			<div className="forms">
				<Navigation />
				<div id="forms" className="profileCard">
					<span className="eyebrow">Mon compte</span>
					<p>Vous devez être connecté pour voir votre profil.</p>
					<NavLink to="/login" className="authSubmit">Se connecter</NavLink>
				</div>
			</div>
		);
	}

	return (
		<div className="forms">
			<Navigation />
			<div id="forms" className="profileCard">
				<span className="eyebrow">Mon compte</span>
				<h2>{user?.username}</h2>

				{loadingStats && <p className="profileLoading">Chargement des statistiques...</p>}

				{!loadingStats && statsError && (
					<p className="profileLoading">Impossible de charger vos statistiques pour le moment. Réessayez plus tard.</p>
				)}

				{!loadingStats && !statsError && (
					<>
						<div className="field categoryField">
							<label>Catégorie</label>
							{user?.id_category ? (
								<p>{categories.find((c) => c.id_category === user.id_category)?.name ?? "—"}</p>
							) : (
								<form onSubmit={handleCategorySubmit}>
									<select
										value={selectedCategory}
										onChange={(event) => setSelectedCategory(event.target.value)}
									>
										<option value="" disabled>Choisis ta catégorie...</option>
										{categories.map((category) => (
											<option key={category.id_category} value={category.id_category}>
												{category.name}
											</option>
										))}
									</select>
									<button type="submit" className="resetButton" disabled={!selectedCategory || savingCategory}>
										{savingCategory ? "Enregistrement..." : "Valider"}
									</button>
								</form>
							)}
						</div>

						<div className="progressBlock">
							<div className="progressLabel">
								<span>Niveaux complétés</span>
								<span>{playPercent}%</span>
							</div>

							<div className="progressTrack">
								<div className="progressFill" style={{ width: playPercent + "%"}}></div>
							</div>

							<div className="progressCount">{playCompleted} / {playTotal}</div>

							<div className="progressScore">
								<span className="scoreValue">{playScore} pt{playScore > 1 ? "s" : ""}</span>
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