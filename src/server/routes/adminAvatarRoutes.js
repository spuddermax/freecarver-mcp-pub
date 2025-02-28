const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const cloudflare = require("../services/cloudflare");

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
	auth,
	upload.single("avatar"),
	async (req, res) => {
		try {
			// Check if file exists
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			// Extract the admin ID from the auth token
			const adminId = req.admin.id;

			// Get old avatar URL if provided
			const oldAvatarUrl = req.body.oldAvatarUrl;

			// Upload to Cloudflare Images
			const result = await cloudflare.uploadImage(req.file.buffer, {
				filename: `avatar-${adminId}-${Date.now()}`,
				adminId: adminId,
				oldImageUrl: oldAvatarUrl,
			});

			// Update admin profile with new avatar URL in database
			// This depends on your database model, but here's a pseudocode example
			// await Admin.updateOne({ id: adminId }, { avatar_url: result.publicUrl });

			return res.json({
				publicUrl: result.publicUrl,
				message: "Avatar uploaded successfully to Cloudflare",
			});
		} catch (error) {
			console.error("Error uploading to Cloudflare:", error);
			return res
				.status(500)
				.json({ error: error.message || "Error uploading avatar" });
		}
	}
);

module.exports = router;
