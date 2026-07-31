import { createContext, useContext } from "react";

/**
 * Contexte brut d'authentification.
 */
export const AuthContext = createContext(null);

/**
 * Hook d'accès au contexte d'authentification (user, loading, login, register, logout).
 * À utiliser dans un composant descendant de <AuthProvider>.
 */
export const useAuth = () => useContext(AuthContext);