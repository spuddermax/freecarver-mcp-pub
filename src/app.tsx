import { useState, useEffect, useCallback } from "react";
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import UserEdit from "./pages/userEdit";
import Users from "./pages/users";
import Products from "./pages/products";
import { GridContext, useGridProvider } from "./lib/grid";
import NotFound from "./pages/notFound";
import { decodeJWT, isUnProtectedRoute } from "./lib/helpers";
function App() {
	const [session, setSession] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const gridState = useGridProvider();
	const navigate = useNavigate();
	const location = useLocation();

	// Check for a JWT token in localStorage; if found, and not expired consider the user as logged in.
	const checkSession = useCallback(() => {
		const token = localStorage.getItem("jwtToken");
		const decoded = token ? decodeJWT(token) : null;
		let isExpired = false;

		if (token && decoded) {
			setSession({ token, decoded });
			if (decoded.exp < Date.now() / 1000) {
				isExpired = true;
				localStorage.removeItem("jwtToken");
			}
		} else {
			setSession(null);
		}
		if ((!token || isExpired) && !isUnProtectedRoute(location.pathname)) {
			navigate("/login");
			return;
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
						<Route path="/products" element={<Products />} />
						<Route
							path="/useredit/:targetId"
							element={<UserEdit />}
						/>
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
						<Route
							path="/products"
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
