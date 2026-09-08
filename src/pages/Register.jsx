import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";


const Register = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordSavedChecked, setPasswordSavedChecked] = useState(false);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	// "register" : formulaire d'inscription. "category" : choix de la catégorie,
	// affiché juste après une inscription réussie, avant de rejoindre le site.
	const [step, setStep] = useState("register");

	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [savingCategory, setSavingCategory] = useState(false);

	const { register, setUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	/**
	 * Charge la liste des catégories dès l'arrivée sur la page, pour qu'elle soit
	 * déjà prête au moment où l'étape "category" s'affiche (pas d'attente visible).
	 */
	useEffect(() => {
		fetch(`${API}/api/categories`)
			.then((response) => response.json())
			.then(setCategories)
			.catch(() => setCategories([]));
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (password !== confirmPassword)
		{
			setError("Les mots de passe ne correspondent pas.");
			return;
		}

		setSubmitting(true);

		const result = await register(username, email, password);

		setSubmitting(false);

		if (result.ok)
			setStep("category");
		else
			setError(result.error);
	};

	/**
	 * Enregistre la catégorie choisie, met à jour le contexte d'authentification,
	 * puis rejoint le site.
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
			.finally(() => {
				setSavingCategory(false);
				const params = new URLSearchParams(window.location.search);
				const redirect = params.get("redirect");
				navigate(redirect && redirect.startsWith("/") ? redirect : "/");
			});
	};

	return (
		<div className="forms">
			<Navigation />
			<div id="forms">
				{step === "register" && (
					<>
						<span className="eyebrow">Nouveau compte</span>
						<h2>Créer un compte</h2>
						<form onSubmit={handleSubmit} className="auth-form">
							<div className="field">
								<label htmlFor="username">Nom d'utilisateur</label>
								<input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
							</div>

							<div className="field">
								<label htmlFor="email">Email</label>
								<input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
							</div>

							<div className="field">
								<label htmlFor="password">Mot de passe</label>
								<div className="password-field">
									<input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
									<button
										type="button"
										className="toggle-password"
										onClick={() => setShowPassword((e) => !e)}
										aria-label={showPassword ? "Masquer le mot de passe" : "Montrer le mot de passe"}
										title={showPassword ? "Masquer le mot de passe" : "Montrer le mot de passe"}
									>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
							</div>

							<div className="field">
								<label htmlFor="confirmPassword">Confirmer le mot de passe</label>
								<input
									id="confirmPassword"
									type={showPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									minLength={8}
									required
								/>
							</div>

							<div className="form-warning">
								Attention : Aucun e-mail de confirmation ne sera envoyé. En cas de perte de votre mot de passe, il ne sera <strong>pas possible</strong> de le récupérer. Veillez à bien le noter en lieu sûr.
							</div>

							<label className="checkbox-field">
								<input
									type="checkbox"
									checked={passwordSavedChecked}
									onChange={(e) => setPasswordSavedChecked(e.target.checked)}
									required
								/>
								<span>J'ai bien noté mon mot de passe et je sais qu'il ne pourra pas être récupéré en cas d'oubli.</span>
							</label>

							{error && <p className="form-error">{error}</p>}

							<button type="submit" className="auth-submit" disabled={submitting || !passwordSavedChecked}>
								{submitting ? "Création..." : "Créer mon compte"}
							</button>

							<p className="auth-switch">
								Déjà un compte ? <NavLink to={`/login${location.search}`}>Se connecter</NavLink>
							</p>
						</form>
					</>
				)}

				{step === "category" && (
					<>
						<span className="eyebrow">Dernière étape</span>
						<h2>Choisir votre catégorie</h2>
						<form onSubmit={handleCategorySubmit} className="auth-form">
							<div className="field">
								<label htmlFor="category">Catégorie</label>
								<select
									id="category"
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
							</div>

							<button type="submit" className="auth-submit" disabled={!selectedCategory || savingCategory}>
								{savingCategory ? "Enregistrement..." : "Confirmer"}
							</button>

							<p className="auth-switch">
								<NavLink to={(() => {
									const params = new URLSearchParams(window.location.search);
									const redirect = params.get("redirect");
									return redirect && redirect.startsWith("/") ? redirect : "/";
								})()}>
									Choisir plus tard
								</NavLink>
							</p>
						</form>
					</>
				)}
			</div>
		</div>
	);
};

export default Register;