import { useState } from "react";
import FeedbackRating from "./FeedbackRating";
import { ConfirmModal } from "../../components/Modals";


const DEVICE_LABELS = {
	ordinateur: "Ordinateur",
	mobile: "Smartphone / Tablette",
	autre: "Autre",
};


/**
 * Section "Avis reçus" : liste des retours utilisateurs avec suppression.
 */
const FeedbackSection = ({ feedback, call }) => {
	const [feedbackToDelete, setFeedbackToDelete] = useState(null);

	return (
		<section className="admin-section">
			<h2>Avis reçus</h2>

			{feedback.length === 0 && <p className="admin-hint">Aucun avis pour le moment.</p>}

			{feedback.map((entry) => (
				<article key={entry.id_feedback} className="scoring-card feedback-card">
					<header className="feedback-card-header">
						<div>
							<strong>{entry.username ?? "Anonyme"}</strong>
							<span className="feedback-device">
								{DEVICE_LABELS[entry.device] ?? entry.device}
								{entry.device === "autre" && entry.device_other ? ` — ${entry.device_other}` : ""}
							</span>
						</div>
						<div className="feedback-card-actions">
							<span className="feedback-date">{new Date(entry.created_at).toLocaleDateString("fr-FR")}</span>
							<button
								className="reset-button"
								onClick={() => setFeedbackToDelete(entry.id_feedback)}
							>
								Supprimer
							</button>
						</div>
					</header>

					<FeedbackRating label="Règles simples à comprendre" rating={entry.rules_rating} comment={entry.rules_comment} />
					<FeedbackRating label="Fonctionnalités intuitives" rating={entry.features_rating} comment={entry.features_comment} />
					<FeedbackRating label="Site agréable visuellement" rating={entry.design_rating} comment={entry.design_comment} />

					{entry.remarks && (
						<p className="feedback-remarks"><strong>Autres remarques :</strong> {entry.remarks}</p>
					)}
				</article>
			))}

			<ConfirmModal
				isOpen={feedbackToDelete !== null}
				variant="danger"
				title="Supprimer l'avis"
				message="Êtes-vous sûr de vouloir supprimer définitivement cet avis utilisateur ?"
				confirmLabel="Supprimer"
				cancelLabel="Annuler"
				onConfirm={() => {
					if (feedbackToDelete) {
						call(`/api/admin/feedback/${feedbackToDelete}`, "DELETE");
						setFeedbackToDelete(null);
					}
				}}
				onCancel={() => setFeedbackToDelete(null)}
			/>
		</section>
	);
};

export default FeedbackSection;