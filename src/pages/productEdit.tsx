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
import { ProductMediaItem } from "../components/ProductMedia";
import Footer from "../components/Footer";
import ProductOptions, { Option } from "../components/ProductOptions";
import { ProductOption } from "../types/Interfaces";
import { Product } from "../types/Interfaces";

/**
 * Edit the product details.
 * @returns The product editor view.
 */
export default function ProductEdit() {
	const { targetId } = useParams<{ targetId: string }>();
	const navigate = useNavigate();

	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [productData, setProductData] = useState<Product>({
		id: 0,
		sku: "",
		name: "",
		description: "",
		price: 0,
		sale_price: 0,
		sale_start: new Date(),
		sale_end: new Date(),
		product_media: [],
		created_at: new Date(),
		updated_at: new Date(),
		options: [],
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
				const formattedProduct: Product = formatProduct(data);
				console.log(formattedProduct);
				setProductData(formattedProduct);
				// Parse the productMedia JSON string into mediaItems array.
				if (
					formattedProduct.product_media &&
					formattedProduct.product_media.length > 0
				) {
					try {
						setMediaItems(formattedProduct.product_media);
						setProductData((prev) => ({
							...prev,
							options: formattedProduct.options.map(
								(opt: ProductOption) => ({
									...opt,
									values: [],
								})
							),
						}));
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
			id: productData.id.toString(),
			sku: productData.sku,
			name: productData.name,
			description: productData.description,
			price: productData.price ?? undefined,
			sale_price: productData.sale_price ?? undefined,
			sale_start: productData.sale_start
				? productData.sale_start instanceof Date
					? productData.sale_start.toISOString()
					: String(productData.sale_start)
				: undefined,
			sale_end: productData.sale_end
				? productData.sale_end instanceof Date
					? productData.sale_end.toISOString()
					: String(productData.sale_end)
				: undefined,
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
			await deleteProduct(productData.id.toString());
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

	const handleOptionsChange = (options: Option[]) => {
		// Map the Option interface to ProductOption
		const productOptions: ProductOption[] = options.map((opt) => ({
			option_id: opt.option_id,
			option_name: opt.option_name,
			variants: opt.variants.map((variant) => ({
				variant_id: variant.variant_id,
				variant_name: variant.variant_name,
				sku: variant.sku,
				price: parseFloat(variant.price as unknown as string) || 0,
				sale_price:
					parseFloat(variant.sale_price as unknown as string) || 0,
				sale_start: variant.sale_start
					? new Date(variant.sale_start)
					: null,
				sale_end: variant.sale_end ? new Date(variant.sale_end) : null,
				media: [],
				created_at: new Date(),
				updated_at: new Date(),
			})),
		}));

		setProductData((prev) => ({
			...prev,
			options: productOptions,
		}));
	};

	// Handler for Save Options button
	const handleSaveOptions = () => {
		const updatePayload = {
			productId: productData.id.toString(),
			options: productData.options,
		};
		console.log("Update payload:", updatePayload);
		// TODO: Update the database via an API call when ready.
	};

	// Render loading or form view.
	return (
		<div>
			<Layout
				pageInfo={{
					title: "Edit Product",
					icon: PackageIcon,
					iconColor: "text-red-600 dark:text-red-600",
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
											productId={targetId ?? ""}
											productSKU={productData.sku}
											name={productData.name}
											description={
												productData.description
											}
											onInputChange={handleInputChange}
										/>
										<ProductPricing
											productId={targetId ?? ""}
											price={productData.price ?? 0}
											salePrice={
												productData.sale_price ?? 0
											}
											saleStart={
												productData.sale_start
													? productData.sale_start instanceof
													  Date
														? productData.sale_start.toISOString()
														: String(
																productData.sale_start
														  )
													: undefined
											}
											saleEnd={
												productData.sale_end
													? productData.sale_end instanceof
													  Date
														? productData.sale_end.toISOString()
														: String(
																productData.sale_end
														  )
													: undefined
											}
											onInputChange={handleInputChange}
										/>
										<ProductOptions
											initialOptions={(
												productData.options || []
											).map((opt: ProductOption) => ({
												option_id: opt.option_id,
												option_name: opt.option_name,
												variants:
													opt.variants?.map((v) => ({
														variant_id:
															v.variant_id,
														variant_name:
															v.variant_name,
														sku: v.sku,
														price: v.price,
														sale_price:
															v.sale_price,
														sale_start: v.sale_start
															? v.sale_start.toISOString()
															: "",
														sale_end: v.sale_end
															? v.sale_end.toISOString()
															: "",
														media: "",
														created_at:
															v.created_at,
														updated_at:
															v.updated_at,
													})) || [],
											}))}
											onChange={handleOptionsChange}
										/>
										<button onClick={handleSaveOptions}>
											Save Options
										</button>
										{/* Product Media Section */}
										<ProductMedia
											mediaItems={mediaItems}
											setMediaItems={setMediaItems}
											productId={targetId ?? ""}
										/>
										<div className="flex justify-end space-x-4">
											<button
												type="button"
												onClick={handleDelete}
												className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
											>
												Delete Product
											</button>
										</div>
									</form>
								)}
							</div>
						</div>
					</div>
				</div>
			</Layout>
			<Footer />
		</div>
	);
}
