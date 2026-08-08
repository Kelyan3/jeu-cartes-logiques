import { NavLink } from "react-router-dom";

const PopupForms = () => {
	return (
		<div className="popupForms-box">
			<div className="bigbox">
				<div className="box">
					<NavLink to="/forms">Votre avis nous intéresse</NavLink>
				</div>
			</div>
		</div>
	);
};

export default PopupForms;