import React from "react";
import Navigation from "../components/Navigation";

const NotFound = () => {
	return (
		<div>
			<Navigation />
			<div id="notFound">
				<h1>Not Found</h1>
				<p>Désolé, mais cette page n'existe pas.</p>
			</div>
		</div>
	);
};

export default NotFound;