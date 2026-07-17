import React from "react";
import { NavLink } from "react-router-dom";

const Navigation = () => {
	const nbTuto = 7;

	function CreateTuto(props)
	{
		const res = [];
		for (let index = 0; index < nbTuto; index++)
		{
			res.push(
				<li className="exo" key={index}>
					<NavLink exact="true" to={"/Exercise-Tutorial-" + (index + 1)}>Tutoriel {index + 1}</NavLink>
				</li>
			);
		}

		return res;
	}

	return (
		<div className="navigation">
			<ul className="navbar">
				<li>
					<div>Menu</div>
					<ul>
						<li><NavLink exact="true" to="/">Accueil</NavLink></li>
						<li className="choose">
							<div>Tutoriel</div>
							<ul id="tuto">
								<CreateTuto></CreateTuto>
							</ul>
						</li>
						<li><NavLink exact="true" to="/Levels">Choisir un niveau</NavLink></li>
						<li><NavLink exact="true" to="/Exercise-Create">Créer un niveau</NavLink></li>
						<li><NavLink exact="true" to="/About">À propos</NavLink></li>
						<li><NavLink exact="true" to="/Forms">Votre avis</NavLink></li>
					</ul>
				</li>
			</ul>

			<h1>Jeu des Cartes Logiques</h1>
			{window.location.pathname.substring(10, 14) === "Play" && (
				<div id="titrePage">
					{"Niveau " + window.location.pathname.substring(15, 30)}
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

			{window.location.pathname.substring(10, 18) === "Create" && (
				<div id="titrePage">{"Créer un niveau"}</div>
			)}

			{window.location.pathname.substring(10, 18) === "Tutorial" && (
				<div id="titrePage">
					{"Tutoriel " + window.location.pathname.substring(19, 30)}
				</div>
			)}
		</div>
	);
};

export default Navigation;