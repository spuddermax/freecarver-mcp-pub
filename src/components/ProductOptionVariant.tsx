import React from "react";
import { Calendar, Tag, DollarSign, Percent, Image, Plus } from "lucide-react";

interface Variant {
	variant_id?: number;
	variant_name: string;
	sku: string;
	price: number | string;
	sale_price: number | string;
	sale_start: string;
	sale_end: string;
	media: string;
}

interface ProductOptionVariantProps {
	index: number;
	inputValue: string;
	onInputChange: (index: number, value: string) => void;
	onKeyPress: (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => void;
	selectedVariant?: Variant;
	onVariantChange?: (
		index: number,
		field: string,
		value: string | number
	) => void;
	onAddVariant?: (index: number, variantName: string) => void;
}

const ProductOptionVariant: React.FC<ProductOptionVariantProps> = ({
	index,
	inputValue,
	onInputChange,
	onKeyPress,
	selectedVariant,
	onVariantChange = () => {},
	onAddVariant = () => {},
}) => {
	const handleAddVariant = () => {
		if (inputValue.trim()) {
			onAddVariant(index, inputValue);
			onInputChange(index, ""); // Clear the input
		}
	};

	return (
		<div className="p-4 border rounded-lg mt-4 bg-gray-50 dark:bg-gray-800">
			<h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
				{selectedVariant ? "Edit Variant" : "New Variant"}
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Variant Name */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Variant Name
					</label>
					<input
						type="text"
						value={
							selectedVariant
								? selectedVariant.variant_name
								: inputValue || ""
						}
						onChange={(e) =>
							selectedVariant
								? onVariantChange(
										index,
										"variant_name",
										e.target.value
								  )
								: onInputChange(index, e.target.value)
						}
						onKeyPress={
							selectedVariant
								? undefined
								: (e) => onKeyPress(e, index)
						}
						placeholder="Enter variant name"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* SKU */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<Tag className="h-4 w-4 mr-1" />
							SKU
						</div>
					</label>
					<input
						type="text"
						value={selectedVariant ? selectedVariant.sku : ""}
						onChange={(e) =>
							onVariantChange(index, "sku", e.target.value)
						}
						placeholder="Enter SKU code"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* Price */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<DollarSign className="h-4 w-4 mr-1" />
							Price
						</div>
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={selectedVariant ? selectedVariant.price : ""}
						onChange={(e) =>
							onVariantChange(
								index,
								"price",
								parseFloat(e.target.value)
							)
						}
						placeholder="0.00"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* Sale Price */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<Percent className="h-4 w-4 mr-1" />
							Sale Price
						</div>
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={
							selectedVariant ? selectedVariant.sale_price : ""
						}
						onChange={(e) =>
							onVariantChange(
								index,
								"sale_price",
								parseFloat(e.target.value)
							)
						}
						placeholder="0.00"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* Sale Start */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 mr-1" />
							Sale Start
						</div>
					</label>
					<input
						type="datetime-local"
						value={
							selectedVariant ? selectedVariant.sale_start : ""
						}
						onChange={(e) =>
							onVariantChange(index, "sale_start", e.target.value)
						}
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* Sale End */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 mr-1" />
							Sale End
						</div>
					</label>
					<input
						type="datetime-local"
						value={selectedVariant ? selectedVariant.sale_end : ""}
						onChange={(e) =>
							onVariantChange(index, "sale_end", e.target.value)
						}
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				{/* Media URL */}
				<div className="col-span-1 md:col-span-2">
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						<div className="flex items-center">
							<Image className="h-4 w-4 mr-1" />
							Media URL
						</div>
					</label>
					<input
						type="text"
						value={selectedVariant ? selectedVariant.media : ""}
						onChange={(e) =>
							onVariantChange(index, "media", e.target.value)
						}
						placeholder="Enter media URL"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>

			{/* Add Variant Button - Only show when not editing an existing variant */}
			{!selectedVariant && (
				<div className="flex justify-end mt-4">
					<button
						onClick={handleAddVariant}
						type="button"
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600"
						disabled={!inputValue.trim()}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Variant
					</button>
				</div>
			)}
		</div>
	);
};

export default ProductOptionVariant;
