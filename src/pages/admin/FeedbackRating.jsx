const RATING_LABELS = [
	"Pas du tout d'accord",
	"Pas d'accord",
	"Moyen",
	"D'accord",
	"Totalement d'accord",
];


const FeedbackRating = ({ label, rating, comment }) => (
	<div className="feedback-rating">
		<span className="feedback-rating-label">{label}</span>
		<span className="feedback-rating-value">{RATING_LABELS[rating - 1]} ({rating}/5)</span>
		{comment && <p className="feedback-rating-comment">{comment}</p>}
	</div>
);

export default FeedbackRating;