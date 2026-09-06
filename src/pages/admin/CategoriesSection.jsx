import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";


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
									className="actionButton actionDelete"
									title="Supprimer"
									onClick={() => setCategoryToDelete(category)}
								>
									<Trash2 size={16} />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="adminCreatePanel">
				<h3>Ajouter une catégorie</h3>
				<form className="adminForm" onSubmit={submit}>
					<input placeholder="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} required />
					<button type="submit" className="buttonPrimary">
						<Plus size={16} /> Créer
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
							Voulez-vous supprimer la catégorie <strong>"{categoryToDelete.name}"</strong> ? Les utilisateurs concernés devront en sélectionner une nouvelle.
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