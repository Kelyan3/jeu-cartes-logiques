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
import Admin from "./pages/Admin";

const App = () => {
	return (
		<ThemeProvider>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/exercise/:mode/:num" element={<Exercise />} />
						<Route path="/exercise/:mode" element={<Exercise />} />
						<Route path="/about" element={<About />} />
						<Route path="/forms" element={<Forms />} />
						<Route path="/levels" element={<Levels />} />
						<Route path="/tutorials" element={<Tutorials />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/leaderboard" element={<Leaderboard />} />
						<Route path="/admin" element={<Admin />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	);
};

export default App;