// /api/utils/cloudflare.js

/**
 * Extracts the image ID from a Cloudflare R2 URL
 * @param {string} url - The Cloudflare image URL
 * @returns {string|null} - The extracted image ID or null if not valid
 */
export function extractImageIdFromUrl(url) {
	if (!url) return null;

	try {
		// Extract the path after R2 domain
		// Example URL: https://bucket-name.account-id.r2.cloudflarestorage.com/avatars/filename.jpg
		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split("/");

		// Remove first empty element from the split
		if (pathParts[0] === "") {
			pathParts.shift();
		}

		// If we have avatar path and filename, join them back
		if (pathParts.length >= 2) {
			return pathParts.join("/");
		}

		return null;
	} catch (error) {
		console.error("Error extracting image ID from URL:", error);
		return null;
	}
}

/**
 * Validates if a URL is a valid Cloudflare R2 URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export function isValidCloudflareUrl(url) {
	if (!url) return false;

	try {
		const urlObj = new URL(url);
		return urlObj.hostname.includes("r2.cloudflarestorage.com");
	} catch (error) {
		return false;
	}
}
