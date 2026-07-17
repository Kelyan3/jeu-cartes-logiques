import React from "react";
import Navigation from "../components/Navigation";

const Forms = () => {
	return (
		<div className="forms">
			<Navigation />
			<div id="forms">
				<iframe
					src="https://docs.google.com/forms/d/e/1FAIpQLSexM3YkB3s5MqKKW0GwfLeP-Onkbp8HTK-ukedIcsU5qDjDOw/viewform?embedded=true"
					title="Questionnaire pour donner son avis sur le site du Jeu des Cartes Logiques"
					width="640"
					height="668"
					frameBorder="0"
					marginHeight="0"
					marginWidth="0"
				>
					Chargement...
				</iframe>
			</div>
		</div>
	);
};

export default Forms;