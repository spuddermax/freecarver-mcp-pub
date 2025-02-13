// /lib/api_client/system.ts

/**
 * Fetch all system preferences.
 * @returns A promise that resolves to an object containing the preferences.
 */
export async function getPreferences(): Promise<any> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/system/preferences"
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to fetch system preferences"
		);
	}
	return response.json();
}

/**
 * Update a system preference by key.
 * @param key - The key of the preference to update.
 * @param value - The new value to set.
 * @returns A promise that resolves to the updated preference.
 */
export async function updatePreference(
	key: string,
	value: string
): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/system/preferences/${key}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ value }),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to update system preference"
		);
	}
	return response.json();
}

/**
 * Retrieve audit logs.
 * @returns A promise that resolves to an object containing the audit logs.
 */
export async function getAuditLogs(): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/system/audit-logs",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch audit logs");
	}
	return response.json();
}

/**
 * Retrieve the status of the database.
 * @returns A promise that resolves to an object containing the database status.
 */
export async function getDatabaseStatus(): Promise<any> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/system/database-status"
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch database status");
	}
	return response.json();
}
