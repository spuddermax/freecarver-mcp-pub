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
		sku: product.sku,
		name: product.name,
		description: product.description,
		price: product.price,
		salePrice: product.sale_price,
		saleStart: product.sale_start,
		saleEnd: product.sale_end,
		productMedia: product.product_media,
		createdAt: product.created_at,
	};
}

/**
 * Formats a product media object as needed.
 * @param media - The media object to format.
 * @returns The formatted media object.
 */
export function formatProductMedia(media: any): any {
	return {
		media_id: media.id,
		url: media.url,
		title: media.title,
	};
}

/**
 * Formats a product option object as needed.
 * @param option - The option object to format.
 * @returns The formatted option object.
 */
export function formatProductOption(option: any): any {
	return {
		id: option.id,
		name: option.name,
		description: option.description,
		price: option.price,
	};
}
