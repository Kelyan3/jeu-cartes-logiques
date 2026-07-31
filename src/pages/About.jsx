import Navigation from "../components/Navigation"

const About = () => {
	return (
		<div className="about">
			<Navigation />
			<div id="credits" className="credits-container">
				<h2>À propos de ce site</h2>

				<a href="https://unc.nc/" target="_blank" rel="noopener noreferrer" className="logo-unc-link">
					<img src="img/logo_unc.png" alt="Logo de l'Université de Nouvelle-Calédonie" className="logo-unc" />
				</a>

				<div className="project-lead">
					<span className="eyebrow">Projet tutoré</span>
					<p>
						Création d'un jeu de logique encadré par <strong>Éric EDO</strong>
						<a className="linkedin-badge" href="https://www.linkedin.com/in/eric-edo-8a0639228/" target="_blank" rel="noopener noreferrer">
							<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn d'Éric EDO"/>
						</a>
					</p>
				</div>

				<hr className="separator" />

				<div className="team-section">
					<h3>Version initiale (2023)</h3>
					<ul className="students-grid">
						<li>
							<span>Florian AUDOUARD</span>
							<a className="linkedin-badge" href="https://www.linkedin.com/in/florian-audouard-8b5b451a3/" target="_blank" rel="noopener noreferrer">
								<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn de Florian AUDOUARD"/>
							</a>
						</li>
						<li>
							<span>Adrien FÉRÉ</span>
							<a className="linkedin-badge" href="https://www.linkedin.com/in/adrien-f-9a411a1b8/" target="_blank" rel="noopener noreferrer">
								<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn d'Adrien FÉRÉ"/>
							</a>
						</li>
						<li>
							<span>Guillaume PERRON</span>
							<a className="linkedin-badge" href="https://www.linkedin.com/in/guillaume-perron-b586b31b8/" target="_blank" rel="noopener noreferrer">
								<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn de Guillaume PERRON"/>
							</a>
						</li>
					</ul>
				</div>

				<div className="team-section">
					<h3>Évolution & Amélioration (2026)</h3>
					<ul className="students-grid two-columns">
						<li>
							<span>Kelyan MESNARD</span>
							<a className="linkedin-badge" href="https://www.linkedin.com/in/kmesnard" target="_blank" rel="noopener noreferrer">
								<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn de Kelyan MESNARD"/>
							</a>
						</li>
						<li>
							<span>Mickael MENADI</span>
							<a className="linkedin-badge" href="https://www.linkedin.com/in/mickael-menadi-358888335/" target="_blank" rel="noopener noreferrer">
								<img className="linkedin-icon" src="img/logo_linkedin.png" alt="LinkedIn de Mickael MENADI"/>
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default About;