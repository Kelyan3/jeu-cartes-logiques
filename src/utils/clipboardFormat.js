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
	let text = rawText;
	text = text.replaceAll("∧", "^");
	text = text.replaceAll("⇔", "<=>");
	text = text.replaceAll("⇒", "=>");
	text = text.replaceAll("¬", "non");

	let nonBreakingSpace = new RegExp(String.fromCharCode(160), "g");
	text = text.replaceAll(nonBreakingSpace, " ");
	text = text.replaceAll("  ", " ");
	text = text.replaceAll(" .", ".");

	let lines = text.split("\n");
	let dedupedLines = [];

	lines.forEach((line) => {
		let commaSegments = line.split(", ");
		let dedupedCommaSegments = [];

		commaSegments.forEach((commaSegment) => {
			let dotSegments = commaSegment.split(". ");
			let dedupedDotSegments = [];

			dotSegments.forEach((segment) => {
				if (!dedupedDotSegments.includes(segment))
					dedupedDotSegments.push(segment);
			});

			let normalizedSegment = dedupedDotSegments.join(". ");
			if (!dedupedCommaSegments.includes(normalizedSegment))
				dedupedCommaSegments.push(normalizedSegment);
		});

		dedupedLines.push(dedupedCommaSegments.join(", "));
	});

	return dedupedLines.join("\n");
}