import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";


const Login = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		const result = await login(username, email, password);

		setSubmitting(false);

		if (result.ok)
		{
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get("redirect");
			navigate(redirect && redirect.startsWith("/") ? redirect : "/");
		}
		else
			setError(result.error);
	};

	return (
		<div className="forms">
			<Navigation />
			<div id="forms">
				<span className="eyebrow">Connexion</span>
				<h2>Se connecter</h2>
				<form onSubmit={handleSubmit} className="authForm">
					<div className="field">
						<label htmlFor="username">Nom d'utilisateur</label>
						<input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
					</div>

					<div className="field">
						<label htmlFor="email">Adresse email</label>
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
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					{error && <p className="formError">{error}</p>}

					<button type="submit" className="authSubmit" disabled={submitting}>
						{submitting ? "Connexion..." : "Se connecter"}
					</button>

					<p className="authSwitch">
						Pas de compte ? <NavLink to={`/register${location.search}`}>S'inscrire</NavLink>
					</p>
				</form>
			</div>
		</div>
	);
};

export default Login;