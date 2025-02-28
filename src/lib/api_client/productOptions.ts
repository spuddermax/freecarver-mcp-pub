import { Option, Variant } from "../../components/ProductOptions";

/**
 * Fetch all product options for a specific product.
 * @param productId - The ID of the product to fetch options for.
 * @returns A promise that resolves to an array of product options.
 */
export async function fetchProductOptions(
	productId: string
): Promise<Option[]> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${productId}/options`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch product options");
	}

	const responseData = await response.json();
	return responseData.data.options || [];
}

/**
 * Retrieve details for a specific product option by ID.
 * @param optionId - The product option ID.
 * @returns A promise that resolves to the product option details.
 */
export async function fetchProductOption(optionId: string): Promise<Option> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/product_options/${optionId}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to fetch product option details"
		);
	}

	const responseData = await response.json();
	return responseData.data.option;
}

/**
 * Create a new product option.
 * @param data - The product option data.
 * @returns A promise that resolves to the created product option.
 */
export async function createProductOption(data: {
	product_id: string;
	option_name: string;
}): Promise<Option> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/product_options",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to create product option");
	}

	const responseData = await response.json();
	return responseData.data.option;
}

/**
 * Update an existing product option.
 * @param data - An object containing the product option ID and the fields to update.
 * @returns A promise that resolves to the updated product option.
 */
export async function updateProductOption(data: {
	id: string;
	option_name: string;
}): Promise<Option> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/product_options/${data.id}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ option_name: data.option_name }),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update product option");
	}

	const responseData = await response.json();
	return responseData.data.option;
}

/**
 * Delete a product option by ID.
 * @param id - The product option ID.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteProductOption(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/product_options/${id}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete product option");
	}

	const responseData = await response.json();
	return responseData.data;
}

/**
 * Fetch all variants for a specific product option.
 * @param optionId - The ID of the product option to fetch variants for.
 * @returns A promise that resolves to an array of variants.
 */
export async function fetchOptionVariants(
	optionId: string
): Promise<Variant[]> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL +
			`/v1/product_options/${optionId}/variants`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch option variants");
	}

	const responseData = await response.json();
	return responseData.data.variants || [];
}

/**
 * Create a new variant for a product option.
 * @param optionId - The ID of the product option.
 * @param data - The variant data.
 * @returns A promise that resolves to the created variant.
 */
export async function createOptionVariant(
	optionId: string,
	data: {
		name: string;
		product_id: string;
		sku: string;
		price?: number;
		sale_price?: number;
		sale_start?: string;
		sale_end?: string;
		media?: string;
	}
): Promise<Variant> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL +
			`/v1/product_options/${optionId}/variants`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to create option variant");
	}

	const responseData = await response.json();
	return responseData.data.variant;
}

/**
 * Update an existing variant for a product option.
 * @param optionId - The ID of the product option.
 * @param variantId - The ID of the variant to update.
 * @param data - The updated variant data.
 * @returns A promise that resolves to the updated variant.
 */
export async function updateOptionVariant(
	optionId: string,
	variantId: string,
	data: {
		name?: string;
		sku?: string;
		price?: number;
		sale_price?: number;
		sale_start?: string;
		sale_end?: string;
		media?: string;
	}
): Promise<Variant> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL +
			`/v1/product_options/${optionId}/variants/${variantId}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update option variant");
	}

	const responseData = await response.json();
	return responseData.data.variant;
}

/**
 * Delete a variant from a product option.
 * @param optionId - The ID of the product option.
 * @param variantId - The ID of the variant to delete.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteOptionVariant(
	optionId: string,
	variantId: string
): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL +
			`/v1/product_options/${optionId}/variants/${variantId}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete option variant");
	}

	const responseData = await response.json();
	return responseData.data;
}

/**
 * Update all product options for a product at once.
 * @param productId - The ID of the product.
 * @param options - The complete set of options with their variants.
 * @returns A promise that resolves to the updated product with options.
 */
export async function updateProductOptionsAndVariants(
	productId: string,
	options: Option[]
): Promise<any> {
	const token = localStorage.getItem("jwtToken");

	try {
		// Get the full API URL for debugging
		const apiUrl =
			import.meta.env.VITE_API_URL + `/v1/products/${productId}/options`;
		console.log(`Making PUT request to: ${apiUrl}`);

		const response = await fetch(apiUrl, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ options }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("API Error Response:", errorData);
			throw new Error(
				errorData.message ||
					errorData.error ||
					`Failed to update product options (Status: ${response.status})`
			);
		}

		const responseData = await response.json();
		return responseData.data;
	} catch (error) {
		console.error("Error in updateProductOptionsAndVariants:", error);
		throw error;
	}
}
