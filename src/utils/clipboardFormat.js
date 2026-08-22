/**
 * Reconvertit le texte sélectionné dans la zone de démonstration (symboles logiques
 * affichés ∧, ⇒, ⇔, ¬) en notation ASCII (^, =>, <=>, non), nettoie les espaces
 * insécables, et déduplique les segments répétés avant de placer le résultat dans le
 * presse-papier.
 *
 * @param {string} rawText - texte brut tel que renvoyé par window.getSelection().toString()
 *
 * @returns {string} le texte prêt à être copié dans le presse-papier
 */
export function formatCopiedDemonstrationText(rawText)
{
	let str = rawText;
	str = str.replaceAll("∧", "^");
	str = str.replaceAll("⇔", "<=>");
	str = str.replaceAll("⇒", "=>");
	str = str.replaceAll("¬", "non");

	let espaceInsec = new RegExp(String.fromCharCode(160), "g");
	str = str.replaceAll(espaceInsec, " ");
	str = str.replaceAll("  ", " ");
	str = str.replaceAll(" .", ".");

	let arrayLine = str.split("\n");
	let futurArrayLine = [];
	arrayLine.forEach((line) => {
		let arrayElement = line.split(", ");
		let futurArrayElement = [];
		arrayElement.forEach((elementComa) => {
			let arrayPoint = elementComa.split(". ");
			let futurArrayPoint = [];
			arrayPoint.forEach((element) => {
				if (!futurArrayPoint.includes(element))
					futurArrayPoint.push(element);
			});

			let normalizedPoint = futurArrayPoint.join(". ");
			if (!futurArrayElement.includes(normalizedPoint))
				futurArrayElement.push(normalizedPoint);
		});

		futurArrayLine.push(futurArrayElement.join(", "));
	});

	return futurArrayLine.join("\n");
}