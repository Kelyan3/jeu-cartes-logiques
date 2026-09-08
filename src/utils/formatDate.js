/**
 * Formate une date (chaîne ISO ou objet Date) au format français usuel (ex: "14 mai 2024").
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string|null} null si dateInput est invalide ou absent
 */
export function formatDate(dateInput)
{
	if (!dateInput)
		return null;

	const date = new Date(dateInput);
	if (isNaN(date.getTime()))
		return null;

	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(date);
}