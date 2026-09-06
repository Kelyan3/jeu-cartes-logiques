import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Navigation from "../components/Navigation";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";
import { User, Trophy, Target, AlertTriangle, Settings, Tags } from "lucide-react";


const Profile = () => {
	const { user, setUser, loading: authLoading } = useAuth();

	const [playCompleted, setPlayCompleted] = useState(0);
	const [playTotal, setPlayTotal] = useState(0);
	const [playScore, setPlayScore] = useState(0);
	const [loadedUser, setLoadedUser] = useState(null);
	const [statsError, setStatsError] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const loadingStats = Boolean(user && loadedUser !== user && !statsError);

	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [savingCategory, setSavingCategory] = useState(false);

	useEffect(() => {
		fetch(`${API}/api/categories`)
			.then((response) => response.json())
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

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

	const handleReset = () => {
		setShowResetConfirm(true);
	};

	const executeReset = () => {
		setResetting(true);
		fetch(`${API}/api/progress`, { method: "DELETE", credentials: "include" })
			.then((response) => {
				if (!response.ok)
					throw new Error("Impossible de réinitialiser la progression.");

				setPlayCompleted(0);
				setPlayScore(0);
				setShowResetConfirm(false);
			})
			.catch(() => setStatsError(true))
			.finally(() => setResetting(false));
	};

	useEffect(() => {
		if (!user)
			return;

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
				setLoadedUser(user);
				setStatsError(false);
			})
			.catch(() => {
				if (!ignore)
					setStatsError(true);
			});

		return () => {
			ignore = true;
		};
	}, [user]);

	const playPercent = playTotal > 0 ? Math.round((playCompleted / playTotal) * 100) : 0;
	const userCategoryName = user?.id_category ? categories.find(c => c.id_category === user.id_category)?.name : null;

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
			
			<div className="profileContainer">
				<div className="profileHeader">
					<div className="profileHeaderUser">
						<div className="profileAvatar">
							<User size={32} />
						</div>
						<div className="profileInfo">
							<h2>{user.username}</h2>
							<p>
								<Tags size={14} />
								{userCategoryName ? userCategoryName : "Aucune catégorie"}
							</p>
						</div>
					</div>
					<button className="buttonDanger" onClick={handleReset} disabled={resetting} title="Réinitialiser ma progression">
						<AlertTriangle size={16} />
						{resetting ? "Réinitialisation..." : "Réinitialiser"}
					</button>
				</div>

				{loadingStats && <p className="profileLoading" style={{textAlign: "center"}}>Chargement de vos statistiques...</p>}
				{!loadingStats && statsError && (
					<p className="profileLoading" style={{textAlign: "center", color: "var(--danger)"}}>Impossible de charger vos statistiques.</p>
				)}

				{!loadingStats && !statsError && (
					<>
						<div className="profileStatsGrid">
							<div className="profileStatCard statScore">
								<div className="statHeader">
									<Trophy size={18} />
									Score global
								</div>
								<div className="statValue">{playScore}</div>
								<div style={{ fontSize: "13px", color: "var(--text-muted)" }}>points accumulés</div>
							</div>
							
							<div className="profileStatCard">
								<div className="statHeader">
									<Target size={18} />
									Progression
								</div>
								<div className="statValue">{playCompleted} <span style={{fontSize: "16px", color: "var(--text-muted)"}}>/ {playTotal}</span></div>
								<div className="statProgress">
									<div className="statProgressHeader">
										<span>Niveaux complétés</span>
										<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{playPercent}%</span>
									</div>
									<div className="progressTrack">
										<div className="progressFill" style={{ width: playPercent + "%"}}></div>
									</div>
								</div>
							</div>
						</div>

						<div className="profileSection">
							<h3><Settings size={18} /> Paramètres du compte</h3>
							<p className="sectionDesc">Sélectionnez la catégorie qui correspond le mieux à votre profil pour adapter certaines fonctionnalités du jeu.</p>
							
							<form className="profileFormGroup" onSubmit={handleCategorySubmit}>
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
								<button type="submit" className="buttonPrimary" disabled={!selectedCategory || savingCategory}>
									{savingCategory ? "Enregistrement..." : "Valider"}
								</button>
							</form>
						</div>
					</>
				)}
			</div>

			<ConfirmModal
				isOpen={showResetConfirm}
				variant="danger"
				title="Réinitialiser la progression"
				message="Voulez-vous vraiment réinitialiser toute votre progression ? Vos niveaux complétés et votre score global seront définitivement remis à zéro. Cette action est irréversible."
				confirmLabel={resetting ? "Réinitialisation..." : "Oui, réinitialiser"}
				cancelLabel="Annuler"
				isPending={resetting}
				onConfirm={executeReset}
				onCancel={() => setShowResetConfirm(false)}
			/>
		</div>
	);
};

export default Profile;