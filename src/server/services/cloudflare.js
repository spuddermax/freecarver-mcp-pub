const fetch = require("node-fetch");
const FormData = require("form-data");

/**
 * Cloudflare Images and R2 integration service
 */
class CloudflareService {
	constructor() {
		// Get Cloudflare credentials from environment variables
		this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
		this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
		this.r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
		this.r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
		this.r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
		this.imagesBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;

		// Validate required environment variables
		if (!this.accountId || !this.apiToken) {
			console.error(
				"Missing Cloudflare credentials in environment variables"
			);
		}
	}

	/**
	 * Upload an image to Cloudflare Images
	 * @param {Buffer} fileBuffer - The image file buffer
	 * @param {Object} options - Upload options
	 * @param {string} options.filename - The filename to use
	 * @param {string} options.adminId - The admin ID for tracking purposes
	 * @param {string} options.oldImageUrl - The URL of the old image to delete (optional)
	 * @returns {Promise<Object>} The upload result with publicUrl
	 */
	async uploadImage(fileBuffer, { filename, adminId, oldImageUrl }) {
		try {
			// Delete old image if URL is provided
			if (oldImageUrl && oldImageUrl.includes("cloudflare")) {
				try {
					await this.deleteImage(
						this.extractImageIdFromUrl(oldImageUrl)
					);
				} catch (deleteError) {
					console.warn(
						"Could not delete old image:",
						deleteError.message
					);
					// Continue with upload even if delete fails
				}
			}

			// Create form data with the file and metadata
			const formData = new FormData();
			formData.append("file", fileBuffer, { filename });
			formData.append("metadata", JSON.stringify({ adminId }));
			formData.append("requireSignedURLs", "false");

			// Upload image to Cloudflare Images
			const response = await fetch(this.imagesBaseUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Cloudflare API error: ${JSON.stringify(errorData)}`
				);
			}

			const data = await response.json();

			if (!data.success || !data.result) {
				throw new Error(
					`Cloudflare upload failed: ${JSON.stringify(data)}`
				);
			}

			// Return the public URL and other image details
			return {
				publicUrl: data.result.variants[0],
				id: data.result.id,
				uploadedAt: new Date().toISOString(),
			};
		} catch (error) {
			console.error("Error in Cloudflare image upload:", error);
			throw error;
		}
	}

	/**
	 * Delete an image from Cloudflare Images
	 * @param {string} imageId - The Cloudflare image ID to delete
	 * @returns {Promise<boolean>} Whether the deletion was successful
	 */
	async deleteImage(imageId) {
		if (!imageId) return false;

		try {
			const response = await fetch(`${this.imagesBaseUrl}/${imageId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Cloudflare delete error: ${JSON.stringify(errorData)}`
				);
			}

			const data = await response.json();
			return data.success === true;
		} catch (error) {
			console.error("Error deleting Cloudflare image:", error);
			throw error;
		}
	}

	/**
	 * Extract the image ID from a Cloudflare Images URL
	 * @param {string} url - The Cloudflare image URL
	 * @returns {string|null} The image ID, or null if not found
	 */
	extractImageIdFromUrl(url) {
		if (!url) return null;

		// Extract image ID from URL - this pattern may need adjustment based on your actual URL format
		// Example Cloudflare Images URL: https://imagedelivery.net/abcdefg/123456/public
		const match = url.match(/\/([^\/]+)\/public/);
		return match ? match[1] : null;
	}
}

module.exports = new CloudflareService();
