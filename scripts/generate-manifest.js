import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicJSONDir = path.join(__dirname, "..", "public", "json");


/**
 * Trouve le plus grand numéro de niveau présent dans un dossier, en se basant
 * sur les fichiers correspondant au motif donné, et vérifie que la
 * numérotation est continue de 1 à ce maximum, sans trou ni doublon.
 *
 * @param {string} dir - dossier à scanner
 * @param {RegExp} pattern - motif de nom de fichier, avec le numéro capturé en groupe 1
 * @param {string} label - nom du mode ("Play"/"Tutorial"), pour un message d'erreur explicite
 *
 * @returns {number} le plus grand numéro trouvé (0 si le dossier est vide/absent)
 */
function findMaxLevel(dir, pattern, label)
{
	if (!fs.existsSync(dir))
		return 0;

	const files = fs.readdirSync(dir);
	const numbers = files
		.map((file) => file.match(pattern))
		.filter(Boolean)
		.map((match) => parseInt(match[1], 10));

	if (numbers.length === 0)
		return 0;

	const max = Math.max(...numbers);

	const duplicates = [...new Set(numbers.filter((num, i) => numbers.indexOf(num) !== i))];
	if (duplicates.length > 0)
	{
		console.error(`[ERREUR] Numéro(s) "${label}" en double dans le dossier "${dir}" : ${duplicates.join(", ")}`);
		process.exit(1);
	}

	const missing = [];
	for (let num = 1; num <= max; num++)
	{
		if (!numbers.includes(num))
			missing.push(num);
	}

	if (missing.length > 0)
	{
		console.error(`[ERREUR] Numéro(s) "${label}" manquant(s) dans le dossier "${dir}" : ${missing.join(", ")}`);
		process.exit(1);
	}

	return max;
}

const manifest = {
	Play: findMaxLevel(
		path.join(publicJSONDir, "exos_feuilles"),
		/^ex(\d+)\.json$/,
		"Play"
	),
	Tutorial: findMaxLevel(
		path.join(publicJSONDir, "tutoriel"),
		/^tuto(\d+)\.json$/,
		"Tutorial"
	)
};

fs.writeFileSync(
	path.join(publicJSONDir, "manifest.json"),
	JSON.stringify(manifest, null, 4)
);

console.log("Manifeste généré :", manifest);