// /api/routes/v1/adminAvatar.js

import express from "express";
import multer from "multer";
import { verifyJWT as authenticate } from "../../middleware/auth.js";
import {
	uploadToCloudflare,
	deleteFromCloudflare,
} from "../../services/cloudflare.js";
import { pool } from "../../db.js"; // Import the database pool correctly

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB limit
	},
});

/**
 * @api {post} /api/admin/cloudflare-avatar Upload images to Cloudflare R2
 * @apiName UploadCloudflareImage
 * @apiGroup Admin
 * @apiDescription Uploads images (avatars, category hero images, etc.) to Cloudflare R2 storage and updates the associated database record
 *
 * @apiHeader {String} Authorization JWT token in format: Bearer [token]
 *
 * @apiParam (Request body) {File} avatar The image file to upload (required, max 2MB)
 * @apiParam (Request body) {String} [oldAvatarUrl] URL of the previous image to delete
 * @apiParam (Request body) {Number} [userId] ID of the user or entity being edited
 * @apiParam (Request body) {String} [imageType] Type of image ('avatar', 'category_hero', etc.) - defaults to 'avatar'
 * @apiParam (Request body) {Number} [categoryId] ID of the category when uploading category hero images
 *
 * @apiSuccess {String} publicUrl Public URL of the uploaded image
 * @apiSuccess {String} message Success message
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "message": "Image uploaded successfully to Cloudflare",
 *       "data": {
 *         "publicUrl": "https://bucket-name.account-id.r2.cloudflarestorage.com/images/cat-hero-5.jpg"
 *       }
 *     }
 *
 * @apiError (Error 400) BadRequest No file uploaded or invalid file
 * @apiError (Error 401) Unauthorized Authentication failed or token expired
 * @apiError (Error 500) ServerError Error uploading to Cloudflare or updating database
 */
router.post(
	"/cloudflare-avatar",
	authenticate,
	upload.single("avatar"),
	async (req, res) => {
		try {
			// Check if file exists
			if (!req.file) {
				return res.error("No file uploaded", 400);
			}

			// Extract the admin ID from the auth token
			const adminId = req.admin?.id;

			// Log detailed authentication info for debugging
			req.log("debug", "Authentication details", {
				adminObj: req.admin,
				adminIdFromToken: adminId,
				authHeader: req.headers.authorization?.substring(0, 20) + "...", // Log just beginning of token for security
			});

			// Get image type - default to 'avatar' for backward compatibility
			const imageType = req.body.imageType || 'avatar';
			
			// Handle ID based on image type
			let entityId;
			if (imageType === 'category_hero') {
				// For category hero images, use categoryId if provided, otherwise userId
				entityId = req.body.categoryId || req.body.userId;
				if (!entityId || isNaN(parseInt(entityId, 10))) {
					req.log("error", "No valid categoryId provided for category hero upload");
					return res.error("Category ID is required for category hero upload", 400);
				}
			} else {
				// For avatars, extract from URL if available
				let extractedUserId;
				const urlMatch = req.originalUrl.match(/\/users\/(\d+)/);
				if (urlMatch && urlMatch[1]) {
					extractedUserId = parseInt(urlMatch[1], 10);
					req.log("debug", `Extracted userId ${extractedUserId} from URL`);
				}
				
				// Use userId from body or URL
				entityId = req.body.userId || extractedUserId;
				if (!entityId || isNaN(parseInt(entityId, 10))) {
					req.log("error", "No valid userId provided for avatar upload");
					return res.error("User ID is required for avatar upload", 400);
				}
			}

			// Convert to integer to ensure consistency
			const effectiveEntityId = parseInt(entityId, 10);

			req.log("info", `Using ${imageType === 'category_hero' ? 'category' : 'user'} ID: ${effectiveEntityId} for ${imageType} upload`);

			// Get old image URL if provided
			const oldImageUrl = req.body.oldAvatarUrl;

			// Determine filename based on image type
			let filename;
			switch(imageType) {
				case 'category_hero':
					filename = `cat-hero-${effectiveEntityId}.${req.file.mimetype.split("/")[1]}`;
					break;
				case 'product_media':
					// For product media, include both product ID and media ID for uniqueness
					const mediaId = req.body.mediaId || Date.now().toString();
					filename = `prod-media-${effectiveEntityId}-${mediaId}.${req.file.mimetype.split("/")[1]}`;
					break;
				case 'avatar':
				default:
					filename = `user-${effectiveEntityId}.${req.file.mimetype.split("/")[1]}`;
			}

			// Upload to Cloudflare Images
			const result = await uploadToCloudflare(req.file.buffer, {
				filename: filename,
				adminId: adminId,
				oldImageUrl: oldImageUrl,
				// Pass appropriate ID based on image type
				userId: effectiveEntityId,
			});

			// Update database based on image type
			try {
				if (imageType === 'category_hero') {
					// Update product_categories table for category hero images
					await pool.query(
						"UPDATE product_categories SET hero_image = $1 WHERE id = $2",
						[result.publicUrl, effectiveEntityId]
					);
					req.log("info", `Updated hero_image URL for product category ID ${effectiveEntityId}`);
				} else if (imageType === 'product_media') {
					// For product media, we don't update the database directly
					// The product media is updated through the products PUT endpoint with the complete media array
					req.log("info", `Generated product media URL for product ID ${effectiveEntityId}, media will be saved when the product is updated`);
				} else {
					// Default behavior: update admin_users table for avatars
					await pool.query(
						"UPDATE admin_users SET avatar_url = $1 WHERE id = $2",
						[result.publicUrl, effectiveEntityId]
					);
					req.log("info", `Updated avatar URL for admin ID ${effectiveEntityId}`);
				}
			} catch (dbError) {
				req.log(
					"error",
					`Error updating ${imageType} in DB: ${dbError.message}`,
					{ error: dbError }
				);
				// Continue even if DB update fails - we'll still return the URL
			}

			return res.success(
				{
					publicUrl: result.publicUrl,
				},
				`${imageType === 'avatar' ? 'Avatar' : 'Image'} uploaded successfully to Cloudflare`
			);
		} catch (error) {
			req.log(
				"error",
				`Error uploading to Cloudflare: ${error.message}`,
				{ error }
			);
			return res.error(error.message || "Error uploading image", 500);
		}
	}
);

