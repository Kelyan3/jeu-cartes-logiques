import { RATING_LABELS } from "./constants";


const FeedbackRating = ({ label, rating, comment }) => (
	<div className="feedbackRating">
		<span className="feedbackRatingLabel">{label}</span>
		<span className="feedbackRatingValue">{RATING_LABELS[rating - 1]} ({rating}/5)</span>
		{comment && <p className="feedbackRatingComment">{comment}</p>}
	</div>
);

export default FeedbackRating;