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
 * Upload the admin user's avatar to Cloudflare Images with R2 storage
 * @param file - The file to upload
 * @param userId - The ID of the user whose avatar is being updated
 * @param currentUrl - The current url of the avatar
 * @returns The response from the Cloudflare avatar upload endpoint
 */
export async function uploadAvatarToCloudflare(
	file: File,
	userId: number,
	currentUrl?: string
): Promise<{ status: string; message: string; data: { publicUrl: string } }> {
	const formData = new FormData();
	formData.append("avatar", file);
	if (currentUrl) {
		formData.append("oldAvatarUrl", currentUrl);
	}

	// Always include userId in the request
	formData.append("userId", userId.toString());

	// Add a field to indicate we want to use Cloudflare
	formData.append("storage", "cloudflare");

	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/cloudflare-avatar",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: formData,
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Cloudflare avatar upload failed");
	}
	return response.json();
}

/**
 * Upload a category hero image to Cloudflare R2 storage
 * @param file - The image file to upload
 * @param categoryId - The ID of the category for which the hero image is being uploaded
 * @param currentUrl - The current url of the hero image, if exists
 * @returns The response with the public URL of the uploaded image
 */
export async function uploadCategoryHeroToCloudflare(
	file: File,
	categoryId: number,
	currentUrl?: string
): Promise<{ status: string; message: string; data: { publicUrl: string } }> {
	const formData = new FormData();
	// Use "avatar" field name as that's what the endpoint expects
	formData.append("avatar", file);
	
	if (currentUrl) {
		formData.append("oldAvatarUrl", currentUrl);
	}

	// Include categoryId in the request (use userId parameter of the existing endpoint)
	// This will be used in the filename on the server
	formData.append("userId", categoryId.toString());
	
	// Add a field to indicate we want to use Cloudflare
	formData.append("storage", "cloudflare");
	
	// IMPORTANT: Specify this is a category hero image, not a user avatar
	// This is required for the backend to use the correct naming convention and database update
	formData.append("imageType", "category_hero");

	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/cloudflare-avatar",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: formData,
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Cloudflare hero image upload failed");
	}
	
	// After uploading with the standard endpoint, we need to update the product_categories table
	// with the new URL. We'll do this in the component that calls this function.
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

/**
 * Delete an image from Cloudflare R2 storage
 * @param imageUrl - The URL of the image to delete
 * @param imageType - The type of image ('avatar', 'category_hero', etc.)
 * @param entityId - ID of the associated entity (user ID, category ID, etc.)
 * @returns The response from the delete operation
 */
export async function deleteImageFromCloudflare(
	imageUrl: string,
	imageType: string,
	entityId: number
): Promise<{ status: string; message: string }> {
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/cloudflare-image",
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
			},
			body: JSON.stringify({
				imageUrl,
				imageType,
				entityId
			}),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Cloudflare image deletion failed");
	}
	
	return response.json();
}

/**
 * Uploads a product media file to Cloudflare
 * @param file - The file to be uploaded
 * @param productId - The ID of the product for which the media is being uploaded
 * @param mediaId - The ID of the media item (to use in filename)
 * @param currentUrl - The current url of the media, if exists
 * @returns The response with the public URL of the uploaded image
 */
export async function uploadProductMediaToCloudflare(
	file: File,
	productId: number,
	mediaId: string,
	currentUrl?: string
): Promise<{ status: string; message: string; data: { publicUrl: string } }> {
	const formData = new FormData();
	// Use "avatar" field name as that's what the endpoint expects
	formData.append("avatar", file);
	
	if (currentUrl) {
		formData.append("oldAvatarUrl", currentUrl);
	}

	// Include productId in the request (use userId parameter of the existing endpoint)
	// This will be used in the filename on the server
	formData.append("userId", productId.toString());
	
	// Include mediaId to ensure unique filenames within a product
	formData.append("mediaId", mediaId);
	
	// Add a field to indicate we want to use Cloudflare
	formData.append("storage", "cloudflare");
	
	// IMPORTANT: Specify this is a product media image, not a user avatar
	// This is required for the backend to use the correct naming convention and database update
	formData.append("imageType", "product_media");

	const response = await fetch(
		import.meta.env.VITE_API_URL + "/api/admin/cloudflare-avatar",
		{
			method: "POST",
			headers: {
				Authorization: "Bearer " + localStorage.getItem("jwtToken"),
			},
			body: formData,
		}
	);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Failed to upload product media to Cloudflare");
	}

	return data;
}
