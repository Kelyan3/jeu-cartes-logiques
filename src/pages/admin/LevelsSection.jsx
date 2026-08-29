import { useState } from "react";
import { GripVertical, Trash2, Link as LinkIcon } from "lucide-react";


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

	// Efface l'override local dès que les chapitres serveur changent.
	const [prevChapters, setPrevChapters] = useState(chapters);
	if (prevChapters !== chapters)
	{
		setPrevChapters(chapters);
		setLocalOrder({});
	}

	const defaultChapterId = chapters.length > 0 ? chapters[0].id_chapter : "";
	const [selectedChapterIdState, setSelectedChapterIdState] = useState("");

	const selectedChapterId = selectedChapterIdState || defaultChapterId;
	const selectedChapter = chapters.find((c) => c.id_chapter === Number(selectedChapterId));

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

			{chapters.length > 0 && (
				<div className="adminFilterBar">
					<label htmlFor="chapter-select">Voir les niveaux du chapitre :</label>
					<select
						id="chapter-select"
						value={selectedChapterId}
						onChange={(e) => setSelectedChapterIdState(Number(e.target.value))}
					>
						{chapters.map(c => (
							<option key={c.id_chapter} value={c.id_chapter}>{c.name}</option>
						))}
					</select>
				</div>
			)}

			{selectedChapter && (() => {
				const chapter = selectedChapter;
				const levels = localOrder[chapter.id_chapter] ?? chapter.levels;

				return (
					<div key={chapter.id_chapter} className="adminSubgroup">
						<table className="adminTable">
							<thead>
								<tr>
									<th></th>
									<th>Niveau</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{levels.length === 0 && (
									<tr>
										<td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
											Aucun niveau rattaché à ce chapitre.
										</td>
									</tr>
								)}
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
										<td className="dragHandle" title="Glisser pour réordonner"><GripVertical size={16} /></td>
										<td>Niveau {level.num}</td>
										<td>
											<button className="actionButton actionDelete" title="Retirer" onClick={() => call(`/api/admin/levels/${level.id_level}`, "DELETE")}>
												<Trash2 size={16} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				);
			})()}

			<div className="adminCreatePanel">
				<h3>Rattacher un niveau</h3>
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
					<button type="submit" className="buttonPrimary" disabled={unassignedLevels.length === 0}>
						<LinkIcon size={16} /> Rattacher
					</button>
				</form>
			</div>
		</section>
	);
};

export default LevelsSection;