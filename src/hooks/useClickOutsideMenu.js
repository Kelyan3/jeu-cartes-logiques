import { useState, useRef, useEffect } from "react";


/**
 * Gère l'ouverture/fermeture d'un menu déroulant qui se ferme automatiquement
 * au clic en dehors de celui-ci (bouton d'ouverture compris, via la ref à poser
 * sur le conteneur du menu).
 *
 * @returns {{isOpen: boolean, setIsOpen: Function, menuRef: React.RefObject}}
 */
export function useClickOutsideMenu()
{
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		if (!isOpen)
			return;

		function onClickOutside(event)
		{
			if (menuRef.current && !menuRef.current.contains(event.target))
				setIsOpen(false);
		}

		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, [isOpen]);

	return { isOpen, setIsOpen, menuRef };
}