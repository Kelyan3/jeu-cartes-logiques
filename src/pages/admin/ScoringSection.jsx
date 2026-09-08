import { useState } from "react";
import { ConfirmModal } from "../../components/Modals";


const SCORING_FIELDS = [
	{ key: "score_max", label: "Score max" },
	{ key: "score_min", label: "Score min" },
	{ key: "time_grace_s", label: "Délai de grâce (s)" },
	{ key: "time_interval_s", label: "Palier temps (s)" },
	{ key: "time_penalty", label: "Pénalité / palier temps" },
	{ key: "moves_threshold", label: "Seuil de coups" },
	{ key: "moves_rate", label: "Pénalité / coup" },
];


const ScoringEditor = ({ initialScoring, call }) => {
	const [values, setValues] = useState(() => ({ ...initialScoring }));
	const [validationErrorMsg, setValidationErrorMsg] = useState(null);

	const setField = (key, rawValue) => {
		const value = rawValue === "" ? "" : Number(rawValue);
		setValues((prev) => ({ ...prev, [key]: value }));
		setValidationErrorMsg(null);
	};

	const hasChanges = () => {
		return SCORING_FIELDS.some((field) => Number(values[field.key]) !== initialScoring[field.key]);
	};

	/**
	 * Validation légère côté client, avant même d'envoyer la requête :
	 * reflète les contraintes CHECK posées en base (data.sql), pour donner
	 * un message immédiat plutôt qu'un aller-retour serveur pour rien.
	 */
	const validationError = (vals) => {
		if (SCORING_FIELDS.some((field) => vals[field.key] === "" || Number.isNaN(Number(vals[field.key]))))
			return "Tous les champs doivent être des nombres.";
		if (Number(vals.score_min) > Number(vals.score_max))
			return "Score min ne peut pas dépasser Score max.";
		if (Number(vals.time_interval_s) <= 0)
			return "Palier temps doit être strictement positif.";
		if (SCORING_FIELDS.some((field) => Number(vals[field.key]) < 0))
			return "Aucune valeur ne peut être négative.";
		return null;
	};

	const save = () => {
		const error = validationError(values);
		if (error)
		{
			setValidationErrorMsg(error);
			return;
		}

		setValidationErrorMsg(null);
		const body = Object.fromEntries(SCORING_FIELDS.map((field) => [field.key, Number(values[field.key])]));
		call(`/api/admin/scoring`, "PUT", body);
	};

	return (
		<>
			<div className="scoring-card">
				<h3>Paramètres globaux</h3>
				{validationErrorMsg && (
					<div className="admin-error" role="alert" style={{ marginBottom: "16px" }}>
						{validationErrorMsg}
					</div>
				)}
				<div className="scoring-fields">
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
				<button className="reset-button" disabled={!hasChanges()} onClick={save}>
					Enregistrer
				</button>
			</div>

			<ConfirmModal
				isOpen={validationErrorMsg !== null}
				variant="warning"
				title="Paramètres de score invalides"
				message={validationErrorMsg}
				confirmLabel="J'ai compris"
				cancelLabel={null}
				onConfirm={() => setValidationErrorMsg(null)}
				onCancel={() => setValidationErrorMsg(null)}
			/>
		</>
	);
};

const ScoringSection = ({ globalScoring, call }) => {
	const scoringKey = globalScoring ? JSON.stringify(globalScoring) : "none";

	return (
		<section className="admin-section">
			<h2>Gestion du score</h2>
			<p className="admin-hint">
				score = max(score_min, score_max - pénalité_temps - pénalité_coups).<br />
				La pénalité temps retire "Pénalité / palier temps" pts par tranche de "Palier temps (s)" secondes dépassée au-delà du "Délai de grâce".<br />
				La pénalité coups retire "Pénalité / coup" pts par coup au-delà du "Seuil de coups".<br />
				Ne concerne que les niveaux du mode Play.<br />
				Ces paramètres s'appliquent à tous les niveaux.
			</p>

			{!globalScoring ? (
				<p className="choice-message">Chargement des paramètres de score...</p>
			) : (
				<ScoringEditor key={scoringKey} initialScoring={globalScoring} call={call} />
			)}
		</section>
	);
};

export default ScoringSection;