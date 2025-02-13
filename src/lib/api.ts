// API utility functions
// API url is set in the .env file

/**
 * Verify the database connection
 * @returns True if the database connection is successful, false otherwise
 */
export async function verifyDatabaseConnection() {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/validate_database"
	);
	return response.ok;
}

/**
 * Login the admin user
 * @param email - The email of the admin user
 * @param password - The password of the admin user
 * @returns The response from the login endpoint
 */
export async function adminLogin(email: string, password: string) {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/login",
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
		throw new Error(errorData.error || "Login failed");
	}

	return response.json();
}

/**
 * Fetch the user data
 * @param uuid - The uuid of the user
 * @returns The response from the user data endpoint
 */
export async function fetchUserData(uuid: string) {
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/api/users/${uuid}`
	);
	if (!response.ok) {
		throw new Error("User data could not be fetched");
	}
	return response.json();
}

/**
 * Fetch the admin users
 * @returns The response from the admin users endpoint
 */
export async function fetchAdminUsers() {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/users",
		{
			headers: {
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
		}
	);
	if (!response.ok) {
		throw new Error("Admin users could not be fetched");
	}
	return response.json();
}

/**
 * Upload the admin user's avatar
 * @param file - The file to upload
 * @param currentUrl - The current url of the avatar
 * @returns The response from the avatar upload endpoint
 */
export async function uploadAvatar(
	file: File,
	currentUrl?: string
): Promise<{ publicUrl: string }> {
	const formData = new FormData();
	formData.append("avatar", file);
	if (currentUrl) {
		formData.append("oldAvatarUrl", currentUrl);
	}
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/avatar",
		{
			method: "POST",
			headers: {
				// When using formData, let the browser set the Content-Type header.
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: formData,
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Avatar upload failed");
	}
	return response.json();
}

/**
 * Update the user preferences
 * @param preferences - The preferences to update
 */
export async function updateUserPreferences(preferences: {
	twoFactorEnabled: boolean;
	notificationsEnabled: boolean;
	notificationPreference: string;
	timezone: string;
}): Promise<void> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/user/preferences",
		{
			method: "PUT", // or PATCH, depending on your API design
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify(preferences),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update preferences");
	}
}

/**
 * Validate the password
 * @param email - The email of the admin user
 * @param password - The password of the admin user
 * @returns True if the password is valid, false otherwise
 */
export async function validatePassword(
	email: string,
	password: string
): Promise<boolean> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/validate-password",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify({ email, password }),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Password validation failed");
	}
	const result = await response.json();
	// Assume the API returns an object like { valid: true }
	return result.valid;
}

/**
 * Update the user password
 * @param newPassword - The new password of the admin user
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/update-password",
		{
			method: "PUT", // or PATCH, depending on your API design
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify({ newPassword }),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update password");
	}
}

/**
 * Update the user personal details
 * @param details - The details to update
 */
export async function updateUserPersonalDetails(details: {
	firstName: string;
	lastName: string;
	phoneNumber: string;
}): Promise<void> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/user/personal",
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify(details),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update personal details");
	}
}

/**
 * Update the user email
 * @param email - The email of the admin user
 */
export async function updateUserEmail(email: string): Promise<void> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/user/email",
		{
			method: "PUT", // or PATCH, based on your API design
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify({ email }),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update email");
	}
}
