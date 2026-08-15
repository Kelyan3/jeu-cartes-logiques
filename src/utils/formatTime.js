/**
 * Formate un nombre de secondes en chaîne "MM:SS" (ex: 51 -> "00:51", 125 -> "02:05").
 *
 * @param {number|null|undefined} totalSeconds
 *
 * @returns {string|null} null si totalSeconds est null/undefined (rien à afficher)
 */
export function formatTime(totalSeconds)
{
	if (totalSeconds === null || totalSeconds === undefined)
		return null;

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}