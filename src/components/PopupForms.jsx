import React from "react";
import { NavLink } from "react-router-dom";

const PopupForms = props => {
	return (
		<div className="popupForms-box">
			<div className="bigbox" style={{ width: props.size + "%" }}>
				<div className="box">
					<NavLink exact="true" to="/Forms">Votre avis nous intéresse</NavLink>
				</div>
			</div>
		</div>
	);
};

export default PopupForms;