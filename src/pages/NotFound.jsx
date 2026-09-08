import { NavLink } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Compass, ArrowLeft } from "lucide-react";


const NotFound = () => {
	return (
		<div className="home">
			<Navigation />
			<div id="not-found">
				<Compass size={64} className="not-found-icon" />
				<span className="eyebrow">Erreur 404</span>
				<h1>Aucune démonstration ne mène ici</h1>
				<p>Il semblerait que vous vous soyez perdu en chemin. Cette page n'existe pas ou a été déplacée.</p>
				
				<NavLink to="/" className="back-home">
					<ArrowLeft size={18} />
					Retour à l'accueil
				</NavLink>
			</div>
		</div>
	);
};

export default NotFound;