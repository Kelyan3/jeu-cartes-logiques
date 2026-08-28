import { useState } from "react";
import Navigation from "../components/Navigation";
import PopupForms from "../components/PopupForms";
import Card from "../components/Card";
import { GameTabProvider } from "../context/GameTabContext";
import CardModel from "../domain/Card";


/**
 * Cartes d'exemple utilisées pour illustrer les règles, affichées via le vrai composant
 * Card (donc toujours visuellement fidèles au jeu). Voir <ExampleCard> plus bas.
 */
const cardBlanche = new CardModel(0, "white", false, "", null, null, false);
const cardRed = new CardModel(1, "red", false, "", null, null, false);
const cardBlue = new CardModel(2, "blue", false, "", null, null, false);

const cardEt = new CardModel(3, null, false, "et",
	new CardModel(0, "red", false, "", null, null, false),
	new CardModel(0, "blue", false, "", null, null, false),
	false);

const cardOu = new CardModel(4, null, false, "ou",
	new CardModel(0, "red", false, "", null, null, false),
	new CardModel(0, "blue", false, "", null, null, false),
	false);

const cardImplique = new CardModel(5, null, false, "=>",
	new CardModel(0, "red", false, "", null, null, false),
	new CardModel(0, "blue", false, "", null, null, false),
	false);

const cardEquivaut = new CardModel(6, null, false, "<=>",
	new CardModel(0, "red", false, "", null, null, false),
	new CardModel(0, "blue", false, "", null, null, false),
	false);

const cardNon = new CardModel(7, null, false, "non",
	new CardModel(0, "transparent", false, "", null, null, false),
	new CardModel(0, "red", false, "", null, null, false),
	false);

const exampleCards = [cardBlanche, cardRed, cardBlue, cardEt, cardOu, cardImplique, cardEquivaut, cardNon];
const exampleGame = [exampleCards];


/**
 * Affiche une des cartes d'exemple ci-dessus (par son indice dans exampleCards), avec
 * une légende optionnelle. Doit être utilisé à l'intérieur d'un <GameTabProvider>.
 */
const ExampleCard = ({ index, label }) => (
	<div className="exampleCard">
		<Card deckIndex={0} cardIndex={index} update={() => {}} isWin={true} affichageSimple={false} isHelp={false} />
		{label && <p className="exampleCardLabel">{label}</p>}
	</div>
);


/**
 * Schéma de circulation Banque -> LPU -> Zone d'Objectifs, avec une zone mise en évidence
 * selon l'onglet actif (ou aucune, sur l'onglet "Présentation").
 */
const FlowSchema = ({ highlight }) => (
	<div className="flowSchema">
		<div className={"flowBox" + (highlight === "banque" ? " flowBoxActive" : "")}>Banque</div>
		<div className="flowArrow"><span>obtenir / emprunter</span></div>
		<div className={"flowBox" + (highlight === "lpu" ? " flowBoxActive" : "")}>LPU</div>
		<div className="flowArrow"><span>contient l'objectif</span></div>
		<div className={"flowBox" + (highlight === "objectifs" ? " flowBoxActive" : "")}>Zone d'Objectifs</div>
	</div>
);


const TABS = [
	{ id: "presentation", label: "1. Présentation" },
	{ id: "banque", label: "2. La Banque" },
	{ id: "lpu", label: "3. La LPU" },
	{ id: "objectifs", label: "4. Zone d'Objectifs" },
	{ id: "types", label: "5. Types de cartes" },
	{ id: "connecteurs", label: "6. Connecteurs" },
	{ id: "score", label: "7. Score" },
];


