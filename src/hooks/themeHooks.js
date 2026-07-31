import { createContext, useContext } from "react";

/**
 * Contexte brut de thème.
 */
export const ThemeContext = createContext(null);

/**
 * Hook d'accès au contexte de thème (theme, toggleTheme).
 * À utiliser dans un composant descendant de <ThemeProvider>.
 */
export const useTheme = () => useContext(ThemeContext);