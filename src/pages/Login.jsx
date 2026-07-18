import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../context/AuthContext";


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
				<h2>Connexion</h2>
				<form onSubmit={handleSubmit}>
					<div>
						<label htmlFor="email">Email</label>
						<br />
						<input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					</div>

					<div>
						<label htmlFor="password">Mot de passe</label>
						<br />
						<input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
					</div>

					{error && <p style={{ color: "red" }}>{error}</p>}

					<button type="submit" disabled={submitting}>
						{submitting ? "Connexion..." : "Se connecter"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default Login;