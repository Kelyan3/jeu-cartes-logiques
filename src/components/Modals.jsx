import { useEffect, useRef } from "react";
import { Lock, X, LogIn, UserPlus, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { NavLink } from "react-router-dom";

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
export const AuthRequiredModal = ({
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
			className="confirm-modal-overlay"
			onClick={handleBackdropClick}
			role="presentation"
		>
			<div
				className="confirm-modal-card auth-modal-card"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="auth-modal-title"
				aria-describedby="auth-modal-desc"
			>
				<button
					type="button"
					className="confirm-modal-close"
					onClick={onCancel}
					aria-label="Fermer la boîte de dialogue"
				>
					<X size={16} />
				</button>

				<div className="confirm-modal-icon-wrapper warning">
					<Lock size={26} strokeWidth={2.2} />
				</div>

				<h3 id="auth-modal-title" className="confirm-modal-title">
					Compte requis
				</h3>

				<div id="auth-modal-desc" className="confirm-modal-message">
					Vous devez être connecté à un compte pour pouvoir jouer à un niveau ou créer vos propres exercices.
				</div>

				<div className="confirm-modal-actions auth-modal-actions">
					<button
						type="button"
						className="confirm-modal-btn confirm-modal-btn-cancel"
						onClick={onCancel}
					>
						Annuler
					</button>
					<button
						type="button"
						className="confirm-modal-btn confirm-modal-btn-cancel"
						onClick={onRegister}
					>
						<UserPlus size={16} /> S'inscrire
					</button>
					<button
						ref={loginBtnRef}
						type="button"
						className="confirm-modal-btn confirm-modal-btn-confirm info"
						onClick={onLogin}
					>
						<LogIn size={16} /> Se connecter
					</button>
				</div>
			</div>
		</div>
	);
};


/**
 * Boîte de dialogue modale accessible remplaçant les dialogues natifs `window.confirm` et `window.alert`.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modal
 * @param {string|React.ReactNode} props.title - Titre du dialogue
 * @param {string|React.ReactNode} props.message - Message explicatif ou corps du dialogue
 * @param {string} [props.confirmLabel="Confirmer"] - Libellé du bouton de confirmation
 * @param {string|null} [props.cancelLabel="Annuler"] - Libellé du bouton d'annulation (null pour mode alerte pure)
 * @param {"danger"|"warning"|"info"} [props.variant="danger"] - Variante visuelle (danger, warning, info)
 * @param {Function} props.onConfirm - Action exécutée à la confirmation
 * @param {Function} props.onCancel - Action exécutée à l'annulation ou fermeture
 * @param {boolean} [props.isPending=false] - Indique si l'action est en cours d'exécution
 * @param {boolean} [props.closeOnBackdrop=true] - Fermer en cliquant sur l'arrière-plan
 */
export const ConfirmModal = ({
	isOpen,
	title,
	message,
	confirmLabel = "Confirmer",
	cancelLabel = "Annuler",
	variant = "danger",
	onConfirm,
	onCancel,
	isPending = false,
	closeOnBackdrop = true,
}) => {
	const confirmBtnRef = useRef(null);
	const cancelBtnRef = useRef(null);

	useEffect(() => {
		if (!isOpen)
			return;

		// Focus automatique : sur le bouton Annuler par défaut (plus sécurisant contre les validations accidentelles)
		const timer = setTimeout(() => {
			if (cancelLabel && cancelBtnRef.current)
				cancelBtnRef.current.focus();
			else if (confirmBtnRef.current)
				confirmBtnRef.current.focus();
		}, 30);

		const handleKeyDown = (event) => {
			if (event.key === "Escape" && !isPending)
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
	}, [isOpen, isPending, cancelLabel, onCancel]);

	if (!isOpen)
		return null;

	const handleBackdropClick = (event) => {
		if (closeOnBackdrop && event.target === event.currentTarget && !isPending)
			onCancel?.();
	};

	const renderIcon = () => {
		switch (variant) {
			case "warning":
				return <AlertCircle size={26} strokeWidth={2.2} />;
			case "info":
				return <Info size={26} strokeWidth={2.2} />;
			case "danger":
			default:
				return <AlertTriangle size={26} strokeWidth={2.2} />;
		}
	};

	return (
		<div
			className="confirm-modal-overlay"
			onClick={handleBackdropClick}
			role="presentation"
		>
			<div
				className="confirm-modal-card"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="confirm-modal-title"
				aria-describedby="confirm-modal-desc"
			>
				<button
					type="button"
					className="confirm-modal-close"
					onClick={onCancel}
					disabled={isPending}
					aria-label="Fermer la boîte de dialogue"
				>
					<X size={16} />
				</button>

				<div className={`confirm-modal-icon-wrapper ${variant}`}>
					{renderIcon()}
				</div>

				<h3 id="confirm-modal-title" className="confirm-modal-title">
					{title}
				</h3>

				<div id="confirm-modal-desc" className="confirm-modal-message">
					{message}
				</div>

				<div className="confirm-modal-actions">
					{cancelLabel && (
						<button
							ref={cancelBtnRef}
							type="button"
							className="confirm-modal-btn confirm-modal-btn-cancel"
							onClick={onCancel}
							disabled={isPending}
						>
							{cancelLabel}
						</button>
					)}
					<button
						ref={confirmBtnRef}
						type="button"
						className={`confirm-modal-btn confirm-modal-btn-confirm ${variant}`}
						onClick={onConfirm}
						disabled={isPending}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export const Popup = props => {
	return (
		<div className="popup-box" role="dialog" aria-modal="true" aria-label="Boîte de dialogue">
			<div className="bigbox">
				<div className="box">
					{props.content}
				</div>
			</div>
		</div>
	);
};

export const PopupForms = () => {
	return (
		<div className="popup-forms-box">
			<div className="bigbox">
				<div className="box">
					<NavLink to="/forms">Votre avis nous intéresse</NavLink>
				</div>
			</div>
		</div>
	);
};