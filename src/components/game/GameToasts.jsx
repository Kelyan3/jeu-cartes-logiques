/**
 * Messages temporaires : tutoriel et erreurs de coup illégal.
 */
const GameToasts = ({ mode, tutorialMessage, errorMessage }) => {
	return (
		<>
			{mode === "Tutorial" && tutorialMessage !== "" && (
				<div className="toast toastTutorial">
					{tutorialMessage.map((element, index) => (
						<div key={index}>{element}</div>
					))}
				</div>
			)}

			{errorMessage !== "" && (
				<div className="toast toastError">{errorMessage}</div>
			)}
		</>
	);
};

export default GameToasts;