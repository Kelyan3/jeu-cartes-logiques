import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/authHooks";


const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

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
						<input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
					</div>

					{error && <p className="formError">{error}</p>}

					<button type="submit" className="authSubmit" disabled={submitting}>
						{submitting ? "Connexion..." : "Se connecter"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default Login;