import { useState, useEffect, useCallback } from "react";
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserEdit from "./pages/UserEdit";
import Users from "./pages/Users";
import { GridContext, useGridProvider } from "./lib/grid";
import NotFound from "./pages/NotFound";
import { isProtectedRoute } from "./lib/helpers";
function App() {
	const [session, setSession] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const gridState = useGridProvider();
	const navigate = useNavigate();
	const location = useLocation();

	// Check for a JWT token in localStorage; if found, consider the user as logged in.
	const checkSession = useCallback(() => {
		const token = localStorage.getItem("jwtToken");
		if (token) {
			setSession({ token });
		} else {
			setSession(null);
		}
		if (!token && isProtectedRoute(location.pathname)) {
			navigate("/login");
		}
		setIsLoading(false);
	}, [navigate, location.pathname]);

	useEffect(() => {
		checkSession();
	}, [checkSession]);

	const handleLogin = () => {
		navigate("/dashboard");
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
			</div>
		);
	}

	return (
		<GridContext.Provider value={gridState}>
			<Routes>
				<Route
					path="/login"
					element={
						session ? (
							<Navigate to="/dashboard" replace />
						) : (
							<Login onLogin={handleLogin} />
						)
					}
				/>
				{session ? (
					<>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/users" element={<Users />} />
						<Route path="/useredit/:uuid" element={<UserEdit />} />
						<Route path="/useredit" element={<UserEdit />} />
					</>
				) : (
					<>
						<Route
							path="/dashboard"
							element={<Navigate to="/login" replace />}
						/>
						<Route
							path="/users"
							element={<Navigate to="/login" replace />}
						/>
					</>
				)}
				<Route
					path="/"
					element={
						<Navigate
							to={session ? "/dashboard" : "/login"}
							replace
						/>
					}
				/>
				<Route path="*" element={<NotFound session={session} />} />
			</Routes>
		</GridContext.Provider>
	);
}

export default App;
