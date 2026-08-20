import { useState } from "react";
import { gameInput, ensureDeckIds } from "../domain/gameInput";


/**
 * Gère l'import et l'export du jeu au format fichier JSON.
 *
 * @param {Card[][]} game - état actuel du jeu
 * @param {Function} setGame - setter React du jeu
 *
 * @returns {{openFileJson: string, gameOutput: Function, saveAsFile: Function, openFile: Function}}
 */
export function useGameFile(game, setGame)
{
	const [openFileJson, setOpenFileJson] = useState("");

	/**
	 * Transforme toutes les cartes en objets (avec seulement les informations essentielles)
	 * pour préparer l'export JSON.
	 */
	const gameOutput = () => {
		let fileData = [[], []];

		game.forEach(function (deck, index) {
			deck.forEach(function (card) {
				fileData[index].push(card.toFile());
			});
		});

		return fileData;
	};

	/**
	 * Télécharge l'état actuel du jeu au format JSON sur l'ordinateur de l'utilisateur.
	 */
	const saveAsFile = () => {
		let fileData;

		fileData = gameOutput();
		const blob = new Blob([JSON.stringify(fileData)], { type: "text/json;charset=utf-8;", });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		if (openFileJson !== "")
			link.download = openFileJson;
		else
			link.download = "output.json";

		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	};

	/**
	 * Ouvre un fichier JSON et l'affiche à l'écran.
	 *
	 * @param {Event} event - le bouton qui ouvre les fichiers ({@link event.target.files})
	 */
	const openFile = (event) => {
		if (event.target.files.length > 0)
		{
			let reader = new FileReader();
			setOpenFileJson(event.target.files[0].name);

			reader.onload = (event) => {
				try
				{
					let obj = JSON.parse(event.target.result);
					setGame(ensureDeckIds(gameInput(obj)));
				}
				catch (error)
				{
					console.error("Erreur lors du chargement du fichier :", error);
				}
			};

			reader.readAsText(event.target.files[0]);
		}
	};

	return { openFileJson, gameOutput, saveAsFile, openFile };
}