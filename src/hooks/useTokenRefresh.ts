import { useEffect } from "react";
import { refreshAdminToken } from "../lib/api_client/adminAuth";
import { decodeJWT } from "../lib/helpers";

export function useTokenRefresh(isUserActive: boolean) {
	useEffect(() => {
		if (isUserActive) {
			// Check every 10 seconds.
			const interval = setInterval(async () => {
				const token = localStorage.getItem("jwtToken");
				if (!token) return;
				const decoded = decodeJWT(token);
				const expirationTime = decoded.exp * 1000; // decoded.exp is in seconds
				const remainingTime = expirationTime - Date.now();
				// Only refresh if less than 1 minute remains.
				if (remainingTime < 60 * 1000) {
					try {
						const newTokenData = await refreshAdminToken();
						localStorage.setItem("jwtToken", newTokenData.token);
					} catch (error) {
						console.error("Failed to refresh token:", error);
					}
				}
			}, 10 * 1000);
			return () => clearInterval(interval);
		}
	}, [isUserActive]);
}
