/**
 * Découpe la chaîne reçue en segments texte / math et affiche chaque segment avec le bon rendu
 */
const Latex = ({ children }) => {
	return <span className="math-text">{children}</span>;
};

export default Latex;