import { useState } from "react";

import { MENUS } from "./constants";


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

export default QuestsSection;