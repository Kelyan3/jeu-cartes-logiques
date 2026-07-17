import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * Découpe la chaîne reçue en segments texte / math (délimités par $...$ ou $$...$$)
 * et affiche chaque segment avec le bon rendu, comme le faisait <Latex> de react-latex.
 */
const Latex = ({ children }) => {
	const str = children ?? "";
	const parts = str.split(/(\${1,2}[^$]+\${1,2})/g);

	return (
		<>
			{parts.map((part, index) => {
				const strMatch = part.match(/^\${1,2}([^$]+)\${1,2}$/);
				if (strMatch)
					return <InlineMath key={index} math={strMatch[1]} />;

				return <span key={index}>{part}</span>
			})}
		</>
	);
};

export default Latex;