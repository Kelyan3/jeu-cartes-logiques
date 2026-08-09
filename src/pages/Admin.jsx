import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";

import { useAuth } from "../hooks/authHooks";
import { API_BASE_URL as API } from "../config/api";

const MENUS = ["base", "objectif", "transitivite", "tiers_exclus"];

const SECTIONS = [
	{ id: "chapters", label: "Chapitres" },
	{ id: "levels", label: "Niveaux" },
	{ id: "quests", label: "Quêtes" },
	{ id: "categories", label: "Catégories" },
];


const Admin = () => {
	const { user, loading } = useAuth();

	const [chapters, setChapters] = useState([]);
	const [quests, setQuests] = useState([]);
	const [categories, setCategories] = useState([]);
	const [unassignedLevels, setUnassignedLevels] = useState([]);
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
		fetch(`${API}/api/admin/levels/unassigned`, { credentials: "include" }).then((r) => r.json()).then(setUnassignedLevels);
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

				<div className="adminSectionSelect">
					<label htmlFor="admin-section">Section</label>
					<select
						id="admin-section"
						value={activeSection}
						onChange={(e) => setActiveSection(e.target.value)}
					>
						{SECTIONS.map((s) => (
							<option key={s.id} value={s.id}>{s.label}</option>
						))}
					</select>
				</div>

				{activeSection === "chapters" && (
					<ChaptersSection chapters={chapters} call={call} />
				)}
				{activeSection === "levels" && (
					<LevelsSection chapters={chapters} unassignedLevels={unassignedLevels} call={call} />
				)}
				{activeSection === "quests" && (
					<QuestsSection quests={quests} chapters={chapters} call={call} />
				)}
				{activeSection === "categories" && (
					<CategoriesSection categories={categories} call={call} />
				)}
			</div>
		</div>
	);
};

/**
 * Section "Chapitres" : création, renommage/repositionnement, suppression.
 */
