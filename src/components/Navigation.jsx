import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Navigation = () => {
	const { user, loading, logout } = useAuth();

	return (
		<nav className="navigation">
			<NavLink to="/" end className="brand">Jeu des Cartes Logiques</NavLink>

			<ul className="navbar">
				<li className="choose">
					<div>Menu</div>
					<ul>
						<li><NavLink to="/" end>Accueil</NavLink></li>
						<li><NavLink to="/Settings">Paramètres</NavLink></li>
						<li><NavLink to="/Tutorials">Tutoriel</NavLink></li>
						<li><NavLink to="/Levels">Choisir un niveau</NavLink></li>
						<li><NavLink to="/Exercise/Create">Créer un niveau</NavLink></li>
						<li><NavLink to="/Leaderboard">Classement</NavLink></li>
						<li><NavLink to="/About">À propos</NavLink></li>
						<li><NavLink to="/Forms">Votre avis</NavLink></li>
					</ul>
				</li>

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
							<li><div onClick={logout} className="logoutLink">Déconnexion</div></li>
						</ul>
					</li>
				)}
			</ul>
		</nav>
	);
};

export default Navigation;