import Navigation from "../components/Navigation";
import { useTheme } from "../context/ThemeContext";


const Settings = () => {
	const { theme, toggleTheme } = useTheme();

	return (
		<div className="forms">
			<Navigation />
			<div id="forms" className="profileCard">
				<span className="eyebrow">Préférences</span>
				<h2>Paramètres</h2>

				<div className="preferencesBlock">
					<label className="themeSwitch">
						<input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
						<span className="themeSwitchTrack"></span>
						<span className="themeSwitchLabel">Mode sombre</span>
					</label>
				</div>
			</div>
		</div>
	);
};

export default Settings;