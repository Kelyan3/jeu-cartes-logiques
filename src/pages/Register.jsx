import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";


const Register = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
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
				navigate("/");
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
						<form onSubmit={handleSubmit} className="authForm">
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
								<div className="passwordField">
									<input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
									<button
										type="button"
										className="togglePassword"
										onClick={() => setShowPassword((e) => !e)}
										aria-label={showPassword ? "Masquer le mot de passe" : "Montrer le mot de passe"}
										title={showPassword ? "Masquer le mot de passe" : "Montrer le mot de passe"}
									>
										{showPassword ? (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
												<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
												<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
												<line x1="1" y1="1" x2="23" y2="23" />
											</svg>
										) : (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
												<circle cx="12" cy="12" r="3" />
											</svg>
										)}
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

							{error && <p className="formError">{error}</p>}

							<button type="submit" className="authSubmit" disabled={submitting}>
								{submitting ? "Création..." : "Créer mon compte"}
							</button>

							<p className="authSwitch">
								Déjà un compte ? <NavLink to="/login">Se connecter</NavLink>
							</p>
						</form>
					</>
				)}

				{step === "category" && (
					<>
						<span className="eyebrow">Dernière étape</span>
						<h2>Choisir votre catégorie</h2>
						<form onSubmit={handleCategorySubmit} className="authForm">
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

							<button type="submit" className="authSubmit" disabled={!selectedCategory || savingCategory}>
								{savingCategory ? "Enregistrement..." : "Confirmer"}
							</button>

							<p className="authSwitch">
								<NavLink to="/" onClick={() => navigate("/")}>Choisir plus tard</NavLink>
							</p>
						</form>
					</>
				)}
			</div>
		</div>
	);
};

export default Register;