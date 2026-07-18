import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Choice = ({ mode }) => {
	/**
	 * Configuration selon le mode : nombre de niveaux et chapitrage.
	 */
	const config = {
		Play: {
			jsonCount: 36,
			difficulty: [
				[1, 20, "Démonstrations"],
				[21, 35, "Raisonnements"],
				[36, 40, "Autres"],
			],
		},
		Tutorial: {
			jsonCount: 7,
			difficulty: [[1, 7, "Tutoriels"]],
		},
	};

	const { jsonCount, difficulty } = config[mode];

	const navigate = useNavigate();
	const { user } = useAuth();
	const [completedLevels, setCompletedLevels] = useState([]);

	const API = import.meta.env.DEV ? "http://localhost:80" : "";

	useEffect(() => {
		if (!user)
		{
			setCompletedLevels([]);
			return;
		}

		fetch(`${API}/api/progress`, { credentials: "include" })
			.then((response) => response.json())
			.then((data) => {
				const completedNums = data
					.filter((p) => p.mode === mode && p.completed)
					.map((p) => p.num);
				setCompletedLevels(completedNums);
			});
	}, [user, mode]);

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
				const isCompleted = completedLevels.includes(index + 1);
				row.push(
					<td
						key={index}
						onClick={goToExo}
						url={"/Exercise/" + mode + "/" + (index + 1)}
						className={isCompleted ? "levelCompleted" : ""}
					>
						<p url={"/Exercise/" + mode + "/" + (index + 1)}>Niveau {index + 1} {isCompleted && "✓"}</p>
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