import { useEffect, useRef } from "react";
import { Lock, X, LogIn, UserPlus } from "lucide-react";


/**
 * Boîte de dialogue accessible informant l'utilisateur qu'un compte est requis pour jouer ou créer un niveau.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modal
 * @param {Function} props.onLogin - Action pour rediriger vers la page de connexion
 * @param {Function} props.onRegister - Action pour rediriger vers la page d'inscription
 * @param {Function} props.onCancel - Action pour fermer la modal
 * @param {boolean} [props.closeOnBackdrop=true] - Fermer en cliquant sur le fond
 */
const AuthRequiredModal = ({
	isOpen,
	onLogin,
	onRegister,
	onCancel,
	closeOnBackdrop = true,
}) => {
	const loginBtnRef = useRef(null);

	useEffect(() => {
		if (!isOpen)
			return;

		const timer = setTimeout(() => {
			if (loginBtnRef.current)
				loginBtnRef.current.focus();
		}, 30);

		const handleKeyDown = (event) => {
			if (event.key === "Escape")
			{
				event.preventDefault();
				onCancel?.();
			}
		};

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			clearTimeout(timer);
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onCancel]);

	if (!isOpen)
		return null;

	const handleBackdropClick = (event) => {
		if (closeOnBackdrop && event.target === event.currentTarget)
			onCancel?.();
	};

	return (
		<div
			className="confirmModalOverlay"
			onClick={handleBackdropClick}
			role="presentation"
		>
			<div
				className="confirmModalCard authModalCard"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="auth-modal-title"
				aria-describedby="auth-modal-desc"
			>
				<button
					type="button"
					className="confirmModalClose"
					onClick={onCancel}
					aria-label="Fermer la boîte de dialogue"
				>
					<X size={16} />
				</button>

				<div className="confirmModalIconWrapper warning">
					<Lock size={26} strokeWidth={2.2} />
				</div>

				<h3 id="auth-modal-title" className="confirmModalTitle">
					Compte requis
				</h3>

				<div id="auth-modal-desc" className="confirmModalMessage">
					Vous devez être connecté à un compte pour pouvoir jouer à un niveau ou créer vos propres exercices.
				</div>

				<div className="confirmModalActions authModalActions">
					<button
						type="button"
						className="confirmModalBtn confirmModalBtnCancel"
						onClick={onCancel}
					>
						Annuler
					</button>
					<button
						type="button"
						className="confirmModalBtn confirmModalBtnCancel"
						onClick={onRegister}
					>
						<UserPlus size={16} /> S'inscrire
					</button>
					<button
						ref={loginBtnRef}
						type="button"
						className="confirmModalBtn confirmModalBtnConfirm info"
						onClick={onLogin}
					>
						<LogIn size={16} /> Se connecter
					</button>
				</div>
			</div>
		</div>
	);
};

export default AuthRequiredModal;