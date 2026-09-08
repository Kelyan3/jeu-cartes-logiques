import Navigation from "../components/Navigation";
import { PopupForms } from "../components/Modals";
import Choice from "../components/Choice";

const Tutorials = () => {
	return (
		<div className="home">
			<Navigation />
			<Choice mode="Tutorial" />
			<PopupForms />
		</div>
	);
};

export default Tutorials;