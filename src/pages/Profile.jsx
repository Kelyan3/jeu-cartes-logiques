import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import Navigation from "../components/Navigation";
import { ConfirmModal } from "../components/Modals";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";
import { formatDate } from "../utils/formatDate";
import { User, Trophy, Target, AlertTriangle, Settings, Tags, Calendar } from "lucide-react";


/**
 * Composant d'affichage pour le profil d'un autre utilisateur.
 */
const OtherUserProfile = ({ username, currentUser }) => {
	const [profile, setProfile] = useState(null);
	const [playTotal, setPlayTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		let ignore = false;

		Promise.all([
			fetch("/json/manifest.json").then((res) => (res.ok ? res.json() : { Play: 0 })),
			fetch(`${API}/api/users/${encodeURIComponent(username)}`).then((res) => {
				if (res.status === 404)
					throw new Error("NOT_FOUND");
				if (!res.ok)
					throw new Error("FETCH_ERROR");
				return res.json();
			}),
		])
			.then(([manifest, data]) => {
				if (ignore)
					return;
				setPlayTotal(manifest.Play ?? 0);
				setProfile(data);
				setNotFound(false);
				setError(false);
			})
			.catch((err) => {
				if (ignore)
					return;
				if (err.message === "NOT_FOUND")
					setNotFound(true);
				else
					setError(true);
			})
			.finally(() => {
				if (!ignore)
					setLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [username]);

	const playPercent = playTotal > 0 ? Math.round(((profile?.completed ?? 0) / playTotal) * 100) : 0;

	return (
		<div className="forms">
			<Navigation />

			<div className="profile-container">
				{loading && (
					<p className="profile-loading" style={{ textAlign: "center", marginTop: "40px" }}>
						Chargement du profil de {username}...
					</p>
				)}

				{!loading && notFound && (
					<div className="profile-section" style={{ textAlign: "center", padding: "48px 24px" }}>
						<AlertTriangle size={48} style={{ color: "var(--accent-amber)", margin: "0 auto 16px" }} />
						<h2>Utilisateur introuvable</h2>
						<p className="section-desc" style={{ marginBottom: "24px" }}>
							Le compte de «&nbsp;{username}&nbsp;» n'existe pas ou a été supprimé.
						</p>
						<NavLink to="/leaderboard" className="button-primary">
							<Trophy size={16} /> Voir le classement
						</NavLink>
					</div>
				)}

				{!loading && !notFound && error && (
					<div className="profile-section" style={{ textAlign: "center", padding: "48px 24px" }}>
						<AlertTriangle size={48} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
						<h2>Erreur de chargement</h2>
						<p className="section-desc" style={{ marginBottom: "24px" }}>
							Impossible de charger le profil de cet utilisateur pour le moment.
						</p>
						<NavLink to="/leaderboard" className="button-primary">
							<Trophy size={16} /> Retour au classement
						</NavLink>
					</div>
				)}

				{!loading && !notFound && !error && profile && (
					<>
						<div className="profile-header">
							<div className="profile-header-user">
								<div className="profile-avatar">
									<User size={32} />
								</div>
								<div className="profile-info">
									<h2>{profile.username}</h2>
									<div className="profile-meta">
										<p>
											<Tags size={14} />
											{profile.category_name || "Aucune catégorie"}
										</p>
										{profile.created_at && (
											<p>
												<Calendar size={14} />
												Compte créé le {formatDate(profile.created_at)}
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="profile-header-actions">
								<NavLink to="/leaderboard" className="button-secondary">
									<Trophy size={16} /> Classement
								</NavLink>
								{currentUser && (
									<NavLink to="/profile" className="button-secondary">
										<User size={16} /> Mon profil
									</NavLink>
								)}
							</div>
						</div>

						<div className="profile-stats-grid">
							<div className="profile-stat-card stat-score">
								<div className="stat-header">
									<Trophy size={18} />
									Score global
								</div>
								<div className="stat-value">{(profile.score ?? 0).toLocaleString()}</div>
								<div style={{ fontSize: "13px", color: "var(--text-muted)" }}>points accumulés</div>
							</div>

							<div className="profile-stat-card">
								<div className="stat-header">
									<Target size={18} />
									Progression
								</div>
								<div className="stat-value">
									{profile.completed ?? 0}{" "}
									<span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {playTotal}</span>
								</div>
								<div className="stat-progress">
									<div className="stat-progress-header">
										<span>Niveaux complétés</span>
										<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{playPercent}%</span>
									</div>
									<div className="progress-track">
										<div className="progress-fill" style={{ width: playPercent + "%" }}></div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};


/**
 * Composant d'affichage pour son propre profil utilisateur.
 */
const OwnProfile = ({ user, setUser }) => {
	const [playCompleted, setPlayCompleted] = useState(0);
	const [playTotal, setPlayTotal] = useState(0);
	const [playScore, setPlayScore] = useState(0);
	const [loadedUser, setLoadedUser] = useState(null);
	const [statsError, setStatsError] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [savingCategory, setSavingCategory] = useState(false);

	// Récupération des catégories
	useEffect(() => {
		fetch(`${API}/api/categories`)
			.then((response) => response.json())
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

	// Récupération de created_at si non présent en mémoire
	useEffect(() => {
		if (user && !user.created_at)
		{
			fetch(`${API}/api/users/${encodeURIComponent(user.username)}`)
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data?.created_at && setUser)
						setUser((prev) => ({ ...prev, created_at: data.created_at }));
				})
				.catch(() => {});
		}
	}, [user, setUser]);

	// Chargement des données de progression
	useEffect(() => {
		if (!user)
			return;

		let ignore = false;

		Promise.all([
			fetch("/json/manifest.json").then((response) => {
				if (!response.ok)
					throw new Error("Impossible de charger le manifeste des niveaux.");
				return response.json();
			}),
			fetch(`${API}/api/progress`, { credentials: "include" }).then((response) => {
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
				if (data.ok && setUser)
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

	if (!user)
	{
		return (
			<div className="forms">
				<Navigation />
				<div id="forms" className="profile-card">
					<span className="eyebrow">Mon compte</span>
					<p>Vous devez être connecté pour voir votre profil.</p>
					<NavLink to="/login" className="auth-submit">
						Se connecter
					</NavLink>
				</div>
			</div>
		);
	}

	const loadingStats = Boolean(loadedUser !== user && !statsError);
	const playPercent = playTotal > 0 ? Math.round((playCompleted / playTotal) * 100) : 0;
	const userCategoryName = user?.id_category
		? categories.find((c) => c.id_category === user.id_category)?.name
		: null;

	return (
		<div className="forms">
			<Navigation />

			<div className="profile-container">
				<div className="profile-header">
					<div className="profile-header-user">
						<div className="profile-avatar">
							<User size={32} />
						</div>
						<div className="profile-info">
							<h2>{user.username}</h2>
							<div className="profile-meta">
								<p>
									<Tags size={14} />
									{userCategoryName || "Aucune catégorie"}
								</p>
								{user.created_at && (
									<p>
										<Calendar size={14} />
										Compte créé le {formatDate(user.created_at)}
									</p>
								)}
							</div>
						</div>
					</div>

					<div className="profile-header-actions">
						<NavLink to="/leaderboard" className="button-secondary">
							<Trophy size={16} /> Classement
						</NavLink>
						<button
							className="button-danger"
							onClick={handleReset}
							disabled={resetting}
							title="Réinitialiser ma progression"
						>
							<AlertTriangle size={16} />
							{resetting ? "Réinitialisation..." : "Réinitialiser"}
						</button>
					</div>
				</div>

				{loadingStats && (
					<p className="profile-loading" style={{ textAlign: "center" }}>
						Chargement de vos statistiques...
					</p>
				)}
				{!loadingStats && statsError && (
					<p className="profile-loading" style={{ textAlign: "center", color: "var(--danger)" }}>
						Impossible de charger vos statistiques.
					</p>
				)}

				{!loadingStats && !statsError && (
					<>
						<div className="profile-stats-grid">
							<div className="profile-stat-card stat-score">
								<div className="stat-header">
									<Trophy size={18} />
									Score global
								</div>
								<div className="stat-value">{playScore.toLocaleString()}</div>
								<div style={{ fontSize: "13px", color: "var(--text-muted)" }}>points accumulés</div>
							</div>

							<div className="profile-stat-card">
								<div className="stat-header">
									<Target size={18} />
									Progression
								</div>
								<div className="stat-value">
									{playCompleted}{" "}
									<span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {playTotal}</span>
								</div>
								<div className="stat-progress">
									<div className="stat-progress-header">
										<span>Niveaux complétés</span>
										<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{playPercent}%</span>
									</div>
									<div className="progress-track">
										<div className="progress-fill" style={{ width: playPercent + "%" }}></div>
									</div>
								</div>
							</div>
						</div>

						<div className="profile-section">
							<h3>
								<Settings size={18} /> Paramètres du compte
							</h3>
							<p className="section-desc">
								Sélectionnez la catégorie qui correspond le mieux à votre profil pour adapter certaines
								fonctionnalités du jeu.
							</p>

							<form className="profile-form-group" onSubmit={handleCategorySubmit}>
								<select
									value={selectedCategory}
									onChange={(event) => setSelectedCategory(event.target.value)}
								>
									<option value="" disabled>
										Choisis ta catégorie...
									</option>
									{categories.map((category) => (
										<option key={category.id_category} value={category.id_category}>
											{category.name}
										</option>
									))}
								</select>
								<button
									type="submit"
									className="button-primary"
									disabled={!selectedCategory || savingCategory}
								>
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


/**
 * Route principale /profile et /profile/:username
 */
const Profile = () => {
	const { username: paramUsername } = useParams();
	const { user, setUser, loading: authLoading } = useAuth();

	if (authLoading)
	{
		return (
			<div className="forms">
				<Navigation />
			</div>
		);
	}

	const isViewingOther = Boolean(paramUsername && (!user || paramUsername.toLowerCase() !== user.username.toLowerCase()));
	if (isViewingOther)
		return <OtherUserProfile username={paramUsername} currentUser={user} />;

	return <OwnProfile user={user} setUser={setUser} />;
};

export default Profile;