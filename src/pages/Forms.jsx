import { useState } from "react";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL as API } from "../config/api";
import { Send, CheckCircle2 } from "lucide-react";


const RATING_LABELS = [
	"Pas du tout d'accord",
	"Pas d'accord",
	"Moyen",
	"D'accord",
	"Totalement d'accord",
];

const LikertField = ({
	name,
	question,
	rating, onRatingChange,
	comment, onCommentChange
}) => (
	<div className="field likert-field">
		<label>{question}</label>
		<div className="likert-options">
			{RATING_LABELS.map((label, index) => {
				const value = index + 1;
				return (
					<label key={value} className="likert-option">
						<input
							type="radio"
							name={name}
							value={value}
							checked={rating === value}
							onChange={() => onRatingChange(value)}
							required
						/>
						{label}
					</label>
				);
			})}
		</div>
		<textarea
			placeholder="Optionnel : donnez vos explications"
			value={comment}
			onChange={(e) => onCommentChange(e.target.value)}
			maxLength={1000}
			rows={2}
		/>
	</div>
)

const Forms = () => {
	const { user } = useAuth();

	const [device, setDevice] = useState("ordinateur");
	const [deviceOther, setDeviceOther] = useState("");
	const [rulesRating, setRulesRating] = useState(0);
	const [rulesComment, setRulesComment] = useState("");
	const [featuresRating, setFeaturesRating] = useState(0);
	const [featuresComment, setFeaturesComment] = useState("");
	const [designRating, setDesignRating] = useState(0);
	const [designComment, setDesignComment] = useState("");
	const [remarks, setRemarks] = useState("");
	const [anonymous, setAnonymous] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);

	const handleSubmit = (event) => {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		fetch(`${API}/api/feedback`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				device,
				device_other: device === "autre" ? deviceOther : null,
				rules_rating: rulesRating,
				rules_comment: rulesComment,
				features_rating: featuresRating,
				features_comment: featuresComment,
				design_rating: designRating,
				design_comment: designComment,
				remarks,
				anonymous,
			}),
		})
			.then(async (response) => {
				const data = await response.json().catch(() => ({}));
				if (!response.ok) {
					setError(data.error || "Une erreur est survenue");
					return;
				}
				setSent(true);
			})
			.catch(() => setError("Impossible de contacter le serveur"))
			.finally(() => setSubmitting(false));
	};

	return (
		<div className="forms">
			<Navigation />
			<div id="forms">
				<span className="eyebrow">Votre avis</span>
				<h2>Donnez votre avis</h2>

				{sent ? (
					<div className="form-success-state">
						<CheckCircle2 size={48} className="success-icon" />
						<h3>Merci beaucoup !</h3>
						<p>Votre avis a bien été envoyé. Il nous aidera à améliorer le Jeu des Cartes Logiques.</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="auth-form feedback-form">
						<div className="field">
							<label>Sur quel support avez-vous consulté ce site ?</label>
							<div className="likert-options">
								<label className="likert-option">
									<input type="radio" name="device" value="ordinateur" checked={device === "ordinateur"} onChange={() => setDevice("ordinateur")} required />
									Ordinateur
								</label>
								<label className="likert-option">
									<input type="radio" name="device" value="mobile" checked={device === "mobile"} onChange={() => setDevice("mobile")} />
									Smartphone / Tablette
								</label>
								<label className="likert-option">
									<input type="radio" name="device" value="autre" checked={device === "autre"} onChange={() => setDevice("autre")} />
									Autre
								</label>
							</div>

							{device === "autre" && (
								<input
									type="text"
									placeholder="Précisez le support"
									value={deviceOther}
									onChange={(e) => setDeviceOther(e.target.value)}
									maxLength={255}
									required
								/>
							)}
						</div>

						<LikertField
							name="rules_rating"
							question="Pensez-vous que les règles du jeu sont simples à comprendre ?"
							rating={rulesRating}
							onRatingChange={setRulesRating}
							comment={rulesComment}
							onCommentChange={setRulesComment}
						/>

						<LikertField
							name="features_rating"
							question="Pensez-vous que les fonctionnalités du site sont intuitives ?"
							rating={featuresRating}
							onRatingChange={setFeaturesRating}
							comment={featuresComment}
							onCommentChange={setFeaturesComment}
						/>

						<LikertField
							name="design_rating"
							question="Pensez-vous que le site est agréable visuellement ?"
							rating={designRating}
							onRatingChange={setDesignRating}
							comment={designComment}
							onCommentChange={setDesignComment}
						/>

						<div className="field">
							<label htmlFor="remarks">Avez-vous d'autres remarques ?</label>
							<textarea
								id="remarks"
								placeholder="Optionnel"
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								maxLength={1000}
								rows={3}
							/>
						</div>

						{user && (
							<div className="field field-checkbox">
								<label htmlFor="anonymous">
									<input
										id="anonymous"
										type="checkbox"
										checked={anonymous}
										onChange={(e) => setAnonymous(e.target.checked)}
									/>
									Envoyer anonymement (votre pseudo ne sera pas associé)
								</label>
							</div>
						)}

						{error && <p className="form-error">{error}</p>}

						<button type="submit" className="auth-submit" disabled={submitting}>
							<Send size={18} style={{marginRight: "8px"}} />
							{submitting ? "Envoi en cours..." : "Envoyer mon avis"}
						</button>
					</form>
				)}
			</div>
		</div>
	)
}

export default Forms;