/**
 * @api {delete} /api/admin/cloudflare-image Delete image from Cloudflare R2
 * @apiName DeleteCloudflareImage
 * @apiGroup Admin
 * @apiDescription Deletes an image from Cloudflare R2 storage without uploading a replacement
 *
 * @apiHeader {String} Authorization JWT token in format: Bearer [token]
 *
 * @apiParam (Request body) {String} imageUrl URL of the image to delete
 * @apiParam (Request body) {String} [imageType] Type of image ('avatar', 'category_hero', etc.)
 * @apiParam (Request body) {Number} [entityId] ID of the user or category
 *
 * @apiSuccess {Object} result Success status and message
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "message": "Image deleted successfully from Cloudflare"
 *     }
 *
 * @apiError (Error 400) BadRequest Missing image URL
 * @apiError (Error 401) Unauthorized Authentication failed or token expired
 * @apiError (Error 500) ServerError Error deleting from Cloudflare or updating database
 */
router.delete(
	"/cloudflare-image",
	authenticate,
	async (req, res) => {
		try {
			const { imageUrl, imageType, entityId } = req.body;

			// Check if image URL is provided
			if (!imageUrl) {
				return res.error("Image URL is required", 400);
			}

			// Extract the admin ID from the auth token
			const adminId = req.admin?.id;

			req.log("info", `Deleting image: ${imageUrl}`);

			// Delete from Cloudflare R2
			await deleteFromCloudflare(imageUrl);

			// If entityId is provided, update the appropriate table
			if (entityId && !isNaN(parseInt(entityId, 10))) {
				const effectiveEntityId = parseInt(entityId, 10);
				
				try {
					if (imageType === 'category_hero') {
						// Update product_categories table for category hero images
						await pool.query(
							"UPDATE product_categories SET hero_image = NULL WHERE id = $1",
							[effectiveEntityId]
						);
						req.log("info", `Cleared hero_image for product category ID ${effectiveEntityId}`);
					} else if (imageType === 'product_media') {
						// For product media, we don't update the database directly
						// The product media is updated through the products PUT endpoint with the complete media array
						req.log("info", `Deleted product media image for product ID ${effectiveEntityId}, media will be updated when the product is saved`);
					} else if (imageType === 'avatar') {
						// Update admin_users table for avatars
						await pool.query(
							"UPDATE admin_users SET avatar_url = NULL WHERE id = $1",
							[effectiveEntityId]
						);
						req.log("info", `Cleared avatar_url for admin ID ${effectiveEntityId}`);
					}
				} catch (dbError) {
					req.log(
						"error",
						`Error updating database after image deletion: ${dbError.message}`,
						{ error: dbError }
					);
					// Continue even if DB update fails
				}
			}

			return res.success(
				{},
				"Image deleted successfully from Cloudflare"
			);
		} catch (error) {
			req.log(
				"error",
				`Error deleting from Cloudflare: ${error.message}`,
				{ error }
			);
			return res.error(error.message || "Error deleting image", 500);
		}
	}
);

export default router;
