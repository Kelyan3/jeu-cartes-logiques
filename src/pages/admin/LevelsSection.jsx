import { useState } from "react";


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

export default LevelsSection;