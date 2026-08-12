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

	/**
	 * Charge en parallèle le nombre total de niveaux (manifeste) et la progression
	 * de l'utilisateur connecté, pour calculer le pourcentage de niveaux Play
	 * complétés et le score total.
	 */
	useEffect(() => {
		if (!user)
		{
			setLoadingStats(false);
			return;
		}

		Promise.all([
			fetch("/json/manifest.json")
				.then((response) => response.json()),
			fetch(`${API}/api/progress`, { credentials: "include" })
				.then((response) => response.json()),
		])
			.then(([manifest, progress]) => {
				setPlayTotal(manifest.Play ?? 0);
				setPlayCompleted(progress.filter((p) => p.mode === "Play" && p.completed).length);
				setPlayScore(
					progress
						.filter((p) => p.mode === "Play" && p.completed)
						.reduce((total, p) => total + p.score, 0)
				);
			})
			.finally(() => setLoadingStats(false));
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

				{!loadingStats && (
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