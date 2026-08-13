import { createContext, useContext } from "react";


/**
 * Contexte brut de thème.
 */
export const ThemeContext = createContext(null);

/**
 * Hook d'accès au contexte de thème (theme, toggleTheme).
 */
export const useTheme = () => useContext(ThemeContext);