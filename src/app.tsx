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
import ProductEdit from "./pages/productEdit";
import { GridContext, useGridProvider } from "./lib/grid";
import NotFound from "./pages/notFound";
import { decodeJWT, isUnProtectedRoute } from "./lib/helpers";
import { Modal } from "./components/Modal";
import { X, LogIn } from "lucide-react";

function App() {
	const [session, setSession] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
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
			if (isExpired) {
				setShowTokenExpiredModal(true);
			} else {
				navigate("/login");
			}
		} else {
			setIsLoading(false);
		}
	}, [navigate, location.pathname]);

	useEffect(() => {
		checkSession();
	}, [checkSession]);

	const handleLogin = () => {
		navigate("/dashboard");
	};

	const handleLoginRedirect = () => {
		setShowTokenExpiredModal(false);
		navigate("/login");
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
			</div>
		);
	}

	return (
		<>
			{showTokenExpiredModal && (
				<Modal
					isOpen={showTokenExpiredModal}
					title="Session Expired"
					onClose={() => setShowTokenExpiredModal(false)}
				>
					<div className="p-4">
						<h2 className="text-xl font-bold mb-2">
							Session Expired
						</h2>
						<p>
							Your session has expired. Would you like to log in
							again?
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<button
								onClick={() => setShowTokenExpiredModal(false)}
								className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded"
							>
								<X className="h-4 w-4" />
								Cancel
							</button>
							<button
								onClick={handleLoginRedirect}
								className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded"
							>
								<LogIn className="h-4 w-4" />
								Login
							</button>
						</div>
					</div>
				</Modal>
			)}
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
							<Route
								path="/productedit/:targetId"
								element={<ProductEdit />}
							/>
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
							<Route
								path="/productedit"
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
		</>
	);
}

export default App;
