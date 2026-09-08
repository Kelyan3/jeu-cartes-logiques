import Navigation from "../components/Navigation";
import { PopupForms } from "../components/Modals";
import Choice from "../components/Choice";


const Levels = () => {
	return (
		<div className="home">
			<Navigation />
			<Choice mode="Play" />
			<PopupForms />
		</div>
	);
};

export default Levels;