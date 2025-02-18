// /src/pages/productEdit.tsx

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package as PackageIcon } from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import {
	fetchProduct,
	updateProduct,
	deleteProduct,
} from "../lib/api_client/products";
import { formatProduct } from "../utils/formatters";
import { ProductDetails } from "../components/ProductDetails";
import { ProductPricing } from "../components/ProductPricing";
import { ProductMedia } from "../components/ProductMedia";

// Define the full product data interface.
interface ProductData {
	targetId: string;
	sku: string;
	name: string;
	description: string;
	price: number;
	salePrice?: number;
	saleStart?: string;
	saleEnd?: string;
	// productMedia is stored as a JSON string after combining the mediaItems.
	productMedia?: string;
	createdAt: string;
}

export interface ProductMediaItem {
	media_id: string;
	url: string;
	title?: string;
	default?: boolean;
}

/**
 * Edit the product details.
 * @returns The product editor view.
 */
export default function ProductEdit() {
	const { targetId } = useParams<{ targetId: string }>();
	const navigate = useNavigate();

	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [productData, setProductData] = useState<ProductData>({
		targetId: "",
		sku: "",
		name: "",
		description: "",
		price: 0,
		salePrice: undefined,
		saleStart: "",
		saleEnd: "",
		productMedia: "",
		createdAt: "",
	});
	// Manage the media items interactively.
	const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);

	const [message, setMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);

	// Load product details when the component mounts or the targetId changes.
	useEffect(() => {
		async function loadProduct() {
			if (!targetId) {
				console.log("No product ID provided");
				setMessage({
					type: "error",
					text: "No product ID provided",
				});
				return;
			}
			try {
				const data = await fetchProduct(targetId);
				// Use our formatter to ensure field names match the interface.
				const formattedProduct: ProductData = formatProduct(data);
				setProductData(formattedProduct);
				// Parse the productMedia JSON string into mediaItems array.
				if (
					formattedProduct.productMedia &&
					formattedProduct.productMedia.length > 0
				) {
					try {
						const parsed = JSON.parse(
							formattedProduct.productMedia
						);
						setMediaItems(parsed);
					} catch (err) {
						console.error("Error parsing product media", err);
						setMediaItems([]);
					}
				} else {
					setMediaItems([]);
				}
			} catch (error: any) {
				console.error("Error loading product:", error);
				setMessage({ type: "error", text: error.message });
			} finally {
				setLoading(false);
			}
		}
		loadProduct();
	}, [targetId]);

	// Standard handler for input changes in text fields.
	const handleInputChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setProductData((prev) => ({ ...prev, [name]: value }));
	};

	// Process form submission: update the media items by combining them into JSON.
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setMessage(null);
		const payload = {
			id: productData.targetId,
			name: productData.name,
			description: productData.description,
			price: productData.price,
			sale_price: productData.salePrice,
			sale_start: productData.saleStart,
			sale_end: productData.saleEnd,
			product_media: JSON.stringify(mediaItems),
		};

		try {
			await updateProduct(payload);
			setMessage({
				type: "success",
				text: "Product updated successfully!",
			});
			navigate("/products");
		} catch (error: any) {
			console.error("Error updating product:", error);
			setMessage({
				type: "error",
				text: "Error updating product. Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this product?"))
			return;
		setIsSaving(true);
		setMessage(null);

		try {
			await deleteProduct(productData.targetId);
			setMessage({
				type: "success",
				text: "Product deleted successfully!",
			});
			navigate("/products");
		} catch (error: any) {
			console.error("Error deleting product:", error);
			setMessage({
				type: "error",
				text: "Error deleting product. Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Render loading or form view.
	return (
		<Layout
			pageInfo={{
				title: "Edit Product",
				icon: PackageIcon,
				iconColor: "text-yellow-500 dark:text-yellow-400",
			}}
			breadcrumbs={[
				{ label: "Dashboard", link: "/dashboard" },
				{ label: "Manage Products", link: "/products" },
				{ label: "Edit Product" },
			]}
		>
			{message && (
				<Toast
					message={message.text}
					type={message.type}
					onClose={() => setMessage(null)}
				/>
			)}
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
						<div className="p-6 space-y-8">
							{loading ? (
								<div className="text-sm text-gray-500 dark:text-gray-400">
									Loading product details...
								</div>
							) : (
								<form
									onSubmit={handleSubmit}
									className="space-y-6"
								>
									<div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
										Product ID: {targetId}
									</div>

									<ProductDetails
										productSKU={productData.sku}
										name={productData.name}
										description={productData.description}
										onInputChange={handleInputChange}
									/>
									<ProductPricing
										price={productData.price}
										salePrice={productData.salePrice}
										saleStart={productData.saleStart}
										saleEnd={productData.saleEnd}
										onInputChange={handleInputChange}
									/>
									{/* Product Media Section */}
									<ProductMedia
										mediaItems={mediaItems}
										setMediaItems={setMediaItems}
									/>
									<div className="flex justify-end space-x-4">
										<button
											type="button"
											onClick={handleDelete}
											className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
										>
											Delete Product
										</button>
										<button
											type="submit"
											disabled={isSaving}
											className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
												isSaving
													? "opacity-50 cursor-not-allowed"
													: ""
											}`}
										>
											{isSaving
												? "Saving..."
												: "Update Product"}
										</button>
									</div>
								</form>
							)}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
