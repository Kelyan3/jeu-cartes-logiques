import { useState } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";


/**
 * Section "Chapitres" : création, renommage/repositionnement, suppression.
 */
const ChaptersSection = ({ chapters, call }) => {
	const [name, setName] = useState("");
	const [chapterToDelete, setChapterToDelete] = useState(null);

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

	// Efface l'override local dès que les chapitres serveur changent.
	const [prevChapters, setPrevChapters] = useState(chapters);
	if (prevChapters !== chapters)
	{
		setPrevChapters(chapters);
		setLocalOrder(null);
	}

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
							<td className="dragHandle" title="Glisser pour réordonner"><GripVertical size={16} /></td>
							<td>
								<input
									defaultValue={chapter.name}
									onBlur={(event) => {
										if (event.target.value !== chapter.name)
											call(`/api/admin/chapters/${chapter.id_chapter}`, "PUT", { name: event.target.value });
									}}
								/>
							</td>
							<td>{chapter.levels.length}</td>
							<td>
								<button
									className="actionButton actionDelete"
									title="Supprimer"
									onClick={() => setChapterToDelete(chapter)}
								>
									<Trash2 size={16} />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="adminCreatePanel">
				<h3>Ajouter un chapitre</h3>
				<form className="adminForm" onSubmit={submit}>
					<input placeholder="Nom du chapitre" value={name} onChange={(e) => setName(e.target.value)} required />
					<button type="submit" className="buttonPrimary">
						<Plus size={16} /> Créer
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
							Voulez-vous vraiment supprimer le chapitre <strong>"{chapterToDelete.name}"</strong> et ses <strong>{chapterToDelete.levels.length} niveau(x)</strong> associés ?
						</>
					) : ""
				}
				confirmLabel="Supprimer"
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