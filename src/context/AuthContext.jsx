import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL as API } from "../config/api";

const AuthContext = createContext(null)


export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API}/api/me`, { credentials: "include" })
			.then((response => response.json()))
			.then((data) => setUser(data))
			.finally(() => setLoading(false));
	}, []);

	/**
	 * Tente de connecter l'utilisateur.
	 * 
	 * @returns {Promise<{ok: true} | {ok: false, error: string}>}
	 */
	const login = async (email, password) => {
		const response = await fetch(`${API}/api/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();
		if (response.ok)
		{
			setUser(data);
			return { ok: true };
		}

		return { ok: false, error: data.error || "Erreur de connexion" };
	};

	/**
	 * Tente de créer un compte, puis connecte automatiquement l'utilisateur.
	 * 
	 * @returns {Promise<{ok: true} | {ok: false, error: string}>}
	 */
	const register = async (username, email, password) => {
		const response = await fetch(`${API}/api/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ username, email, password }),
		});

		const data = await response.json();
		if (response.ok)
		{
			setUser(data);
			return { ok: true };
		}

		return { ok: false, error: data.error || "Erreur lors de l'inscription" };
	};

	const logout = async () => {
		await fetch(`${API}/api/logout`, {
			method: "POST",
			credentials: "include",
		});

		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);