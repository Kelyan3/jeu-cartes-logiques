import { useState } from "react";

import { SCORING_FIELDS } from "./constants";


const ScoringSection = ({ globalScoring, call }) => {
	const [edited, setEdited] = useState(null);

	/**
	 * Resynchronise la copie éditable dès que globalScoring change (nouvelle
	 * réponse serveur), pendant le rendu et non dans un useEffect.
	 */
	const [prevGlobalScoring, setPrevGlobalScoring] = useState(globalScoring);
	if (prevGlobalScoring !== globalScoring) {
		setPrevGlobalScoring(globalScoring);
		setEdited(globalScoring ? { ...globalScoring } : null);
	}

	const values = edited ?? globalScoring;

	const setField = (key, rawValue) => {
		const value = rawValue === "" ? "" : Number(rawValue);
		setEdited((prev) => ({ ...(prev ?? globalScoring), [key]: value }));
	};

	const hasChanges = () => {
		if (!globalScoring || !edited)
			return false;
		return SCORING_FIELDS.some((field) => Number(edited[field.key]) !== globalScoring[field.key]);
	};

	/**
	 * Validation légère côté client, avant même d'envoyer la requête :
	 * reflète les contraintes CHECK posées en base (data.sql), pour donner
	 * un message immédiat plutôt qu'un aller-retour serveur pour rien.
	 */
	const validationError = (values) => {
		if (SCORING_FIELDS.some((field) => values[field.key] === "" || Number.isNaN(Number(values[field.key]))))
			return "Tous les champs doivent être des nombres.";
		if (Number(values.score_min) > Number(values.score_max))
			return "Score min ne peut pas dépasser Score max.";
		if (Number(values.time_interval_s) <= 0)
			return "Palier temps doit être strictement positif.";
		if (SCORING_FIELDS.some((field) => Number(values[field.key]) < 0))
			return "Aucune valeur ne peut être négative.";
		return null;
	};

	const save = () => {
		if (!values)
			return;

		const error = validationError(values);
		if (error)
		{
			window.alert(error);
			return;
		}

		const body = Object.fromEntries(SCORING_FIELDS.map((field) => [field.key, Number(values[field.key])]));
		call(`/api/admin/scoring`, "PUT", body);
	};

	return (
		<section className="adminSection">
			<h2>Gestion du score</h2>
			<p className="adminHint">
				score = max(score_min, score_max - pénalité_temps - pénalité_coups).<br />
				La pénalité temps retire "Pénalité / palier temps" pts par tranche de "Palier temps (s)" secondes dépassée au-delà du "Délai de grâce".<br />
				La pénalité coups retire "Pénalité / coup" pts par coup au-delà du "Seuil de coups".<br />
				Ne concerne que les niveaux du mode Play.<br />
				Ces paramètres s'appliquent à tous les niveaux.
			</p>

			{!values ? (
				<p className="choiceMessage">Chargement des paramètres de score...</p>
			) : (
				<div className="scoringCard">
					<h3>Paramètres globaux</h3>
					<div className="scoringFields">
						{SCORING_FIELDS.map((field) => (
							<label key={field.key}>
								{field.label}
								<input
									type="number"
									min="0"
									value={values[field.key]}
									onChange={(e) => setField(field.key, e.target.value)}
								/>
							</label>
						))}
					</div>
					<button className="resetButton" disabled={!hasChanges()} onClick={save}>
						Enregistrer
					</button>
				</div>
			)}
		</section>
	);
};

export default ScoringSection;