import React from "react";
import { NavLink } from "react-router-dom";

const PopupForms = () => {
	return (
		<div className="popupForms-box">
			<div className="bigbox">
				<div className="box">
					<NavLink to="/Forms">Votre avis nous intéresse</NavLink>
				</div>
			</div>
		</div>
	);
};

export default PopupForms;