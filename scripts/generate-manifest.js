import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicJSONDir = path.join(__dirname, "..", "public", "json");


/**
 * Trouve le plus grand numéro de niveau présent dans un dossier,
 * en se basant sur les fichiers correspondant au motif donné.
 * 
 * @param {string} dir - dossier à scanner
 * @param {RegExp} pattern - motif de nom de fichier, avec le numéro capturé en groupe 1
 * 
 * @returns {number} le plus grand numéro trouvé (0 si le dossier est vide/absent)
 */
function findMaxLevel(dir, pattern) {
	if (!fs.existsSync(dir))
		return 0;

	const files = fs.readdirSync(dir);
	let max = 0;
	files.forEach((file) => {
		const match = file.match(pattern);
		if (match)
		{
			const num = parseInt(match[1], 10);
			if (num > max)
				max = num;
		}
	});

	return max;
}

const manifest = {
	Play: findMaxLevel(
		path.join(publicJSONDir, "exos_feuilles"),
		/^ex(\d+)\.json$/
	),
	Tutorial: findMaxLevel(
		path.join(publicJSONDir, "tutoriel"),
		/^tuto(\d+)\.json$/
	),
};

fs.writeFileSync(
	path.join(publicJSONDir, "manifest.json"),
	JSON.stringify(manifest, null, 4)
);

console.log("Manifeste généré :", manifest);