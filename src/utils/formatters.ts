/**
 * Formats a user object as needed.
 * @param user - The user object to format.
 * @returns The formatted user object.
 */
export function formatUser(user: any): any {
	// Format the user object as needed.
	return {
		id: user.id,
		email: user.email,
		role: user.role_name,
		firstName: user.first_name,
		lastName: user.last_name,
		phoneNumber: user.phone_number,
		avatarUrl: user.avatar_url,
		timezone: user.timezone,
		mfaEnabled: user.mfa_enabled,
		mfaMethod: user.mfa_method,
		createdAt: user.created_at,
	};
}

/**
 * Formats a product object as needed.
 * @param product - The product object to format.
 * @returns The formatted product object.
 */
export function formatProduct(product: any): any {
	return {
		id: product.id,
		name: product.name,
		price: product.price,
		imageUrl: product.image_url || null,
		createdAt: product.created_at,
	};
}
