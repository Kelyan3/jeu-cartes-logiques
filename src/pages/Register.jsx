import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../context/authHooks";


const Register = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		const result = await register(username, email, password);

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
						<input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
					</div>

					{error && <p className="formError">{error}</p>}

					<button type="submit" className="authSubmit" disabled={submitting}>
						{submitting ? "Création..." : "Créer mon compte"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default Register;