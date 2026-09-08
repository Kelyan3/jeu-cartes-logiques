import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthRequiredModal } from "../components/Modals";


const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [targetUrl, setTargetUrl] = useState(null);
	const [cancelHandler, setCancelHandler] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();

	const openAuthModal = useCallback((target = null, onCancel = null) => {
		setTargetUrl(target);
		setCancelHandler(() => onCancel);
		setIsOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsOpen(false);
		setTargetUrl(null);
		setCancelHandler(null);
	}, []);

	const handleLogin = useCallback(() => {
		const redirect = targetUrl || (location.pathname + location.search);
		closeAuthModal();
		navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
	}, [targetUrl, location, closeAuthModal, navigate]);

	const handleRegister = useCallback(() => {
		const redirect = targetUrl || (location.pathname + location.search);
		closeAuthModal();
		navigate(`/register?redirect=${encodeURIComponent(redirect)}`);
	}, [targetUrl, location, closeAuthModal, navigate]);

	const handleCancel = useCallback(() => {
		const handler = cancelHandler;
		closeAuthModal();
		if (handler)
			handler();
	}, [cancelHandler, closeAuthModal]);

	return (
		<AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isAuthModalOpen: isOpen }}>
			{children}
			<AuthRequiredModal
				isOpen={isOpen}
				onLogin={handleLogin}
				onRegister={handleRegister}
				onCancel={handleCancel}
			/>
		</AuthModalContext.Provider>
	);
};

export const useAuthModal = () => {
	const context = useContext(AuthModalContext);
	if (!context)
		throw new Error("useAuthModal doit être utilisé à l'intérieur d'un AuthModalProvider");
	return context;
};
