import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import About from "./pages/About";
import Exercise from "./pages/Exercise";
import Forms from "./pages/Forms";
import Home from "./pages/Home";
import Levels from "./pages/Levels";
import Tutorials from "./pages/Tutorials";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";

const App = () => {
	return (
		<ThemeProvider>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" exact element={<Home />} />
						<Route path="/Exercise/:mode/:num" exact element={<Exercise />} />
						<Route path="/Exercise/:mode" exact element={<Exercise />} />
						<Route path="/About" exact element={<About />} />
						<Route path="/Forms" exact element={<Forms />} />
						<Route path="/Levels" exact element={<Levels />} />
						<Route path="/Tutorials" exact element={<Tutorials />} />
						<Route path="/Login" exact element={<Login />} />
						<Route path="/Register" exact element={<Register />} />
						<Route path="/Profile" exact element={<Profile />} />
						<Route path="/Leaderboard" exact element={<Leaderboard />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	);
};

export default App;