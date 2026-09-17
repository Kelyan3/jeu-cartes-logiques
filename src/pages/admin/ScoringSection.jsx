import { useState } from "react";
import { ConfirmModal } from "../../components/Modals";
import { Clock, MousePointer2, Trophy } from "lucide-react";


const SCORING_GROUPS = [
	{
		title: "Points de base",
		icon: <Trophy size={18} className="icon-trophy" style={{ color: "var(--accent-orange)" }} />,
		description: "Définissez le score initial accordé pour la réussite d'un niveau.",
		fields: [
			{ key: "score_max", label: "Score maximum de départ" },
			{ key: "score_min", label: "Score minimum garanti (plancher)" },
		]
	},
	{
		title: "Pénalité de Temps",
		icon: <Clock size={18} style={{ color: "var(--accent-cyan)" }} />,
		description: "Les élèves perdent des points s'ils mettent trop de temps à résoudre le niveau.",
		fields: [
			{ key: "time_grace_s", label: "Temps accordé sans pénalité (secondes)" },
			{ key: "time_interval_s", label: "Intervalle de pénalité (secondes)" },
			{ key: "time_penalty", label: "Points perdus par intervalle de temps" },
		]
	},
	{
		title: "Pénalité d'Actions",
		icon: <MousePointer2 size={18} style={{ color: "var(--accent-purple)" }} />,
		description: "Les élèves perdent des points s'ils effectuent trop d'actions (sélections, fusions, etc.).",
		fields: [
			{ key: "moves_threshold", label: "Nombre d'actions autorisées sans pénalité" },
			{ key: "moves_rate", label: "Points perdus par action supplémentaire" },
		]
	}
];

const SCORING_FIELDS_FLAT = SCORING_GROUPS.flatMap(g => g.fields);

const ScoringEditor = ({ initialScoring, call }) => {
	const [values, setValues] = useState(() => ({ ...initialScoring }));
	const [validationErrorMsg, setValidationErrorMsg] = useState(null);

	const setField = (key, rawValue) => {
		const value = rawValue === "" ? "" : Number(rawValue);
		setValues((prev) => ({ ...prev, [key]: value }));
		setValidationErrorMsg(null);
	};

	const hasChanges = () => {
		return SCORING_FIELDS_FLAT.some((field) => Number(values[field.key]) !== initialScoring[field.key]);
	};

	const validationError = (vals) => {
		if (SCORING_FIELDS_FLAT.some((field) => vals[field.key] === "" || Number.isNaN(Number(vals[field.key]))))
			return "Tous les champs doivent être des nombres valides.";
		
		if (Number(vals.score_min) > Number(vals.score_max))
			return "Le score minimum garanti ne peut pas dépasser le score maximum de départ.";
		
		if (Number(vals.time_interval_s) <= 0)
			return "L'intervalle de temps pour la pénalité doit être strictement supérieur à zéro.";
		
		if (SCORING_FIELDS_FLAT.some((field) => Number(vals[field.key]) < 0))
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
		const body = Object.fromEntries(SCORING_FIELDS_FLAT.map((field) => [field.key, Number(values[field.key])]));
		call(`/api/admin/scoring`, "PUT", body);
	};

	return (
		<>
			<div className="scoring-card">
				{validationErrorMsg && (
					<div className="admin-error" role="alert" style={{ marginBottom: "16px" }}>
						{validationErrorMsg}
					</div>
				)}

				<div className="scoring-groups">
					{SCORING_GROUPS.map((group, idx) => (
						<div key={idx} className="scoring-group">
							<div className="scoring-group-header">
								{group.icon}
								{group.title}
							</div>
							<div className="scoring-group-desc">
								{group.description}
							</div>
							<div className="scoring-group-fields">
								{group.fields.map((field) => (
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
						</div>
					))}
				</div>

				<div className="scoring-save-container">
					<button className="reset-button" disabled={!hasChanges()} onClick={save}>
						Enregistrer les modifications
					</button>
				</div>
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
				Ajustez ici la formule de calcul des points pour les niveaux du mode "Jouer". 
				Ces paramètres s'appliquent de manière globale à tous les niveaux. Le score d'un élève ne descendra jamais en dessous du minimum défini.
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