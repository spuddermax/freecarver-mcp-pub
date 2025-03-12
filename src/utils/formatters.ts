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
		first_name: user.first_name,
		last_name: user.last_name,
		phone_number: user.phone_number,
		avatar_url: user.avatar_url,
		timezone: user.timezone,
		mfa_enabled: user.mfa_enabled,
		mfa_method: user.mfa_method,
		created_at: user.created_at,
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
		sale_price: product.sale_price,
		sale_start: product.sale_start,
		sale_end: product.sale_end,
		product_media: product.product_media,
		created_at: product.created_at,
		updated_at: product.updated_at,
		options: product.options,
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

/**
 * Formats a product category object as needed.
 * @param category - The product category object to format.
 * @returns The formatted product category object.
 */
export function formatProductCategory(category: any): any {
	return {
		id: category.id,
		name: category.name,
		description: category.description,
		parent_category_id: category.parent_category_id,
		hero_image: category.hero_image || null,
		created_at: category.created_at,
		updated_at: category.updated_at,
	};
}
