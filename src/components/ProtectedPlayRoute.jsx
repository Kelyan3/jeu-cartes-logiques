import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navigation from "./Navigation";
import { AuthRequiredModal } from "./Modals";


/**
 * Protège l'accès aux pages de jeu (Niveaux, Tutoriels, Exercice, Création).
 * Si l'utilisateur n'est pas connecté, la modal explicative s'ouvre et
 * l'exercice/liste n'est pas rendu.
 */
const ProtectedPlayRoute = ({ children }) => {
	const { user, loading } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();

	if (loading)
	{
		return (
			<div className="home">
				<Navigation />
				<p className="choiceMessage">Vérification de la session...</p>
			</div>
		);
	}

	if (!user)
	{
		const currentUrl = location.pathname + location.search;

		return (
			<div className="home">
				<Navigation />
				<div className="choice">
					<p className="choiceMessage">Vous devez être connecté à un compte pour accéder aux niveaux.</p>
				</div>
				<AuthRequiredModal
					isOpen={true}
					onLogin={() => navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`)}
					onRegister={() => navigate(`/register?redirect=${encodeURIComponent(currentUrl)}`)}
					onCancel={() => navigate("/")}
				/>
			</div>
		);
	}

	return children;
};

export default ProtectedPlayRoute;
