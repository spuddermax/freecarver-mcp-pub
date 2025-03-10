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
 * Formats a date object as needed.
 * @param date - The date input to format (can be Date object, string, number, etc).
 * @param format - The format string (default: "MM/DD/YYYY, HH:mm:SS"), "html-datetime" for input[type="datetime-local"], or "iso" for ISO 8601
 * @returns The formatted date string or null if invalid date.
 */
export function formatDate(date: any, format: string = "MM/DD/YYYY, HH:mm:SS"): string | null {
	if (date === null || date === undefined) {
		return null;
	}
	
	try {
		// Convert to Date object if not already
		const dateObj = date instanceof Date ? date : new Date(date);
		
		// Check if the date is valid
		if (isNaN(dateObj.getTime())) {
			return null;
		}

		// Special case for ISO 8601 format (for API)
		if (format === "iso") {
			return dateObj.toISOString();
		}

		// Special case for HTML datetime-local input
		if (format === "html-datetime") {
			const year = dateObj.getFullYear();
			const month = String(dateObj.getMonth() + 1).padStart(2, '0');
			const day = String(dateObj.getDate()).padStart(2, '0');
			const hours = String(dateObj.getHours()).padStart(2, '0');
			const minutes = String(dateObj.getMinutes()).padStart(2, '0');
			
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		}

		// Extract date components
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');
		const year = dateObj.getFullYear();
		const hours = String(dateObj.getHours()).padStart(2, '0');
		const minutes = String(dateObj.getMinutes()).padStart(2, '0');
		const seconds = String(dateObj.getSeconds()).padStart(2, '0');
		
		// Replace format tokens with actual values using different cases to distinguish month from minutes
		let formattedDate = format
			.replace('YYYY', year.toString())
			.replace('MM', month)     // Month (uppercase)
			.replace('DD', day)
			.replace('HH', hours)
			.replace('mm', minutes)   // Minutes (lowercase)
			.replace('SS', seconds);
		
		return formattedDate;
	} catch (error) {
		console.error("Error formatting date:", error);
		return null;
	}
}
