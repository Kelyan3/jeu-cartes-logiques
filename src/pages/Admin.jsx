import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";

import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";

import { SECTIONS } from "./admin/constants";
import ChaptersSection from "./admin/ChaptersSection";
import LevelsSection from "./admin/LevelsSection";
import ScoringSection from "./admin/ScoringSection";
import QuestsSection from "./admin/QuestsSection";
import CategoriesSection from "./admin/CategoriesSection";
import FeedbackSection from "./admin/FeedbackSection";


const Admin = () => {
	const { user, loading } = useAuth();

	const [chapters, setChapters] = useState([]);
	const [quests, setQuests] = useState([]);
	const [categories, setCategories] = useState([]);
	const [feedback, setFeedback] = useState([]);
	const [unassignedLevels, setUnassignedLevels] = useState([]);
	const [globalScoring, setGlobalScoring] = useState(null);
	const [error, setError] = useState("");
	const [activeSection, setActiveSection] = useState("chapters");

	const isAdmin = !loading && user?.role === "admin";

	/**
	 * Recharge toutes les données admin depuis le backend. Appelée au montage
	 * puis après chaque création/modification/suppression, pour rester simple
	 * (pas de mise à jour optimiste : une donnée admin change rarement).
	 */
	const reload = () => {
		fetch(`${API}/api/chapters`, { credentials: "include" }).then((r) => r.json()).then(setChapters);
		fetch(`${API}/api/admin/quests`, { credentials: "include" }).then((r) => r.json()).then(setQuests);
		fetch(`${API}/api/categories`).then((r) => r.json()).then(setCategories);
		fetch(`${API}/api/admin/feedback`, { credentials: "include" }).then((r) => r.json()).then(setFeedback);
		fetch(`${API}/api/admin/levels/unassigned`, { credentials: "include" }).then((r) => r.json()).then(setUnassignedLevels);
		fetch(`${API}/api/admin/scoring`, { credentials: "include" }).then((r) => r.json()).then(setGlobalScoring);
	};

	useEffect(() => {
		if (isAdmin)
			reload();
	}, [isAdmin]);

	/**
	 * Wrapper commun à tous les appels d'écriture admin : envoie la requête,
	 * affiche l'erreur renvoyée par le backend le cas échéant, sinon recharge
	 * les données.
	 */
	const call = (url, method, body) => {
		setError("");
		fetch(`${API}${url}`, {
			method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: body ? JSON.stringify(body) : undefined,
		})
			.then(async (response) => {
				const data = await response.json().catch(() => ({}));
				if (!response.ok)
					setError(data.error || "Une erreur est survenue");
				else
					reload();
			})
			.catch(() => setError("Impossible de contacter le serveur"));
	};

	if (loading)
		return (
			<div className="home">
				<Navigation />
			</div>
		);

	if (!isAdmin)
		return (
			<div className="home">
				<Navigation />
				<div className="profileCard">
					<h2>Accès refusé</h2>
					<p>Cette page est réservée aux comptes administrateur.</p>
				</div>
			</div>
		);

	return (
		<div className="home">
			<Navigation />
			<div className="adminPage">
				<h1>Administration</h1>
				{error && <p className="adminError">{error}</p>}

				<div className="adminLayout">
					<aside className="adminSidebar">
						<div className="adminSidebarGroup">
							<h3>Contenu du jeu</h3>
							<button className={activeSection === "chapters" ? "active" : ""} onClick={() => setActiveSection("chapters")}>Chapitres</button>
							<button className={activeSection === "levels" ? "active" : ""} onClick={() => setActiveSection("levels")}>Niveaux</button>
							<button className={activeSection === "quests" ? "active" : ""} onClick={() => setActiveSection("quests")}>Quêtes</button>
						</div>
						
						<div className="adminSidebarGroup">
							<h3>Configuration</h3>
							<button className={activeSection === "scoring" ? "active" : ""} onClick={() => setActiveSection("scoring")}>Gestion du score</button>
							<button className={activeSection === "categories" ? "active" : ""} onClick={() => setActiveSection("categories")}>Catégories</button>
						</div>

						<div className="adminSidebarGroup">
							<h3>Communauté</h3>
							<button className={activeSection === "feedback" ? "active" : ""} onClick={() => setActiveSection("feedback")}>Avis reçus</button>
						</div>
					</aside>

					<main className="adminMain">
						{activeSection === "chapters" && (
							<ChaptersSection chapters={chapters} call={call} />
						)}
						{activeSection === "levels" && (
							<LevelsSection chapters={chapters} unassignedLevels={unassignedLevels} call={call} />
						)}
						{activeSection === "scoring" && (
							<ScoringSection globalScoring={globalScoring} call={call} />
						)}
						{activeSection === "quests" && (
							<QuestsSection quests={quests} chapters={chapters} call={call} />
						)}
						{activeSection === "categories" && (
							<CategoriesSection categories={categories} call={call} />
						)}
						{activeSection === "feedback" && (
							<FeedbackSection feedback={feedback} call={call} />
						)}
					</main>
				</div>
			</div>
		</div>
	);
};

export default Admin;