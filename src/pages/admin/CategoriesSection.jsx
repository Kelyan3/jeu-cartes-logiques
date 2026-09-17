import { useState } from "react";
import { Trash2, Plus, Tag } from "lucide-react";
import { ConfirmModal } from "../../components/Modals";


/**
 * Section "Catégories" : création, renommage, suppression.
 */
const CategoriesSection = ({ categories, call }) => {
	const [name, setName] = useState("");
	const [categoryToDelete, setCategoryToDelete] = useState(null);

	const submit = (event) => {
		event.preventDefault();
		call("/api/admin/categories", "POST", { name });
		setName("");
	};

	return (
		<section className="admin-section">
			<h2>Catégories</h2>
			<p className="admin-section-desc">
				Gérez les différentes catégories d'utilisateurs.
			</p>

			<div className="admin-list">
				{categories.length === 0 && (
					<div className="admin-list-item" style={{ justifyContent: "center", color: "var(--text-muted)", padding: "24px" }}>
						Aucune catégorie créée.
					</div>
				)}
				{categories.map((category) => (
					<div key={category.id_category} className="admin-list-item">
						<div className="admin-list-item-content">
							<Tag size={16} style={{ color: "var(--text-muted)" }} />
							<div className="admin-list-item-title">
								<input
									defaultValue={category.name}
									onBlur={(event) => {
										if (event.target.value !== category.name && event.target.value.trim() !== "")
											call(`/api/admin/categories/${category.id_category}`, "PUT", { name: event.target.value.trim() });
									}}
									placeholder="Nom de la catégorie"
								/>
							</div>
						</div>
						<div className="admin-list-item-actions">
							<button
								className="action-button action-delete"
								title="Supprimer"
								onClick={() => setCategoryToDelete(category)}
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				))}
			</div>

			<div className="admin-create-panel">
				<h3>Ajouter une catégorie</h3>
				<form className="admin-form" onSubmit={submit}>
					<input placeholder="Nom de la catégorie (ex: Algèbre de Boole)" value={name} onChange={(e) => setName(e.target.value)} required />
					<button type="submit" className="button-primary">
						<Plus size={16} /> Créer la catégorie
					</button>
				</form>
			</div>

			<ConfirmModal
				isOpen={categoryToDelete !== null}
				variant="danger"
				title="Supprimer la catégorie"
				message={
					categoryToDelete ? (
						<>
							Voulez-vous supprimer la catégorie <strong>"{categoryToDelete.name}"</strong> ? Les niveaux qui l'utilisent devront être réassignés.
						</>
					) : ""
				}
				confirmLabel="Supprimer"
				cancelLabel="Annuler"
				onConfirm={() => {
					if (categoryToDelete) {
						call(`/api/admin/categories/${categoryToDelete.id_category}`, "DELETE");
						setCategoryToDelete(null);
					}
				}}
				onCancel={() => setCategoryToDelete(null)}
			/>
		</section>
	);
};

export default CategoriesSection;