// /api/services/cloudflare.js

import fetch from "node-fetch";
import FormData from "form-data";
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { extractImageIdFromUrl } from "../utils/cloudflare.js";

// Move S3Client initialization into a function so it's created fresh with each request
function getS3Client() {
	console.log("Creating S3 client with these environment variables:");
	console.log("CLOUDFLARE_ACCOUNT_ID:", process.env.CLOUDFLARE_ACCOUNT_ID);
	console.log(
		"CLOUDFLARE_R2_ACCESS_KEY_ID exists:",
		!!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
	);
	console.log(
		"CLOUDFLARE_R2_SECRET_ACCESS_KEY exists:",
		!!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
	);

	if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
		throw new Error(
			"CLOUDFLARE_ACCOUNT_ID environment variable is not set"
		);
	}

	if (
		!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
		!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
	) {
		throw new Error(
			"Cloudflare R2 credentials are not properly configured"
		);
	}

	return new S3Client({
		region: "auto",
		endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
			secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
		},
	});
}

const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

function getBucketName() {
	console.log(
		"Getting bucket name, env value:",
		process.env.CLOUDFLARE_R2_BUCKET_NAME
	);
	const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
	if (!bucketName) {
		console.error(
			"CLOUDFLARE_R2_BUCKET_NAME environment variable is not set"
		);
		throw new Error("Cloudflare R2 bucket name is not configured");
	}
	return bucketName;
}

/**
 * Uploads an image to Cloudflare Images with R2 storage
 * @param {Buffer} buffer - The image file buffer
 * @param {Object} options - Upload options
 * @param {string} options.filename - The filename for the image
 * @param {string} options.adminId - Admin ID for tracking purposes
 * @param {string} [options.oldImageUrl] - URL of old image to delete
 * @returns {Promise<{publicUrl: string, id: string}>} The upload result with public URL
 */
export async function uploadToCloudflare(buffer, options) {
	console.log("uploadToCloudflare called with options:", {
		...options,
		buffer: "BUFFER_CONTENT_OMITTED",
	});
	console.log("Environment variables:");
	console.log("NODE_ENV:", process.env.NODE_ENV);
	console.log("CLOUDFLARE_ACCOUNT_ID:", process.env.CLOUDFLARE_ACCOUNT_ID);
	console.log(
		"CLOUDFLARE_R2_BUCKET_NAME:",
		process.env.CLOUDFLARE_R2_BUCKET_NAME
	);

	try {
		// If there's an old image, delete it first
		if (options.oldImageUrl) {
			try {
				await deleteFromCloudflare(options.oldImageUrl);
			} catch (deleteError) {
				console.error(
					"Failed to delete old image, continuing with upload:",
					deleteError
				);
				// Continue with upload even if delete fails
			}
		}

		// Get a fresh S3 client for this request
		const s3Client = getS3Client();

		// First, upload to R2 storage
		const r2Key = `avatars/${options.filename}`;
		const bucketName = getBucketName();

		console.log(`Uploading to bucket: ${bucketName}, key: ${r2Key}`);

		await s3Client.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: r2Key,
				Body: buffer,
				ContentType: "image/jpeg", // Assuming JPEG for simplicity, adjust if needed
			})
		);

		// Generate a public URL for the R2 object using env variable
		const publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN;
		const publicUrl = `https://${publicDomain}/${r2Key}`;

		return {
			publicUrl,
			id: r2Key,
		};
	} catch (error) {
		console.error("Error in uploadToCloudflare:", error);
		throw new Error(`Failed to upload to Cloudflare: ${error.message}`);
	}
}

/**
 * Deletes an image from Cloudflare R2 storage
 * @param {string} imageUrl - The URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteFromCloudflare(imageUrl) {
	try {
		const imageKey = extractImageIdFromUrl(imageUrl);

		if (!imageKey) {
			throw new Error("Invalid image URL");
		}

		// Get a fresh S3 client for this request
		const s3Client = getS3Client();
		const bucketName = getBucketName();

		console.log(`Deleting from bucket: ${bucketName}, key: ${imageKey}`);

		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: imageKey,
			})
		);

		return { success: true };
	} catch (error) {
		console.error("Error in deleteFromCloudflare:", error);
		throw new Error(`Failed to delete from Cloudflare: ${error.message}`);
	}
}
