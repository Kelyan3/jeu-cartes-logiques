import Navigation from "../components/Navigation";
import PopupForms from "../components/PopupForms";

const Home = () => {
	return (
		<div className="home">
			<Navigation />
			<div id="regles">
				<h1>Les règles du jeu</h1>

				<h2>Présentation du jeu</h2>
				<ul>
					<li>Le <strong>Jeu des Cartes Logiques</strong> est un jeu à un seul joueur.</li>
					<li>Le joueur manipule des <strong>cartes.</strong></li>
					<li>
						Chaque <strong>carte</strong> dispose
						<ul>
							<li>d'un <strong>pouvour d'utilisation</strong>,</li>
							<li>d'une <strong>méthode d'acquisition</strong>.</li>
						</ul>
					</li>
					<li>
						Les cartes sont disposées dans trois{" "} <strong>zones de jeu</strong> :
						<ul>
							<li><strong>La Banque</strong> contient toutes les cartes,</li>
							<li><strong>La LPU</strong> contient les cartes utilisables par le joueur,</li>
							<li><strong>La Zone d'Objectifs</strong> contient l'objectif de la partie (l'objectif principal et les objectifs secondaires).</li>
						</ul>
					</li>
				</ul>

				<h2>La Banque</h2>
				<ul>
					<li>La <strong>banque</strong> est une zone de jeu qui contient, à tout instant, toutes les cartes possibles du jeu en un nombre illimité d'exemplaires, elle n'est pas représentée durant la partie.</li>
					<li>
						Le joueur peut intéragir avec la banque de deux façons :
						<ul>
							<li><strong>Obtenir</strong> une carte (la rajouter dans la LPU),</li>
							<li><strong>Emprunter</strong> une carte (la rajouter temporairement à la LPU avec l'obligation de la rendre plus tard dans la partie).</li>
						</ul>
					</li>
				</ul>

				<h2>La LPU</h2>
				<ul>
					<li>La <strong>LPU</strong> est la liste des cartes que le joueur possède à un moment donné dans la prtie, c'est-à-dire les cartes dont il peut activer le{" "} <strong>pouvoir d'utilisation</strong>.</li>
					<li>Le joueur peut représenter à la banque une ou plusieurs cartes de la LPU afin d'<strong>obtenir</strong>{" "} (c'est-à-dire rajouter à la LPU) une ou plusieurs nouvelles cartes.</li>
					<li>Lorsqu'une carte est dans la LPU, la LPU contient autant de copies de cette carte que l'on souhaite.</li>
					<li>Lorsque le joueur obtient une carte, si cette carte était déjà dans la LPU, il ne se passe rien.</li>
				</ul>

				<h2>La Zone d'Objectifs</h2>
				<ul>
					<li>La <strong>Zone d'Objectifs</strong> est la liste des cartes qui doivent apparaître dans la LPU pour que la partie s'arrête (victorieusement).</li>
					<li>Lorsqu'une carte est dans la Zone d'Objectifs, il est recommandé de mettre en oeuvre sa{" "} <strong>méthode d'acquisition</strong>.</li>
					<li>À tout moment de la partie, le joueur peut décider d'ajouter{" "} <strong>n'importe quelle carte</strong> de la banque pour la placer dans la Zone d'Objectifs (objectif intermédiaire).</li>
				</ul>

				<h2>Les types de cartes</h2>
				<ul>
					<li>La <strong>carte blanche</strong> : la présenter permet d'obtenir n'importe quelle carte de la banque.</li>
					<li>Les <strong>cartes monochromes</strong> (rouge, jaune, bleue, marron, etc.) qui n'ont pas de pouvoir spécifique.</li>
					<li>
						Les <strong>cartes avec un connecteur</strong> : cartes en deux parties séparées par un rectangle gris qui contient un symbole dont le pouvoir dépend du{" "} <strong>connecteur</strong> et des cartes connectées :
						<ul>
							<li>Le <strong>connecteur « et »</strong> dont le symbole est <strong>∧</strong>.</li>
							<li>Le <strong>connecteur « ou »</strong> dont le symbole est <strong>∨</strong>.</li>
							<li>Le <strong>connecteur « implique »</strong> dont le symbole est <strong>⟹</strong>.</li>
							<li>Le <strong>connecteur « équivaut à »</strong> dont le symbole est <strong>⟺</strong>.</li>
							<li>Le <strong>connecteur « négation »</strong> dont le symbole est{" "} <strong>¬</strong>. Comme il est unaire, il n'est connecté qu'à une seule carte.</li>
						</ul>
					</li>
				</ul>

				<h2>Pouvoir d'utilisation des connecteurs</h2>
				<ul>
					<li>En présentant à la banque une carte avec le connecteur <strong>∧</strong>, on peut obtenir chacune des <strong>deux cartes</strong> connectées.</li>
					<li>En présentant à la banque une carte avec le connecteur <strong>⟹</strong> et{" "} <strong>la carte d'où vient la flèche</strong>, on peut obtenir{" "} <strong>la carte d'où va la flèche</strong>.</li>
					<li>En présentant à la banque une carte avec le connecteur <strong>⟺</strong> et{" "} <strong>une des deux cartes connectées</strong>, on peut obtenir{" "} <strong>l'autre carte</strong> connectée.</li>
				</ul>
			</div>

			<PopupForms />
		</div>
	);
};

export default Home;