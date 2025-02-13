// API utility functions
// API url is set in the .env file

// Verify database connection
export async function verifyDatabaseConnection() {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/validate_database"
	);
	console.log(response);
	return response.ok;
}

// Login
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

export async function fetchUserData(uuid: string) {
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/api/users/${uuid}`
	);
	if (!response.ok) {
		throw new Error("User data could not be fetched");
	}
	return response.json();
}

export async function fetchUsers() {
	const response = await fetch(import.meta.env.VITE_API_URL + "/api/users");
	if (!response.ok) {
		throw new Error("Users could not be fetched");
	}
	return response.json();
}

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

// /lib/api.ts
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

// /lib/api.ts
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

// /lib/api.ts
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
