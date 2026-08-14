import { useState } from "react";


/**
 * Section "Catégories" : création, renommage, suppression.
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

export default CategoriesSection;