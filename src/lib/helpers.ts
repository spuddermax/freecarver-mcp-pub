/**
 * Helper function to decode a JWT token
 * (In production, consider using a dedicated library like jwt-decode)
 * @param token - The JWT token to decode
 * @returns The decoded token payload or null if an error occurs
 */
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
 * Helper function to decide which routes should be not be protected from unauthenticated users.
 * ALL routes are protected from unauthenticated users except for those listed here.
 * @param pathname - The pathname of the current route
 * @returns True if the route is unprotected, false otherwise
 */
export const isUnProtectedRoute = (pathname: string) => {
	const unprotectedRoutes = ["/", "/login"];
	return unprotectedRoutes.includes(pathname);
};
