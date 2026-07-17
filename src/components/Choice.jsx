import React, { use } from "react";
import { useNavigate } from "react-router-dom";

const Choice = () => {
	/**
	 * Nombre de niveaux.
	 */
	const jsonCount = 36;

	/**
	 * Chapitrage.
	 */
	const difficulty = [
		[1, 20, "Démonstrations"],
		[21, 35, "Raisonnements"],
		[36, 40, "Autres"],
	];

	const navigate = useNavigate();

	/**
	 * Navigue vers la page du niveau.
	 * 
	 * @param {Event} event
	 */
	function goToExo(event)
	{
		const url = event.target.getAttribute("url");
		navigate(url);
	}

	/**
	 * Crée une ligne de niveaux à afficher.
	 * 
	 * @param {number} start - Le premier niveau de la ligne.
	 * @param {number} end - Le dernier niveau de la ligne.
	 * 
	 * @returns {JSX.Element} La ligne.
	 */
	const createRow = (start, end) => {
		let row = [];
		for (let index = start; index < end; index++)
		{
			if (index < jsonCount)
			{
				row.push(
					<td
						key={index}
						onClick={goToExo}
						url={"/Exercise-Play-" + (index + 1)}
					>
						<p url={"/Exercise-Play-" + (index + 1)}>Niveau {index + 1}</p>
					</td>
				);
			}
			else
			{
				row.push(
					<td key={index} className="tdVoid">
						<p>Niveau XX</p>
					</td>
				);
			}
		}

		return <tr key={start + "-" + end}>{row}</tr>;
	}

	/**
	 * Renvoie la liste de choix des niveaux.
	 * 
	 * @param {*} props - Attributs?
	 * 
	 * @returns {JSX.Element[]}
	 */
	function AfficheChoice(props)
	{
		const res = [];
		difficulty.forEach((category, index) => {
			let table = [];
			let y = 1;
			res.push(<h2 key={"h-" + index}>{category[2]}</h2>);

			for (let i = category[0] - 1; i <= category[1] - 1; i++)
			{
				if (i + 5 >= category[1] && y === 1)
				{
					table.push(createRow(i, category[1]));
					y = 5;
				}
				else if (i < category[1] && y === 1)
				{
					table.push(createRow(i, i + 5));
					y = 5;
				}
				else
					y--;
			}

			res.push(
				<table key={category[2]}>
					<tbody>{table}</tbody>
				</table>
			);
		});

		return res;
	}

	return (
		<div className="choice">
			<AfficheChoice></AfficheChoice>
		</div>
	);
};

export default Choice;