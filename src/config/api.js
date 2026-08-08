export const API_BASE_URL = import.meta.env.DEV
	? "http://localhost:80"
	: (import.meta.env.VITE_API_URL ?? "");