import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/authHooks";
import { useTheme } from "../hooks/themeHooks";


const Navigation = () => {
	const { user, loading, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();

	return (
		<nav className="navigation">
			<NavLink to="/" end className="brand">Jeu des Cartes Logiques</NavLink>

			<ul className="navbar">
				{/* Liens principaux toujours visibles */}
				<li><NavLink to="/Tutorials" className="navLink">Tutoriels</NavLink></li>
				<li><NavLink to="/Levels" className="navLink">Niveaux</NavLink></li>
				<li><NavLink to="/Exercise/Create" className="navLink">Créer un niveau</NavLink></li>
				<li><NavLink to="/Leaderboard" className="navLink">Classement</NavLink></li>

				{/* Menu secondaire */}
				<li className="choose">
					<div>Plus</div>
					<ul>
						<li><NavLink to="/Forms">Votre avis</NavLink></li>
						<li><NavLink to="/About">À propos</NavLink></li>
					</ul>
				</li>

				{/* Compte */}
				{!loading && !user && (
					<li className="choose">
						<div>Compte</div>
						<ul>
							<li><NavLink to="/Login">Connexion</NavLink></li>
							<li><NavLink to="/Register">Inscription</NavLink></li>
						</ul>
					</li>
				)}

				{!loading && user && (
					<li className="choose">
						<div>{user.username}</div>
						<ul>
							<li><NavLink to="/Profile">Mon profil</NavLink></li>
							<li>
								<div onClick={logout} className="logoutLink">Déconnexion</div>
							</li>
						</ul>
					</li>
				)}

				{/* Switch mode sombre */}
				<li className="themeNavItem">
					<button
						type="button"
						className="themeIconButton"
						onClick={toggleTheme}
						title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
						aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
					>
						{theme === "dark" ? (
							/* Soleil : cliquer pour repasser en clair */
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
							/* Lune : cliquer pour passer en sombre */
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