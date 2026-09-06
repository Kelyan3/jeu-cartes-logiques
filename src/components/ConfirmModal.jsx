import { useEffect, useRef } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";


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
const ConfirmModal = ({
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
			className="confirmModalOverlay"
			onClick={handleBackdropClick}
			role="presentation"
		>
			<div
				className="confirmModalCard"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="confirm-modal-title"
				aria-describedby="confirm-modal-desc"
			>
				<button
					type="button"
					className="confirmModalClose"
					onClick={onCancel}
					disabled={isPending}
					aria-label="Fermer la boîte de dialogue"
				>
					<X size={16} />
				</button>

				<div className={`confirmModalIconWrapper ${variant}`}>
					{renderIcon()}
				</div>

				<h3 id="confirm-modal-title" className="confirmModalTitle">
					{title}
				</h3>

				<div id="confirm-modal-desc" className="confirmModalMessage">
					{message}
				</div>

				<div className="confirmModalActions">
					{cancelLabel && (
						<button
							ref={cancelBtnRef}
							type="button"
							className="confirmModalBtn confirmModalBtnCancel"
							onClick={onCancel}
							disabled={isPending}
						>
							{cancelLabel}
						</button>
					)}
					<button
						ref={confirmBtnRef}
						type="button"
						className={`confirmModalBtn confirmModalBtnConfirm ${variant}`}
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

export default ConfirmModal;