# Cloudflare Images and R2 Integration

This document provides instructions for setting up Cloudflare Images and R2 storage for avatar uploads in the FreeMCP platform.

## Overview

The platform uses Cloudflare R2 storage (S3-compatible) for storing user avatar images. This provides:

-   Fast global distribution of images through Cloudflare's network
-   Secure and reliable storage
-   Cost-effective solution for image hosting

## Prerequisites

1. A Cloudflare account (sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up))
2. R2 storage enabled on your account (may require billing information)

## Setup Instructions

### 1. Create an R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to "R2" in the sidebar
3. Click "Create bucket"
4. Enter a name for your bucket (e.g., `freecarver-avatars`)
5. Choose your preferred settings and click "Create bucket"

### 2. Create an API Token

1. From your Cloudflare dashboard, navigate to "My Profile" > "API Tokens"
2. Click "Create Token"
3. Select "Create Custom Token"
4. Name your token (e.g., "FreeMCP R2 Access")
5. Under "Permissions", add:
    - R2 > Object > Edit
    - Account > Account Settings > Read
6. Under "Account Resources", select the specific account with your R2 bucket
7. Click "Continue to Summary" and then "Create Token"
8. Copy the token value (it will only be shown once)

### 3. Create R2 Access Keys

1. From the R2 dashboard, click on "Manage R2 API Tokens"
2. Click "Create API token"
3. Select "S3 Auth (Access Key ID and Secret Access Key)"
4. Choose your permissions (at minimum, need "Object Read" and "Object Write")
5. Click "Create API Token"
6. Copy both the Access Key ID and Secret Access Key (they will only be shown once)

### 4. Configure Environment Variables

Update your `.env` file with the following variables (already added to `.env.sample`):

```
# Cloudflare Images and R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
```

### 5. Configure CORS for R2 Bucket (Optional)

If you need direct frontend access to the R2 bucket, you'll need to configure CORS:

1. From the R2 dashboard, select your bucket
2. Go to "Settings" > "CORS"
3. Add a new CORS rule with the following configuration:
    - Allowed Origins: Your frontend domain (e.g., `https://yourdomain.com`)
    - Allowed Methods: GET, HEAD
    - Allowed Headers: \*
    - Max Age: 86400 (or your preferred value)

## Testing the Integration

To test if your Cloudflare integration is working:

1. Start the application
2. Log in as an admin user
3. Navigate to a profile page with an avatar upload option
4. Upload a new avatar image
5. Verify that the image is successfully uploaded and displayed

If you encounter issues, check the application logs for error messages.

## Troubleshooting

Common issues and solutions:

1. **403 Forbidden errors**: Check that your API token has the correct permissions
2. **Upload failures**: Ensure your R2 access keys have write permissions
3. **Images not displaying**: Verify CORS settings if accessing directly from the frontend

For additional assistance, refer to the Cloudflare R2 documentation at [https://developers.cloudflare.com/r2/](https://developers.cloudflare.com/r2/)