const Home = () => {
	const [activeTab, setActiveTab] = useState(TABS[0].id);

	return (
		<div className="home">
			<Navigation />
			<div id="regles">
				<h1>Les règles du jeu</h1>

				<div className="rulesTabs" role="tablist">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							role="tab"
							aria-selected={activeTab === tab.id}
							className={"rulesTab" + (activeTab === tab.id ? " rulesTabActive" : "")}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>

				<GameTabProvider value={exampleGame}>
					<div className="rulesPanel">
						{activeTab === "presentation" && (
							<>
								<p className="rulesIntro">Un jeu solo où vous manipulez des cartes pour atteindre un objectif logique.</p>
								<ol>
									<li>Vous jouez seul, avec des <strong>cartes</strong> qui ont chacune un pouvoir et un moyen de les obtenir.</li>
									<li>Trois zones structurent la partie : la <strong>Banque</strong>, la <strong>LPU</strong>, la <strong>Zone d'Objectifs</strong>.</li>
									<li>Le but : faire apparaître les cartes-objectifs dans votre LPU.</li>
								</ol>
							</>
						)}

						{activeTab === "banque" && (
							<>
								<FlowSchema highlight="banque" /><br />
								<p className="rulesIntro">La Banque contient toutes les cartes du jeu, en nombre illimité.</p>
								<ol>
									<li><strong>Obtenir</strong> une carte : elle rejoint définitivement votre LPU.</li>
									<li><strong>Emprunter</strong> une carte : elle rejoint votre LPU, à rendre plus tard dans la partie.</li>
								</ol>
							</>
						)}

						{activeTab === "lpu" && (
							<>
								<FlowSchema highlight="lpu" /><br />
								<p className="rulesIntro">La LPU liste les cartes que vous possédez à un instant donné.</p>
								<ol>
									<li>Présenter une ou plusieurs cartes de la LPU permet d'en <strong>obtenir de nouvelles</strong>.</li>
									<li>Posséder une carte en plusieurs exemplaires ne change rien : une seule suffit.</li>
								</ol>
								<div className="rulesExampleRow">
									<ExampleCard index={1} label="Dans votre LPU" />
								</div>
							</>
						)}

						{activeTab === "objectifs" && (
							<>
								<FlowSchema highlight="objectifs" /><br />
								<p className="rulesIntro">La Zone d'Objectifs liste les cartes à faire apparaître dans la LPU pour gagner.</p>
								<ol>
									<li>La partie s'arrête, victorieuse, dès que la LPU contient toutes les cartes-objectifs.</li>
									<li>Vous pouvez ajouter vous-même une carte intermédiaire, pour avancer étape par étape.</li>
								</ol>
							</>
						)}

						{activeTab === "types" && (
							<>
								<p className="rulesIntro">Cinq types de cartes composent le jeu.</p>
								<ol>
									<li>La <strong>carte blanche</strong> : permet d'obtenir n'importe quelle carte.</li>
									<li>Les <strong>cartes monochromes</strong> (rouge, jaune, bleue...) : sans pouvoir spécial.</li>
									<li>
										Les <strong>cartes à connecteur</strong> : deux cartes reliées par un symbole
										(<strong className="symbol">∧</strong> <strong className="symbol">∨</strong>{" "}
										<strong className="symbol">⇒</strong> <strong className="symbol">⇔</strong>{" "}
										<strong className="symbol">¬</strong>).
									</li>
								</ol>
								<div className="rulesExampleRow">
									<ExampleCard index={0} label="Blanche" />
									<ExampleCard index={1} label="Monochrome" />
									<ExampleCard index={3} label="et ∧" />
									<ExampleCard index={4} label="ou ∨" />
									<ExampleCard index={5} label="implique ⇒" />
									<ExampleCard index={6} label="équivaut ⇔" />
									<ExampleCard index={7} label="non ¬" />
								</div>
							</>
						)}

						{activeTab === "connecteurs" && (
							<>
								<p className="rulesIntro">Présenter une carte à connecteur permet d'obtenir de nouvelles cartes.</p>
								<ol>
									<li><strong className="symbol">∧</strong> : présentez la carte, obtenez les deux cartes reliées.</li>
									<li><strong className="symbol">⇒</strong> : présentez la carte et la carte de départ de la flèche, obtenez celle d'arrivée.</li>
									<li><strong className="symbol">⇔</strong> : présentez la carte et l'une des deux cartes reliées, obtenez l'autre.</li>
								</ol>

								<div className="rulesPowerRow">
									<ExampleCard index={3} label="Présentez" />
									<span className="rulesPowerArrow">→</span>
									<ExampleCard index={1} label="Obtenez" />
									<ExampleCard index={2} label="Obtenez" />
								</div>

								<div className="rulesPowerRow">
									<ExampleCard index={5} label="Présentez" />
									<ExampleCard index={1} label="+ la carte de départ" />
									<span className="rulesPowerArrow">→</span>
									<ExampleCard index={2} label="Obtenez" />
								</div>

								<div className="rulesPowerRow">
									<ExampleCard index={6} label="Présentez" />
									<ExampleCard index={1} label="+ une des deux cartes" />
									<span className="rulesPowerArrow">→</span>
									<ExampleCard index={2} label="Obtenez l'autre" />
								</div>
							</>
						)}

						{activeTab === "score" && (
							<>
								<p className="rulesIntro">Votre score dépend du temps mis et du nombre de coups joués.</p>
								<ol>
									<li>Plus vous êtes <strong>rapide</strong> et <strong>efficace</strong> (peu de coups), plus le score est élevé.</li>
									<li>Le score n'existe qu'en <strong>mode Jeu</strong> : le mode Tutoriel n'en a pas.</li>
									<li>Il s'affiche à la fin du niveau, et reste visible sur la liste des niveaux une fois le niveau complété.</li>
								</ol>

								<div className="rulesScorePreview">
									<div className="rulesScorePreviewItem">
										<p className="scorePreviewLabel">Aperçu de la fin de niveau</p>
										<p className="scorePreviewResult">Temps : 00:51 | Score : 85</p>
									</div>
									<div className="rulesScorePreviewItem">
										<p className="scorePreviewLabel">Aperçu de la liste des niveaux</p>
										<div className="scorePreviewLevel">
											<span className="levelName">Niveau 3 ✓</span>
											<span className="levelScoreValue">00:51 | 85 pts</span>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				</GameTabProvider>
			</div>

			<PopupForms />
		</div>
	);
};

export default Home;