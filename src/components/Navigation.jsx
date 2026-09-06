import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthModal } from "../context/AuthModalContext";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon, ChevronDown } from "lucide-react";


const Navigation = () => {
	const { user, loading, logout } = useAuth();
	const { openAuthModal } = useAuthModal();
	const { theme, toggleTheme } = useTheme();
	const [menuOpen, setMenuOpen] = useState(false);

	// Ferme le menu mobile lors des navigations par l'historique du navigateur.
	useEffect(() => {
		const handlePopState = () => setMenuOpen(false);
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	/**
	 * Empêche le scroll du corps de page quand le menu mobile est ouvert.
	 */
	useEffect(() => {
		document.body.classList.toggle("navOpen", menuOpen);
		return () => document.body.classList.remove("navOpen");
	}, [menuOpen]);

	const handleProtectedClick = (path) => (event) => {
		if (!loading && !user)
		{
			event.preventDefault();
			setMenuOpen(false);
			openAuthModal(path);
		}
	};

	const handleNavbarClick = (event) => {
		if (event.target.closest("a, .logoutLink"))
			setMenuOpen(false);
	};

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

			<ul
				id="primary-navbar"
				className={`navbar${menuOpen ? " isOpen" : ""}`}
				onClick={handleNavbarClick}
			>
				<li>
					<NavLink to="/tutorials" className="navLink" onClick={handleProtectedClick("/tutorials")}>
						Tutoriels
					</NavLink>
				</li>
				<li>
					<NavLink to="/levels" className="navLink" onClick={handleProtectedClick("/levels")}>
						Niveaux
					</NavLink>
				</li>
				<li>
					<NavLink to="/exercise/Create" className="navLink" onClick={handleProtectedClick("/exercise/Create")}>
						Créer un niveau
					</NavLink>
				</li>
				<li><NavLink to="/leaderboard" className="navLink">Classement</NavLink></li>

				<li className="choose">
					<div className="dropdownTrigger">
						Plus <ChevronDown size={14} className="chevron" />
					</div>
					<ul>
						<li><NavLink to="/forms">Votre avis</NavLink></li>
						<li><NavLink to="/about">À propos</NavLink></li>
					</ul>
				</li>

				{!loading && !user && (
					<li className="choose">
						<div className="dropdownTrigger">
							Compte <ChevronDown size={14} className="chevron" />
						</div>
						<ul>
							<li><NavLink to="/login">Connexion</NavLink></li>
							<li><NavLink to="/register">Inscription</NavLink></li>
						</ul>
					</li>
				)}

				{!loading && user && (
					<li className="choose">
						<div className="dropdownTrigger">
							{user.username} <ChevronDown size={14} className="chevron" />
						</div>
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
							<Sun size={20} />
						) : (
							<Moon size={20} />
						)}
					</button>
				</li>
			</ul>
		</nav>
	);
};

export default Navigation;