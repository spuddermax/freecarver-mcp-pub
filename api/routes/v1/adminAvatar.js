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
 * @api {post} /api/admin/cloudflare-avatar Upload admin avatar to Cloudflare R2
 * @apiName UploadCloudflareAvatar
 * @apiGroup Admin
 * @apiDescription Uploads an admin user's avatar image to Cloudflare R2 storage and updates the admin's profile with the new avatar URL
 *
 * @apiHeader {String} Authorization JWT token in format: Bearer [token]
 *
 * @apiParam (Request body) {File} avatar The image file to upload (required, max 2MB)
 * @apiParam (Request body) {String} [oldAvatarUrl] URL of the previous avatar to delete
 * @apiParam (Request body) {Number} [userId] ID of the user being edited (if different from logged-in admin)
 *
 * @apiSuccess {String} publicUrl Public URL of the uploaded avatar image
 * @apiSuccess {String} message Success message
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "message": "Avatar uploaded successfully to Cloudflare",
 *       "data": {
 *         "publicUrl": "https://bucket-name.account-id.r2.cloudflarestorage.com/avatars/1.jpg"
 *       }
 *     }
 *
 * @apiError (Error 400) BadRequest No file uploaded or invalid file
 * @apiError (Error 401) Unauthorized Authentication failed or token expired
 * @apiError (Error 500) ServerError Error uploading to Cloudflare or updating database
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": "error",
 *       "message": "No file uploaded"
 *     }
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

			// For direct user edits, extract userId from URL if available
			// Example: if the request path includes a user ID like /users/5/avatar
			let extractedUserId;
			const urlMatch = req.originalUrl.match(/\/users\/(\d+)/);
			if (urlMatch && urlMatch[1]) {
				extractedUserId = parseInt(urlMatch[1], 10);
				req.log(
					"debug",
					`Extracted userId ${extractedUserId} from URL`
				);
			}

			// Get the user ID from the request body or URL
			const userId = req.body.userId || extractedUserId;

			// Require a valid user ID
			if (!userId || isNaN(parseInt(userId, 10))) {
				req.log("error", "No valid userId provided for avatar upload");
				return res.error("User ID is required for avatar upload", 400);
			}

			// Convert to integer to ensure consistency
			const effectiveUserId = parseInt(userId, 10);

			req.log(
				"info",
				`Using user ID: ${effectiveUserId} for avatar upload`
			);

			// Get old avatar URL if provided
			const oldAvatarUrl = req.body.oldAvatarUrl;

			// Upload to Cloudflare Images
			const result = await uploadToCloudflare(req.file.buffer, {
				// Use a specific naming convention with the user ID
				filename: `user-${effectiveUserId}.${
					req.file.mimetype.split("/")[1]
				}`,
				adminId: adminId,
				oldImageUrl: oldAvatarUrl,
				userId: effectiveUserId,
			});

			// Update admin profile with new avatar URL in database
			try {
				// Use the imported pool instead of req.db
				await pool.query(
					"UPDATE admin_users SET avatar_url = $1 WHERE id = $2",
					[result.publicUrl, effectiveUserId]
				);

				req.log(
					"info",
					`Updated avatar URL for admin ID ${effectiveUserId}`
				);
			} catch (dbError) {
				req.log(
					"error",
					`Error updating admin user avatar in DB: ${dbError.message}`,
					{ error: dbError }
				);
				// Continue even if DB update fails - we'll still return the URL
			}

			return res.success(
				{
					publicUrl: result.publicUrl,
				},
				"Avatar uploaded successfully to Cloudflare"
			);
		} catch (error) {
			req.log(
				"error",
				`Error uploading to Cloudflare: ${error.message}`,
				{ error }
			);
			return res.error(error.message || "Error uploading avatar", 500);
		}
	}
);

export default router;
