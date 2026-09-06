import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import { ThemeProvider } from "./context/ThemeContext";

import ProtectedPlayRoute from "./components/ProtectedPlayRoute";
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
					<AuthModalProvider>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route
								path="/exercise/:mode/:num"
								element={
									<ProtectedPlayRoute>
										<Exercise />
									</ProtectedPlayRoute>
								}
							/>
							<Route
								path="/exercise/:mode"
								element={
									<ProtectedPlayRoute>
										<Exercise />
									</ProtectedPlayRoute>
								}
							/>
							<Route path="/about" element={<About />} />
							<Route path="/forms" element={<Forms />} />
							<Route
								path="/levels"
								element={
									<ProtectedPlayRoute>
										<Levels />
									</ProtectedPlayRoute>
								}
							/>
							<Route
								path="/tutorials"
								element={
									<ProtectedPlayRoute>
										<Tutorials />
									</ProtectedPlayRoute>
								}
							/>
							<Route path="/login" element={<Login />} />
							<Route path="/register" element={<Register />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/leaderboard" element={<Leaderboard />} />
							<Route path="/admin" element={<Admin />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</AuthModalProvider>
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	);
};

export default App;