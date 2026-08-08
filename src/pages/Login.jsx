import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/authHooks";


const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		const result = await login(email, password);

		setSubmitting(false);

		if (result.ok)
			navigate("/");
		else
			setError(result.error);
	};

	return (
		<div className="forms">
			<Navigation />
			<div id="forms">
				<span className="eyebrow">Connexion</span>
				<form onSubmit={handleSubmit} className="authForm">
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

					{error && <p className="formError">{error}</p>}

					<button type="submit" className="authSubmit" disabled={submitting}>
						{submitting ? "Connexion..." : "Se connecter"}
					</button>

					<p className="authSwitch">
						Pas de compte ? <NavLink to="/register">S'inscrire</NavLink>
					</p>
				</form>
			</div>
		</div>
	);
};

export default Login;