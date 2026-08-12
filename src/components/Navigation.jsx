import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/authHooks";
import { useTheme } from "../hooks/themeHooks";


const Navigation = () => {
	const { user, loading, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const [menuOpen, setMenuOpen] = useState(false);
	const location = useLocation();

	// Ferme le menu mobile à chaque changement de page.
	const [prevLocation, setPrevLocation] = useState(location);
	if (location !== prevLocation)
	{
		setPrevLocation(location);
		setMenuOpen(false);
	}

	/**
	 * Empêche le scroll du corps de page quand le menu mobile est ouvert.
	 */
	useEffect(() => {
		document.body.classList.toggle("navOpen", menuOpen);
		return () => document.body.classList.remove("navOpen");
	}, [menuOpen]);

	return (
		<nav className="navigation">
			<NavLink to="/" end className="brand" onClick={() => setMenuOpen(false)}>
				Jeu des Cartes Logiques
			</NavLink>

			<button
				type="button"
				className={`burgerButton${menuOpen ? " isOpen" : ""}`}
				onClick={() => setMenuOpen((open) => !open)}
				aria-expanded={menuOpen}
				aria-controls="primary-navbar"
				aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
			>
				<span></span>
				<span></span>
				<span></span>
			</button>

			<ul id="primary-navbar" className={`navbar${menuOpen ? " isOpen" : ""}`}>
				<li><NavLink to="/tutorials" className="navLink">Tutoriels</NavLink></li>
				<li><NavLink to="/levels" className="navLink">Niveaux</NavLink></li>
				<li><NavLink to="/exercise/Create" className="navLink">Créer un niveau</NavLink></li>
				<li><NavLink to="/leaderboard" className="navLink">Classement</NavLink></li>

				<li className="choose">
					<div>Plus</div>
					<ul>
						<li><NavLink to="/forms">Votre avis</NavLink></li>
						<li><NavLink to="/about">À propos</NavLink></li>
					</ul>
				</li>

				{!loading && !user && (
					<li className="choose">
						<div>Compte</div>
						<ul>
							<li><NavLink to="/login">Connexion</NavLink></li>
							<li><NavLink to="/register">Inscription</NavLink></li>
						</ul>
					</li>
				)}

				{!loading && user && (
					<li className="choose">
						<div>{user.username}</div>
						<ul>
							<li><NavLink to="/profile">Mon profil</NavLink></li>
							{user.role === "admin" && <li><NavLink to="/admin">Administration</NavLink></li>}
							<li>
								<div onClick={logout} className="logoutLink">Déconnexion</div>
							</li>
						</ul>
					</li>
				)}

				<li className="themeNavItem">
					<button
						type="button"
						className="themeIconButton"
						onClick={toggleTheme}
						title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
						aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
					>
						{theme === "dark" ? (
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
								<circle cx="12" cy="12" r="4" />
								<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
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
								<path d="M21 14.3A9 9 0 1 1 9.7 3a7 7 0 0 0 11.3 11.3z" />
							</svg>
						)}
					</button>
				</li>
			</ul>
		</nav>
	);
};

export default Navigation;