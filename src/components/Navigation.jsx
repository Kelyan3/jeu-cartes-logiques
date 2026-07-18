import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Navigation = () => {
	const nbTuto = 7;
	const { user, loading, logout } = useAuth();

	return (
		<div className="navigation">
			<ul className="navbar">
				<li>
					<div>Menu</div>
					<ul>
						<li><NavLink exact="true" to="/">Accueil</NavLink></li>
						<li><NavLink exact="true" to="/Tutorials">Tutoriel</NavLink></li>
						<li><NavLink exact="true" to="/Levels">Choisir un niveau</NavLink></li>
						<li><NavLink exact="true" to="/Exercise/Create">Créer un niveau</NavLink></li>
						<li><NavLink exact="true" to="/About">À propos</NavLink></li>
						<li><NavLink exact="true" to="/Forms">Votre avis</NavLink></li>

						{!loading && !user && (
							<li className="choose">
								<div>Compte</div>
								<ul>
									<li><NavLink exact="true" to="/Login">Connexion</NavLink></li>
									<li><NavLink exact="true" to="/Register">Inscription</NavLink></li>
								</ul>
							</li>
						)}

						{!loading && user && (
							<li className="choose">
								<div>{user.username}</div>
								<ul>
									<li><div onClick={logout} style={{ cursor: "pointer" }}>Déconnexion</div></li>
								</ul>
							</li>
						)}
					</ul>
				</li>
			</ul>

			<h1>Jeu des Cartes Logiques</h1>
			{window.location.pathname.startsWith("/Exercise/Play/") && (
				<div id="titrePage">
					{"Niveau " + window.location.pathname.split("/")[3]}
				</div>
			)}
			
			{window.location.pathname === "/" && (
				<div id="titrePage">{"Accueil"}</div>
			)}

			{window.location.pathname === "/About" && (
				<div id="titrePage">{"À propos"}</div>
			)}

			{window.location.pathname === "/Forms" && (
				<div id="titrePage">{"Votre avis"}</div>
			)}

			{window.location.pathname === "/Levels" && (
				<div id="titrePage">{"Choix du niveau"}</div>
			)}

			{window.location.pathname === "/Tutorials" && (
				<div id="titrePage">{"Choix du tutoriel"}</div>
			)}

			{window.location.pathname === "/Exercise/Create" && (
				<div id="titrePage">{"Créer un niveau"}</div>
			)}

			{window.location.pathname.startsWith("/Exercise/Tutorial/") && (
				<div id="titrePage">
					{"Tutoriel " + window.location.pathname.split("/")[3]}
				</div>
			)}
		</div>
	);
};

export default Navigation;