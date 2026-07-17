import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from "./pages/About";
import Exercise from "./pages/Exercise";
import Forms from "./pages/Forms";
import Home from "./pages/Home";
import Levels from "./pages/Levels";
import NotFound from "./pages/NotFound";

const App = () => {
	let url_add = "";
	if (import.meta.env.DEV)
		url_add = "http://localhost:80";

	if (!import.meta.env.DEV)
	{
		fetch(url_add + "/getDatabase")
			.then((response) => response.json())
			.then((data) => console.log(data[0][1]));
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" exact element={<Home />} />
				<Route path="/Exercise/:mode/:num" exact element={<Exercise />} />
				<Route path="/Exercise/:mode" exact element={<Exercise />} />
				<Route path="/About" exact element={<About />} />
				<Route path="/Forms" exact element={<Forms />} />
				<Route path="/Levels" exact element={<Levels />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;