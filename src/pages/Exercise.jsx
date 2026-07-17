import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Game from "../components/Game";
import Navigation from "../components/Navigation";
import PopupForms from "../components/PopupForms";

const Exercise = () => {
	const [num, setNum] = useState();
	let tmpNum = useParams().num;
	let mode = useParams().mode;
	const [ex, setEx] = useState();
	const navigate = useNavigate();
	const nbExo = 36;
	const nbTuto = 7;
	const [nbExoConfondu, setNbExoConfondu] = useState(0);

	useEffect(() => {
		let tmpEx = [];
		if (mode === "Play" && tmpNum <= nbExo)
		{
			setNbExoConfondu(nbExo);
			setNum(tmpNum);

			fetch("json/exos_feuilles/ex" + tmpNum + ".json")
				.then((response) => response.text())
				.then((data) => {
					tmpEx = JSON.parse(data);
					setEx(tmpEx);
				});
		}
		else if (mode === "Tutorial" && tmpNum <= nbTuto)
		{
			setNbExoConfondu(nbTuto);
			setNum(tmpNum);

			fetch("json/tutoriel/tuto" + tmpNum + ".json")
				.then((response) => response.text())
				.then((data) => {
					tmpEx = JSON.parse(data);
					setEx(tmpEx);
				});
		}
		else if (mode === "Create" && tmpNum === undefined)
			setEx([[], []]);
		else
			navigate("/NotFound");
	}, [tmpNum, mode]);

	return (
		<div className="home">
			<Navigation />
			{ex !== undefined && (
				<Game
					mode={mode}
					ex={ex}
					numero={num - 1}
					nbExo={nbExoConfondu}
				/>
			)}
			<PopupForms />
		</div>
	);
};

export default Exercise;