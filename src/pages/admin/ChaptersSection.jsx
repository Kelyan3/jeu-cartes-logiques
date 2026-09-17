import { useState } from "react";
import { GripVertical, Trash2, Plus, BookText } from "lucide-react";
import { ConfirmModal } from "../../components/Modals";


/**
 * Section "Chapitres" : création, renommage/repositionnement, suppression.
 */
const ChaptersSection = ({ chapters, call }) => {
	const [name, setName] = useState("");
	const [chapterToDelete, setChapterToDelete] = useState(null);

	const [draggedChapter, setDraggedChapter] = useState(null);
	const [dragOverId, setDragOverId] = useState(null);
	const [optimisticOrder, setOptimisticOrder] = useState(null);

	const orderedChapters =
		optimisticOrder && optimisticOrder.forChapters === chapters
			? optimisticOrder.list
			: chapters;

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
		setOptimisticOrder({ forChapters: chapters, list: reordered });

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
		<section className="admin-section">
			<h2>Chapitres</h2>
			<p className="admin-section-desc">
				Les chapitres structurent la progression des élèves dans le mode "Jouer".
				Vous pouvez glisser-déposer un chapitre pour en modifier l'ordre. Les niveaux qu'il contient suivront automatiquement.
			</p>

			<div className="admin-list">
				{orderedChapters.length === 0 && (
					<div className="admin-list-item" style={{ justifyContent: "center", color: "var(--text-muted)", padding: "24px" }}>
						Aucun chapitre créé.
					</div>
				)}
				{orderedChapters.map((chapter) => (
					<div
						key={chapter.id_chapter}
						draggable
						onDragStart={handleDragStart(chapter)}
						onDragOver={handleDragOver(chapter)}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop(chapter)}
						onDragEnd={handleDragEnd}
						className={`admin-list-item ${draggedChapter?.id_chapter === chapter.id_chapter ? "dragging " : ""} ${dragOverId === chapter.id_chapter ? "drag-over" : ""}`}
					>
						<div className="admin-list-item-content">
							<div className="admin-list-item-drag" title="Glisser pour réordonner">
								<GripVertical size={16} />
							</div>
							<BookText size={16} style={{ color: "var(--accent-purple)" }} />
							
							<div className="admin-list-item-title">
								<input
									defaultValue={chapter.name}
									title="Renommer le chapitre"
									onBlur={(event) => {
										if (event.target.value !== chapter.name && event.target.value.trim() !== "")
											call(`/api/admin/chapters/${chapter.id_chapter}`, "PUT", { name: event.target.value.trim() });
									}}
								/>
							</div>
							
							<div className="admin-list-item-meta">
								<span>{chapter.levels.length} niveau(x) rattaché(s)</span>
							</div>
						</div>
						<div className="admin-list-item-actions">
							<button
								className="action-button action-delete"
								title="Supprimer le chapitre"
								onClick={() => setChapterToDelete(chapter)}
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				))}
			</div>

			<div className="admin-create-panel">
				<h3>Nouveau chapitre</h3>
				<form className="admin-form" onSubmit={submit}>
					<input placeholder="Ex: Découverte de la Négation" value={name} onChange={(e) => setName(e.target.value)} required />
					<button type="submit" className="button-primary">
						<Plus size={16} /> Créer le chapitre
					</button>
				</form>
			</div>

			<ConfirmModal
				isOpen={chapterToDelete !== null}
				variant="danger"
				title="Supprimer le chapitre"
				message={
					chapterToDelete ? (
						<>
							Voulez-vous vraiment supprimer le chapitre <strong>"{chapterToDelete.name}"</strong> et ses <strong>{chapterToDelete.levels.length} niveau(x)</strong> associés ? Les progrès des élèves sur ces niveaux seront perdus.
						</>
					) : ""
				}
				confirmLabel="Supprimer définitivement"
				cancelLabel="Annuler"
				onConfirm={() => {
					if (chapterToDelete) {
						call(`/api/admin/chapters/${chapterToDelete.id_chapter}`, "DELETE");
						setChapterToDelete(null);
					}
				}}
				onCancel={() => setChapterToDelete(null)}
			/>
		</section>
	);
};

export default ChaptersSection;