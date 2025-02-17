import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
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

// Define the full product data interface.
interface ProductData {
	targetId: string;
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
				if (formattedProduct.productMedia) {
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
			...productData,
			productMedia: JSON.stringify(mediaItems),
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

	// Update a media item field
	const updateMediaItem = (
		index: number,
		key: keyof ProductMediaItem,
		value: any
	) => {
		setMediaItems((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			// When setting default true, ensure all others become false.
			if (key === "default" && value === true) {
				return updated.map((item, idx) =>
					idx === index
						? { ...item, default: true }
						: { ...item, default: false }
				);
			}
			return updated;
		});
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
									<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
										<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
											Product Details
										</legend>
										{/* Product Name */}
										<div>
											<label
												htmlFor="name"
												className="block text-sm font-medium text-gray-700 dark:text-gray-300"
											>
												Product Name
											</label>
											<input
												type="text"
												name="name"
												id="name"
												value={productData.name}
												onChange={handleInputChange}
												className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
											/>
										</div>
										{/* Description */}
										<div>
											<label
												htmlFor="description"
												className="block text-sm font-medium text-gray-700 dark:text-gray-300"
											>
												Description
											</label>
											<textarea
												name="description"
												id="description"
												rows={4}
												value={productData.description}
												onChange={handleInputChange}
												className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
											/>
										</div>
									</fieldset>
									{/* Price */}
									<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
										<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
											Pricing and Options
										</legend>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label
													htmlFor="price"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Price
												</label>
												<input
													type="number"
													name="price"
													id="price"
													value={productData.price}
													onChange={handleInputChange}
													className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
												/>
											</div>
											<div>
												<label
													htmlFor="salePrice"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Sale Price (optional)
												</label>
												<input
													type="number"
													name="salePrice"
													id="salePrice"
													value={
														productData.salePrice ||
														""
													}
													onChange={handleInputChange}
													className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
												/>
											</div>
										</div>
										{/* Sale Dates */}
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label
													htmlFor="saleStart"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Sale Start (optional)
												</label>
												<input
													type="datetime-local"
													name="saleStart"
													id="saleStart"
													value={
														productData.saleStart ||
														""
													}
													onChange={handleInputChange}
													className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
												/>
											</div>
											<div>
												<label
													htmlFor="saleEnd"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Sale End (optional)
												</label>
												<input
													type="datetime-local"
													name="saleEnd"
													id="saleEnd"
													value={
														productData.saleEnd ||
														""
													}
													onChange={handleInputChange}
													className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
												/>
											</div>
										</div>
									</fieldset>
									{/* Product Media Section */}
									<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
										<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
											Product Media
										</legend>
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
												Product Media
											</label>
											<div className="space-y-4 mt-1">
												{mediaItems.map(
													(item, index) => (
														<div
															key={item.media_id}
															className="border border-gray-300 dark:border-gray-600 rounded-md p-3"
														>
															{/* URL Field */}
															<div>
																<label
																	htmlFor={`media-url-${index}`}
																	className="block text-sm font-medium text-gray-700 dark:text-gray-300"
																>
																	Media URL
																</label>
																<input
																	type="text"
																	id={`media-url-${index}`}
																	value={
																		item.url
																	}
																	onChange={(
																		e
																	) =>
																		updateMediaItem(
																			index,
																			"url",
																			e
																				.target
																				.value
																		)
																	}
																	className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
																/>
															</div>
															{/* Title Field */}
															<div className="mt-2">
																<label
																	htmlFor={`media-title-${index}`}
																	className="block text-sm font-medium text-gray-700 dark:text-gray-300"
																>
																	Title
																	(optional)
																</label>
																<input
																	type="text"
																	id={`media-title-${index}`}
																	value={
																		item.title ||
																		""
																	}
																	onChange={(
																		e
																	) =>
																		updateMediaItem(
																			index,
																			"title",
																			e
																				.target
																				.value
																		)
																	}
																	className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
																/>
															</div>
															{/* Default Checkbox */}
															<div className="mt-2 flex items-center">
																<input
																	type="checkbox"
																	id={`media-default-${index}`}
																	checked={
																		item.default ||
																		false
																	}
																	onChange={(
																		e
																	) =>
																		updateMediaItem(
																			index,
																			"default",
																			e
																				.target
																				.checked
																		)
																	}
																	className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
																/>
																<label
																	htmlFor={`media-default-${index}`}
																	className="ml-2 text-sm text-gray-700 dark:text-gray-300"
																>
																	Default
																</label>
															</div>
															{/* Delete Button */}
															<div className="mt-2">
																<button
																	type="button"
																	onClick={() =>
																		setMediaItems(
																			(
																				prev
																			) =>
																				prev.filter(
																					(
																						_,
																						idx
																					) =>
																						idx !==
																						index
																				)
																		)
																	}
																	className="text-red-500 text-xs"
																>
																	Delete Media
																</button>
															</div>
														</div>
													)
												)}
												<button
													type="button"
													onClick={() =>
														setMediaItems(
															(prev) => [
																...prev,
																{
																	media_id:
																		Date.now().toString(),
																	url: "",
																	title: "",
																	default:
																		false,
																},
															]
														)
													}
													className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
												>
													Add Media
												</button>
											</div>
										</div>
										{/* End Product Media Section */}
									</fieldset>
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
