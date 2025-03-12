# Cloudflare Image Upload Backend Enhancement Guide

## Current Issue
The category hero image upload feature is currently overwriting admin user avatars because the `/api/admin/cloudflare-avatar` endpoint doesn't distinguish between different types of image uploads. When we upload a hero image for a category with ID 5, it overwrites the avatar for admin user with ID 5, because the endpoint:

1. Always uses the naming pattern `user-{userId}.{extension}`
2. Always updates the `admin_users` table's `avatar_url` column
3. Doesn't have any way to specify that an image is for a category, not a user

## URGENT Backend Changes Needed
The current backend implementation needs immediate modification to support different image types:

1. **Open `api/routes/v1/adminAvatar.js`** and modify the `/cloudflare-avatar` endpoint to handle different image types:

```javascript
router.post(
  "/cloudflare-avatar",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    try {
      // ... existing validation code ...

      // Get the image type - default to 'avatar' for backward compatibility
      const imageType = req.body.imageType || 'avatar';
      
      // Get old image URL if provided
      const oldImageUrl = req.body.oldAvatarUrl;

      // Upload to Cloudflare Images
      let filename;
      switch(imageType) {
        case 'avatar':
          filename = `user-${effectiveUserId}.${req.file.mimetype.split("/")[1]}`;
          break;
        case 'category_hero':
          filename = `cat-hero-${effectiveUserId}.${req.file.mimetype.split("/")[1]}`;
          break;
        default:
          filename = `image-${effectiveUserId}-${Date.now()}.${req.file.mimetype.split("/")[1]}`;
      }
      
      const result = await uploadToCloudflare(req.file.buffer, {
        filename: filename,
        adminId: adminId,
        oldImageUrl: oldImageUrl,
        userId: effectiveUserId,
      });

      // Conditionally update database based on image type
      if (imageType === 'avatar') {
        try {
          await pool.query(
            "UPDATE admin_users SET avatar_url = $1 WHERE id = $2",
            [result.publicUrl, effectiveUserId]
          );
        } catch (dbError) {
          req.log("error", `Error updating admin user avatar in DB: ${dbError.message}`, { error: dbError });
        }
      } else if (imageType === 'category_hero') {
        try {
          await pool.query(
            "UPDATE product_categories SET hero_image = $1 WHERE id = $2",
            [result.publicUrl, effectiveUserId]
          );
        } catch (dbError) {
          req.log("error", `Error updating product category hero image in DB: ${dbError.message}`, { error: dbError });
        }
      }
      // For other image types, don't update any database by default

      return res.success(
        {
          publicUrl: result.publicUrl,
        },
        `${imageType} uploaded successfully to Cloudflare`
      );
    } catch (error) {
      // ... existing error handling ...
    }
  }
);
```

2. **Long-term Recommendation**: Create a new, more appropriately named endpoint `/api/admin/cloudflare-upload` that is designed from the ground up to handle various image types.

## Additional Request Parameters
To support different image types, add these parameters to the endpoint:

* `imageType` - The type of image being uploaded ('avatar', 'category_hero', 'product', etc.)
* `skipDatabaseUpdate` - (Optional) Boolean flag to skip automatic database updates
* `customFields` - (Optional) Any additional fields needed for specific image types

## Frontend Implementation
The frontend should send these parameters when uploading images:

```typescript
// For category hero images
formData.append("imageType", "category_hero");
formData.append("userId", categoryId.toString());

// For user avatars (current behavior)
formData.append("imageType", "avatar");
formData.append("userId", userId.toString());
```

## Immediate Workaround
Until the backend is updated, we CANNOT use the current endpoint for category hero images as it will overwrite user avatars. Options:

1. Add a separate endpoint specifically for category images
2. Use an image hosting service temporarily for category images
3. Store image data using a different method until proper support is added

⚠️ **CRITICAL**: Do not proceed with using the current endpoint for non-avatar images without implementing these backend changes, as it will corrupt user avatar data.
