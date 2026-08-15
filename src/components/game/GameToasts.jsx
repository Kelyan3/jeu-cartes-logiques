/**
 * Messages temporaires : tutoriel et erreurs de coup illégal.
 */
const GameToasts = ({ mode, messageTutorial, messageErreur }) => {
	return (
		<>
			{mode === "Tutorial" && messageTutorial !== "" && (
				<div className="toast toastTutorial">
					{messageTutorial.map((element, index) => (
						<div key={index}>{element}</div>
					))}
				</div>
			)}

			{messageErreur !== "" && (
				<div className="toast toastError">{messageErreur}</div>
			)}
		</>
	);
};

export default GameToasts;