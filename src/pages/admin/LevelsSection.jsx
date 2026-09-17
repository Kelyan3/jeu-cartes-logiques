import { useState } from "react";
import { GripVertical, Trash2, Link as LinkIcon, Component } from "lucide-react";
import { ConfirmModal } from "../../components/Modals";


/**
 * Section "Niveaux" : rattache un numéro de niveau non assigné (déjà présent
 * dans public/json/exos_feuilles/, cf. manifest.json) à un chapitre, ou
 * déplace/retire un niveau déjà assigné.
 */
const LevelsSection = ({ chapters, unassignedLevels, call }) => {
	const [num, setNum] = useState("");
	const [idChapter, setIdChapter] = useState("");
	const [levelToRemove, setLevelToRemove] = useState(null);

	const [draggedLevel, setDraggedLevel] = useState(null);
	const [dragOverId, setDragOverId] = useState(null);
	const [optimisticLevels, setOptimisticLevels] = useState(null);

	const getLevelsForChapter = (chapter) => {
		if (optimisticLevels && optimisticLevels.forChapters === chapters && optimisticLevels.map[chapter.id_chapter])
			return optimisticLevels.map[chapter.id_chapter];
		return chapter.levels;
	};

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

		setOptimisticLevels((prev) => {
			const currentMap = (prev && prev.forChapters === chapters) ? prev.map : {};
			return {
				forChapters: chapters,
				map: { ...currentMap, [id_chapter]: reordered }
			};
		});

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
		<section className="admin-section">
			<h2>Niveaux du mode "Jouer"</h2>
			<p className="admin-section-desc">
				Un niveau doit d'abord être créé dans l'Éditeur de Niveaux. Une fois créé, il apparaîtra dans la liste des niveaux non assignés. Vous pourrez alors le rattacher à l'un des chapitres ci-dessous.
			</p>

			{chapters.length > 0 ? (
				<div className="admin-filter-bar" style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
					<label htmlFor="chapter-select" style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)" }}>
						Gérer les niveaux du chapitre :
					</label>
					<select
						id="chapter-select"
						value={selectedChapterId}
						onChange={(e) => setSelectedChapterIdState(Number(e.target.value))}
						style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "14px" }}
					>
						{chapters.map(c => (
							<option key={c.id_chapter} value={c.id_chapter}>{c.name}</option>
						))}
					</select>
				</div>
			) : (
				<div className="admin-list-item" style={{ justifyContent: "center", color: "var(--text-muted)", padding: "24px" }}>
					Vous devez d'abord créer un chapitre pour y assigner des niveaux.
				</div>
			)}

			{selectedChapter && (() => {
				const chapter = selectedChapter;
				const levels = getLevelsForChapter(chapter);

				return (
					<div key={chapter.id_chapter} className="admin-subgroup">
						<div className="admin-list">
							{levels.length === 0 && (
								<div className="admin-list-item" style={{ justifyContent: "center", color: "var(--text-muted)", padding: "24px" }}>
									Aucun niveau n'est actuellement rattaché à ce chapitre.
								</div>
							)}
							{levels.map((level) => (
								<div
									key={level.id_level}
									draggable
									onDragStart={handleDragStart(level, chapter.id_chapter)}
									onDragOver={handleDragOver(level, chapter.id_chapter)}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop(level, chapter.id_chapter, levels)}
									onDragEnd={handleDragEnd}
									className={`admin-list-item ${draggedLevel?.id_level === level.id_level ? "dragging " : ""} ${dragOverId === level.id_level ? "drag-over" : ""}`}
								>
									<div className="admin-list-item-content">
										<div className="admin-list-item-drag" title="Glisser pour réordonner">
											<GripVertical size={16} />
										</div>
										<Component size={16} style={{ color: "var(--accent-cyan)" }} />
										<div className="admin-list-item-title">
											Niveau {level.num}
										</div>
									</div>
									<div className="admin-list-item-actions">
										<button className="action-button action-delete" title="Détacher du chapitre" onClick={() => setLevelToRemove(level)}>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				);
			})()}

			<div className="admin-create-panel">
				<h3>Ajouter un niveau au chapitre</h3>

				<form className="admin-form" onSubmit={submit}>
					<select value={num} onChange={(e) => setNum(e.target.value)} required title="Choisir un niveau orphelin">
						<option value="" disabled>Sélectionner un niveau non assigné...</option>
						{unassignedLevels.map((n) => (
							<option key={n} value={n}>Niveau {n}</option>
						))}
					</select>

					<span style={{ color: "var(--text-muted)", fontSize: "14px" }}>dans le chapitre</span>

					<select value={idChapter} onChange={(e) => setIdChapter(e.target.value)} required title="Choisir le chapitre de destination">
						<option value="" disabled>Sélectionner un chapitre...</option>
						{chapters.map((chapter) => (
							<option key={chapter.id_chapter} value={chapter.id_chapter}>{chapter.name}</option>
						))}
					</select>

					<button type="submit" className="button-primary" disabled={unassignedLevels.length === 0}>
						<LinkIcon size={16} /> Rattacher
					</button>
				</form>

				{unassignedLevels.length === 0 && (
					<p style={{ marginTop: "8px", fontSize: "13px", color: "var(--accent-orange)" }}>
						Tous les niveaux existants sont déjà assignés. Allez dans l'Éditeur de niveaux pour en créer de nouveaux.
					</p>
				)}
			</div>

			<ConfirmModal
				isOpen={levelToRemove !== null}
				variant="warning"
				title="Détacher le niveau"
				message={
					levelToRemove ? (
						<>
							Voulez-vous retirer le <strong>Niveau {levelToRemove.num}</strong> de ce chapitre ? 
							Il ne sera pas supprimé, mais il retournera dans la liste des niveaux "non assignés".
						</>
					) : ""
				}
				confirmLabel="Détacher"
				cancelLabel="Annuler"
				onConfirm={() => {
					if (levelToRemove) {
						call(`/api/admin/levels/${levelToRemove.id_level}`, "DELETE");
						setLevelToRemove(null);
					}
				}}
				onCancel={() => setLevelToRemove(null)}
			/>
		</section>
	);
};

export default LevelsSection;