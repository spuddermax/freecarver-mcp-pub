// /src/lib/api_client/products.ts
import { deleteImageFromCloudflare, uploadProductMediaToCloudflare } from "../api";

/**
 * Fetch all products.
 * @returns A promise that resolves to an array of products.
 */
export async function fetchProducts(): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/products",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch products");
	}
	const responseData = await response.json();
	return responseData.data.products;
}

/**
 * Retrieve details for a specific product by ID.
 * @param id - The product ID.
 * @returns A promise that resolves to the product details.
 */
export async function fetchProduct(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${id}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch product details");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Create a new product.
 * @param data - The product data.
 * @returns A promise that resolves to the created product.
 */
export async function createProduct(data: {
	name: string;
	description?: string;
	price?: number;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	product_media?: any;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/products",
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
		throw new Error(errorData.error || "Failed to create product");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Update an existing product.
 * @param data - An object containing the product ID and the fields to update.
 * @returns A promise that resolves to the updated product.
 */
export async function updateProduct(data: {
	id: string;
	sku?: string;
	name?: string;
	description?: string;
	price?: number;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	product_media?: any;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${data.id}`,
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
		throw new Error(errorData.error || "Failed to update product");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Delete a product by ID.
 * @param id - The product ID.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteProduct(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${id}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete product");
	}
	const responseData = await response.json();
	return responseData.data;
}

/**
 * Uploads an image for product media to Cloudflare
 * @param file The image file to upload
 * @param productId The ID of the product
 * @param mediaId The ID of the media item
 * @param currentImageUrl Optional current image URL to replace
 * @returns The URL of the uploaded image
 */
export async function uploadProductMediaImage(
	file: File,
	productId: number,
	mediaId: string,
	currentImageUrl?: string
): Promise<string> {
	try {
		const response = await uploadProductMediaToCloudflare(
			file,
			productId,
			mediaId,
			currentImageUrl
		);
		
		return response.data.publicUrl;
	} catch (error: any) {
		console.error("Error uploading product media image:", error);
		throw error;
	}
}

/**
 * Remove a media image from a product
 * @param imageUrl The URL of the image to delete
 * @param productId The ID of the product
 */
export async function removeProductMediaImage(
	imageUrl: string,
	productId: number
): Promise<void> {
	try {
		await deleteImageFromCloudflare(
			imageUrl,
			'product_media',
			productId
		);
	} catch (error: any) {
		console.error("Error deleting product media image:", error);
		throw error;
	}
}
