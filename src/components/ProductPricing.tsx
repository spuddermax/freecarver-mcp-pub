// /src/components/ProductPricing.tsx

import { ChangeEvent, useState, useEffect } from "react";
import { DollarSign, Tag, Calendar, Save } from "lucide-react";
import { updateProduct } from "../lib/api_client/products";
import Toast from "../components/Toast";
import { Product } from "../types/Interfaces";

export interface ProductPricingProps {
	product: Product;
	onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ProductPricing({
	product,
	onInputChange,
}: ProductPricingProps) {
	// Extract the relevant fields from the product
	const {
		id: productId,
		price: basePrice,
		sale_price: baseSalePrice,
		sale_start: baseSaleStart,
		sale_end: baseSaleEnd,
	} = product;

	console.log("baseSaleEnd:", baseSaleEnd);

	// Convert to the expected types for the component
	const price = basePrice ?? 0;
	const salePrice = baseSalePrice ?? undefined;
	const saleStart = baseSaleStart
		? baseSaleStart instanceof Date
			? baseSaleStart.toISOString()
			: String(baseSaleStart)
		: undefined;
	const saleEnd = baseSaleEnd
		? baseSaleEnd instanceof Date
			? baseSaleEnd.toISOString()
			: String(baseSaleEnd)
		: undefined;

	// Store the original pricing values when the component first mounts.
	const [originalPricing, setOriginalPricing] = useState({
		price,
		salePrice,
		saleStart,
		saleEnd,
	});

	// Toast state for showing notifications.
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	// Optionally, capture initial pricing only on mount.
	useEffect(() => {
		setOriginalPricing({ price, salePrice, saleStart, saleEnd });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Determine if there are any changes compared to the original pricing.
	const isPricingUnchanged =
		JSON.stringify(originalPricing) ===
		JSON.stringify({ price, salePrice, saleStart, saleEnd });

	// Handle saving pricing. If onSavePricing is provided, call it;
	// otherwise, show an alert. After saving, update originalPricing.

	const handleSavePricing = async () => {
		try {
			// Call your API to update the product details. Do not include empty optional fields.
			const updateData: {
				id: string;
				price: number;
				sale_price?: number;
				sale_start?: string;
				sale_end?: string;
			} = {
				id: productId.toString(),
				price,
			};

			if (salePrice) {
				updateData.sale_price = salePrice;
			}
			if (saleStart) {
				updateData.sale_start = saleStart;
			}
			if (saleEnd) {
				updateData.sale_end = saleEnd;
			}

			await updateProduct(updateData);
			setOriginalPricing({ price, salePrice, saleStart, saleEnd });
			setToast({
				message: "Product pricing updated successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error updating product pricing", error);
			setToast({
				message: "Error updating product pricing: " + error.message,
				type: "error",
			});
		}
	};

	return (
		<fieldset className="border rounded-lg p-4 border-cyan-200 dark:border-cyan-700">
			<legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2">
				Pricing
			</legend>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label
						htmlFor="price"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Price
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<DollarSign className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="number"
							name="price"
							id="price"
							value={price}
							onChange={onInputChange}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-700"
						/>
					</div>
				</div>
				<div>
					<label
						htmlFor="salePrice"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Sale Price (optional)
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Tag className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="number"
							name="salePrice"
							id="salePrice"
							value={salePrice || ""}
							onChange={onInputChange}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
				<div>
					<label
						htmlFor="saleStart"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Sale Start (optional)
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="datetime-local"
							name="saleStart"
							id="saleStart"
							value={saleStart || ""}
							onChange={onInputChange}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</div>
				<div>
					<label
						htmlFor="saleEnd"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Sale End (optional) {saleEnd}
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="datetime-local"
							name="saleEnd"
							id="saleEnd"
							value={saleEnd || ""}
							onChange={onInputChange}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</div>
			</div>
			{/* Save Pricing Button */}
			<div className="mt-4 flex justify-center">
				<button
					type="button"
					onClick={handleSavePricing}
					disabled={isPricingUnchanged}
					className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						isPricingUnchanged
							? "text-gray-500 bg-blue-900 cursor-not-allowed"
							: "text-white bg-blue-700 hover:bg-blue-600"
					}`}
				>
					<Save className="h-4 w-4 mr-1" />
					Save Pricing
				</button>
				{toast && (
					<Toast
						message={toast.message}
						type={toast.type}
						onClose={() => setToast(null)}
					/>
				)}
			</div>
		</fieldset>
	);
}
