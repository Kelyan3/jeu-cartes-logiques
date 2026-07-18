import React from "react";
import Navigation from "../components/Navigation"

const About = () => {
	return (
		<div className="about">
			<Navigation />
			<div id="credits">
				<h2>À propos de ce site</h2>

				<a href="https://unc.nc/" target="_blank" rel="noopener noreferrer">
					<img src={"img/logo_unc.png"} alt="Logo de l'Université de Nouvelle-Calédonie" />
				</a>

				<p><span className="eyebrow">Projet tutoré</span> — Création d'un jeu de logique encadré par M. Éric EDO. <a className="linkedinBadge" href="https://www.linkedin.com/in/eric-edo-8a0639228/" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn d'Éric EDO"}/></a></p>
				<p>Les 3 étudiants qui ont réalisé ce projet en 2023 sont : </p>
				<ul>
					<li>Florian AUDOUARD <a className="linkedinBadge" href="https://www.linkedin.com/in/florian-audouard-8b5b451a3/" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn de Florian AUDOUARD"}/></a></li>
					<li>Adrien FÉRÉ <a className="linkedinBadge" href="https://www.linkedin.com/in/adrien-f-9a411a1b8/" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn d'Adrien FÉRÉ"}/></a></li>
					<li>Guillaume PERRON <a className="linkedinBadge" href="https://www.linkedin.com/in/guillaume-perron-b586b31b8/" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn de Guillaume PERRON"}/></a></li>
				</ul>
				<p>Les 2 étudiants qui ont continué l'amélioration du site en 2026 sont :</p>
				<ul>
					<li>Kelyan MESNARD <a className="linkedinBadge" href="https://www.linkedin.com/in/kmesnard" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn de Kelyan MESNARD"}/></a></li>
					<li>Mickael MENADI <a className="linkedinBadge" href="https://www.linkedin.com/in/mickael-menadi-358888335/" target="_blank" rel="noopener noreferrer"><img className="linkedin" src={"img/logo_linkedin.png"} alt={"LinkedIn de Mickael MENADI"}/></a></li>
				</ul>
			</div>
		</div>
	);
};

export default About;