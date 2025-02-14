// /lib/api_client/adminUsers.ts

/**
 * Fetch all admin users.
 * @returns A promise that resolves to an object containing the list of admin users.
 */
export async function fetchAdminUsers(): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/adminUsers",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch admin users");
	}
	const data = await response.json();
	console.log(data.admins);
	return data.admins;
}

/**
 * Retrieve details for a specific admin user by ID.
 * @param id - The ID of the admin user.
 * @returns A promise that resolves to the admin user details.
 */
export async function fetchAdminUser(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/adminUsers/${id}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to fetch admin user details"
		);
	}
	return response.json();
}

/**
 * Create a new admin user.
 * @param data - The admin user data.
 * @returns A promise that resolves to the created admin user.
 */
export async function createAdminUser(data: {
	email: string;
	password: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	role_id: number;
	timezone?: string;
	mfa_enabled?: boolean;
	mfa_method?: string | null;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/adminUsers",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to create admin user");
	}
	return response.json();
}

/**
 * Update an existing admin user.
 * @param id - The ID of the admin user to update.
 * @param data - The admin user fields to update.
 * @returns A promise that resolves to the updated admin user.
 */
export async function updateAdminUser(data: {
	id: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	timezone?: string;
	mfa_enabled?: boolean;
	mfa_method?: string | null;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	console.log(data);
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/adminUsers/${data.id}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update admin user");
	}
	return response.json();
}

/**
 * Delete an admin user.
 * @param id - The ID of the admin user to delete.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteAdminUser(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/adminUsers/${id}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete admin user");
	}
	return response.json();
}