const ChaptersSection = ({ chapters, call }) => {
	const [name, setName] = useState("");

	/**
	 * Chapitre actuellement glissé : { id_chapter }
	 */
	const [draggedChapter, setDraggedChapter] = useState(null);

	/**
	 * id_chapter du chapitre actuellement survolé (indication visuelle).
	 */
	const [dragOverId, setDragOverId] = useState(null);

	/**
	 * Réordonnancement local optimiste : appliqué immédiatement au dépôt, avant même la réponse du serveur.
	 */
	const [localOrder, setLocalOrder] = useState(null);

	useEffect(() => {
		setLocalOrder(null);
	}, [chapters]);

	const orderedChapters = localOrder ?? chapters;

	const submit = (event) => {
		event.preventDefault();
		call("/api/admin/chapters", "POST", { name });
		setName("");
	};

	const handleDragStart = (chapter) => (event) => {
		setDraggedChapter({ id_chapter: chapter.id_chapter });
		event.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (chapter) => (event) => {
		if (!draggedChapter)
			return;

		event.preventDefault();
		setDragOverId(chapter.id_chapter);
	};

	const handleDragLeave = () => {
		setDragOverId(null);
	};

	const handleDrop = (targetChapter) => (event) => {
		event.preventDefault();
		setDragOverId(null);

		if (!draggedChapter || draggedChapter.id_chapter === targetChapter.id_chapter)
		{
			setDraggedChapter(null);
			return;
		}

		const draggedFull = orderedChapters.find((c) => c.id_chapter === draggedChapter.id_chapter);
		const reordered = orderedChapters.filter((c) => c.id_chapter !== draggedChapter.id_chapter);
		const targetIndex = reordered.findIndex((c) => c.id_chapter === targetChapter.id_chapter);
		reordered.splice(targetIndex, 0, draggedFull);

		setLocalOrder(reordered);

		const hasChanged = reordered.some((chapter, index) => chapter.position !== index + 1);
		if (hasChanged)
		{
			call("/api/admin/chapters/reorder", "PUT", {
				ordered_ids: reordered.map((chapter) => chapter.id_chapter),
			});
		}

		setDraggedChapter(null);
	};

	const handleDragEnd = () => {
		setDraggedChapter(null);
		setDragOverId(null);
	};

	return (
		<section className="adminSection">
			<h2>Chapitres</h2>
			<p className="adminHint">
				Glissez une ligne pour changer l'ordre des chapitres. Les nouveaux chapitres sont ajoutés à la fin de la liste.
			</p>
			<table className="adminTable">
				<thead>
					<tr>
						<th></th>
						<th>Nom</th>
						<th>Position</th>
						<th>Niveaux</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{orderedChapters.map((chapter) => (
						<tr
							key={chapter.id_chapter}
							draggable
							onDragStart={handleDragStart(chapter)}
							onDragOver={handleDragOver(chapter)}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop(chapter)}
							onDragEnd={handleDragEnd}
							className={
								(draggedChapter?.id_chapter === chapter.id_chapter ? "dragging " : "") +
								(dragOverId === chapter.id_chapter ? "dragOver" : "")
							}
						>
							<td className="dragHandle" title="Glisser pour réordonner">⠿</td>
							<td>
								<input
									defaultValue={chapter.name}
									onBlur={(event) => {
										if (event.target.value !== chapter.name)
											call(`/api/admin/chapters/${chapter.id_chapter}`, "PUT", { name: event.target.value });
									}}
								/>
							</td>
							<td>{chapter.position}</td>
							<td>{chapter.levels.length}</td>
							<td>
								<button
									className="resetButton"
									onClick={() => {
										if (window.confirm(`Supprimer "${chapter.name}" et ses ${chapter.levels.length} niveau(x) ?`))
											call(`/api/admin/chapters/${chapter.id_chapter}`, "DELETE");
									}}
								>
									Supprimer
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<form className="adminForm" onSubmit={submit}>
				<input placeholder="Nom du chapitre" value={name} onChange={(e) => setName(e.target.value)} required />
				<button type="submit" className="resetButton">+ Chapitre</button>
			</form>
		</section>
	);
};

/**
 * Section "Niveaux" : rattache un numéro de niveau non assigné (déjà présent
 * dans public/json/exos_feuilles/, cf. manifest.json) à un chapitre, ou
 * déplace/retire un niveau déjà assigné.
 */
const LevelsSection = ({ chapters, unassignedLevels, call }) => {
	const [num, setNum] = useState("");
	const [idChapter, setIdChapter] = useState("");

	/**
	 * Niveau actuellement glissé : { id_level, id_chapter }.
	 */
	const [draggedLevel, setDraggedLevel] = useState(null);

	/**
	 * id_level du niveau actuellement survolé, pour l'indication visuelle.
	 */
	const [dragOverId, setDragOverId] = useState(null);

	/**
	 * Réordonnancement local optimiste : appliqué immédiatement au dépôt,
	 * avant même la réponse du serveur, pour un affichage instantané.
	 */
	const [localOrder, setLocalOrder] = useState({});

	useEffect(() => {
		setLocalOrder({});
	}, [chapters]);

	const submit = (event) => {
		event.preventDefault();
		const chapter = chapters.find((c) => c.id_chapter === Number(idChapter));
		const newPosition = (chapter?.levels.length ?? 0) + 1;

		call("/api/admin/levels", "POST", {
			num: Number(num),
			id_chapter: Number(idChapter),
			position: newPosition,
		});
		setNum("");
		setIdChapter("");
	};

	const handleDragStart = (level, id_chapter) => (event) => {
		setDraggedLevel({ id_level: level.id_level, id_chapter });
		event.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (level, id_chapter) => (event) => {
		if (!draggedLevel || draggedLevel.id_chapter !== id_chapter)
			return;

		event.preventDefault();
		setDragOverId(level.id_level);
	};

	const handleDragLeave = () => {
		setDragOverId(null);
	};

	const handleDrop = (targetLevel, id_chapter, levelsInChapter) => (event) => {
		event.preventDefault();
		setDragOverId(null);

		if (!draggedLevel || draggedLevel.id_chapter !== id_chapter || draggedLevel.id_level === targetLevel.id_level)
		{
			setDraggedLevel(null);
			return;
		}

		const draggedFull = levelsInChapter.find((l) => l.id_level === draggedLevel.id_level);
		const reordered = levelsInChapter.filter((l) => l.id_level !== draggedLevel.id_level);
		const targetIndex = reordered.findIndex((l) => l.id_level === targetLevel.id_level);
		reordered.splice(targetIndex, 0, draggedFull);

		setLocalOrder((prev) => ({ ...prev, [id_chapter]: reordered }));

		const hasChanged = reordered.some((level, index) => level.position !== index + 1);
		if (hasChanged)
		{
			call("/api/admin/levels/reorder", "PUT", {
				id_chapter,
				ordered_ids: reordered.map((level) => level.id_level),
			});
		}

		setDraggedLevel(null);
	};

	const handleDragEnd = () => {
		setDraggedLevel(null);
		setDragOverId(null);
	};

	return (
		<section className="adminSection">
			<h2>Niveaux</h2>
			<p className="adminHint">
				Un niveau doit déjà exister comme fichier <code>exN.json</code> (créé via "Créer un niveau",
				déposé dans <code>public/json/exos_feuilles/</code>) avant de pouvoir être rattaché ici à un chapitre.
				Glissez une ligne pour changer sa position dans le chapitre.
			</p>

			{chapters.map((chapter) => {
				const levels = localOrder[chapter.id_chapter] ?? chapter.levels;

				return (
					<div key={chapter.id_chapter} className="adminSubgroup">
						<h3>{chapter.name}</h3>
						<table className="adminTable">
							<thead>
								<tr><th></th><th>Niveau</th><th></th></tr>
							</thead>
							<tbody>
								{levels.map((level) => (
									<tr
										key={level.id_level}
										draggable
										onDragStart={handleDragStart(level, chapter.id_chapter)}
										onDragOver={handleDragOver(level, chapter.id_chapter)}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop(level, chapter.id_chapter, levels)}
										onDragEnd={handleDragEnd}
										className={
											(draggedLevel?.id_level === level.id_level ? "dragging " : "") +
											(dragOverId === level.id_level ? "dragOver" : "")
										}
									>
										<td className="dragHandle" title="Glisser pour réordonner">⠿</td>
										<td>Niveau {level.num}</td>
										<td>
											<button className="resetButton" onClick={() => call(`/api/admin/levels/${level.id_level}`, "DELETE")}>
												Retirer
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				);
			})}

			<form className="adminForm" onSubmit={submit}>
				<select value={num} onChange={(e) => setNum(e.target.value)} required>
					<option value="" disabled>Niveau non assigné...</option>
					{unassignedLevels.map((n) => (
						<option key={n} value={n}>Niveau {n}</option>
					))}
				</select>
				<select value={idChapter} onChange={(e) => setIdChapter(e.target.value)} required>
					<option value="" disabled>Chapitre...</option>
					{chapters.map((chapter) => (
						<option key={chapter.id_chapter} value={chapter.id_chapter}>{chapter.name}</option>
					))}
				</select>
				<button type="submit" className="resetButton" disabled={unassignedLevels.length === 0}>
					+ Rattacher (en fin de chapitre)
				</button>
			</form>
		</section>
	);
};

/**
 * Section "Quêtes" : crée/édite/supprime les quêtes qui débloquent les
 * boutons d'action (unlocks_key) une fois un chapitre terminé.
 */
const QuestsSection = ({ quests, chapters, call }) => {
	const [menu, setMenu] = useState(MENUS[0]);
	const [label, setLabel] = useState("");
	const [unlocksKey, setUnlocksKey] = useState("");
	const [requiredChapter, setRequiredChapter] = useState("");
	const [position, setPosition] = useState("");

	const submit = (event) => {
		event.preventDefault();
		call("/api/admin/quests", "POST", {
			menu,
			label,
			unlocks_key: unlocksKey,
			required_chapter: requiredChapter === "" ? null : Number(requiredChapter),
			position: Number(position),
		});
		setLabel("");
		setUnlocksKey("");
		setRequiredChapter("");
		setPosition("");
	};

	return (
		<section className="adminSection">
			<h2>Quêtes</h2>
			<p className="adminHint">
				Une quête sans chapitre requis est débloquée pour tout le monde par défaut (c'est le cas du menu "base").
			</p>
			<table className="adminTable">
				<thead>
					<tr><th>Menu</th><th>Label</th><th>Clé bouton</th><th>Chapitre requis</th><th></th></tr>
				</thead>
				<tbody>
					{quests.map((quest) => (
						<tr key={quest.id_quest}>
							<td>{quest.menu}</td>
							<td>
								<input
									defaultValue={quest.label}
									onBlur={(event) => {
										if (event.target.value !== quest.label)
											call(`/api/admin/quests/${quest.id_quest}`, "PUT", { label: event.target.value });
									}}
								/>
							</td>
							<td><code>{quest.unlocks_key}</code></td>
							<td>
								<select
									defaultValue={quest.required_chapter ?? ""}
									onChange={(event) => {
										const value = event.target.value;
										call(`/api/admin/quests/${quest.id_quest}`, "PUT", {
											required_chapter: value === "" ? null : Number(value),
										});
									}}
								>
									<option value="">Toujours débloquée</option>
									{chapters.map((chapter) => (
										<option key={chapter.id_chapter} value={chapter.id_chapter}>{chapter.name}</option>
									))}
								</select>
							</td>
							<td>
								<button className="resetButton" onClick={() => call(`/api/admin/quests/${quest.id_quest}`, "DELETE")}>
									Supprimer
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<form className="adminForm" onSubmit={submit}>
				<select value={menu} onChange={(e) => setMenu(e.target.value)}>
					{MENUS.map((m) => <option key={m} value={m}>{m}</option>)}
				</select>
				<input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
				<input placeholder="Clé bouton (ex: addGoal_objectif)" value={unlocksKey} onChange={(e) => setUnlocksKey(e.target.value)} required />
				<select value={requiredChapter} onChange={(e) => setRequiredChapter(e.target.value)}>
					<option value="">Toujours débloquée</option>
					{chapters.map((chapter) => (
						<option key={chapter.id_chapter} value={chapter.id_chapter}>{chapter.name}</option>
					))}
				</select>
				<input type="number" placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} required />
				<button type="submit" className="resetButton">+ Quête</button>
			</form>
		</section>
	);
};

/**
 * Section "Catégories" : Professeur / Étudiant L1 / etc. utilisées pour
 * filtrer le classement et affichées sur le profil utilisateur.
 */
const CategoriesSection = ({ categories, call }) => {
	const [name, setName] = useState("");

	const submit = (event) => {
		event.preventDefault();
		call("/api/admin/categories", "POST", { name });
		setName("");
	};

	return (
		<section className="adminSection">
			<h2>Catégories</h2>
			<table className="adminTable">
				<thead>
					<tr><th>Nom</th><th></th></tr>
				</thead>
				<tbody>
					{categories.map((category) => (
						<tr key={category.id_category}>
							<td>
								<input
									defaultValue={category.name}
									onBlur={(event) => {
										if (event.target.value !== category.name)
											call(`/api/admin/categories/${category.id_category}`, "PUT", { name: event.target.value });
									}}
								/>
							</td>
							<td>
								<button
									className="resetButton"
									onClick={() => {
										if (window.confirm(`Supprimer la catégorie "${category.name}" ? Les utilisateurs concernés devront en rechoisir une.`))
											call(`/api/admin/categories/${category.id_category}`, "DELETE");
									}}
								>
									Supprimer
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<form className="adminForm" onSubmit={submit}>
				<input placeholder="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} required />
				<button type="submit" className="resetButton">+ Catégorie</button>
			</form>
		</section>
	);
};

export default Admin;