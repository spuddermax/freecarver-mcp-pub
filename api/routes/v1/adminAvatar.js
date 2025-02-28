// /api/routes/v1/adminAvatar.js

import express from "express";
import multer from "multer";
import { verifyJWT as authenticate } from "../../middleware/auth.js";
import {
	uploadToCloudflare,
	deleteFromCloudflare,
} from "../../services/cloudflare.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB limit
	},
});

/**
 * Route to upload an avatar to Cloudflare Images with R2 storage
 * POST /api/admin/cloudflare-avatar
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
			const adminId = req.admin.id;

			// Get old avatar URL if provided
			const oldAvatarUrl = req.body.oldAvatarUrl;

			// Upload to Cloudflare Images
			const result = await uploadToCloudflare(req.file.buffer, {
				filename: `avatar-${adminId}-${Date.now()}`,
				adminId: adminId,
				oldImageUrl: oldAvatarUrl,
			});

			// Update admin profile with new avatar URL in database
			try {
				// This depends on your database setup - adjust accordingly
				await req.db.query(
					"UPDATE admin_users SET avatar_url = $1 WHERE id = $2",
					[result.publicUrl, adminId]
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
