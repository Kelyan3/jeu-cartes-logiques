import { NavLink } from "react-router-dom";
import Navigation from "../components/Navigation";

const NotFound = () => {
	return (
		<div>
			<Navigation />
			<div id="notFound">
				<span className="eyebrow">Erreur 404</span>
				<h1>Aucune démonstration ne mène ici</h1>
				<p>Cette page n'existe pas.</p>
				
				<NavLink to="/" className="backHome">Retour à l'accueil</NavLink>
			</div>
		</div>
	);
};

export default NotFound;