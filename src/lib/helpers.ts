// Helper function to decode a JWT token
// (In production, consider using a dedicated library like jwt-decode)
export function decodeJWT(token: string) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map(
					(c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
				)
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch (err) {
		console.error("Error decoding token:", err);
		return null;
	}
}

/**
 * Helper function to decide which routes should be protected from unauthenticated users.
 */
export const isProtectedRoute = (pathname: string) => {
	const protectedRoutes = ["/", "/dashboard", "/users"];
	return protectedRoutes.includes(pathname);
};
