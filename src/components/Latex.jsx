/**
 * Affiche le texte reçu avec le style typographique utilisé pour la notation logique
 */
const Latex = ({ children }) => {
	return <span className="math-text">{children}</span>;
};

export default Latex;