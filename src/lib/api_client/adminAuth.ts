// /lib/api_client/adminAuth.ts

/**
 * Login the admin user.
 * @param email - The email of the admin user.
 * @param password - The password of the admin user.
 * @returns A promise that resolves to the login data (e.g., JWT token).
 */
export async function adminLogin(
	email: string,
	password: string
): Promise<any> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/adminAuth/login",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Admin login failed");
	}

	return response.json();
}

/**
 * Retrieve the currently authenticated admin's details.
 * @returns A promise that resolves to the admin data.
 */
export async function getCurrentAdmin(): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/adminAuth/me",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to fetch current admin details"
		);
	}

	return response.json();
}
