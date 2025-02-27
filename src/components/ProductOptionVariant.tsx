import React, { useState, useEffect } from "react";
import {
	Calendar,
	Tag,
	DollarSign,
	Percent,
	Image,
	Plus,
	Save,
} from "lucide-react";
import { Variant } from "./ProductOptions";

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

// Local interface for new variant form state
interface NewVariantState {
	variant_name: string;
	sku: string;
	price: number | null;
	sale_price: number | null;
	sale_start: string;
	sale_end: string;
	media: string;
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
	// State for tracking new variant information
	const [newVariant, setNewVariant] = useState<NewVariantState>({
		variant_name: inputValue || "",
		sku: "",
		price: null,
		sale_price: null,
		sale_start: "",
		sale_end: "",
		media: "",
	});

	// State to track if variant has been updated
	const [isUpdated, setIsUpdated] = useState(false);

	// Update function for string fields
	const handleNewVariantChangeString = (field: string, value: string) => {
		setNewVariant((prev) => ({
			...prev,
			[field]: value,
		}));

		// Special case for variant_name as it's also managed by parent component
		if (field === "variant_name") {
			onInputChange(index, value);
		}
	};

	// Update function for number fields that can be null
	const handleNewVariantChangeNumber = (
		field: string,
		value: number | null
	) => {
		setNewVariant((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Sync the variant name input value to state when it changes from parent
	useEffect(() => {
		if (!selectedVariant) {
			setNewVariant((prev) => ({
				...prev,
				variant_name: inputValue || "",
			}));
		}
	}, [inputValue, selectedVariant]);

	// Set isUpdated to true when a variant field change occurs
	const handleVariantFieldChange = (
		field: string,
		value: string | number
	) => {
		setIsUpdated(true);
		onVariantChange(index, field, value);
	};

	const handleAddVariant = () => {
		if (newVariant.variant_name && newVariant.variant_name.trim()) {
			// Use the entered variant data when adding it
			onAddVariant(index, newVariant.variant_name.trim());

			// Reset the new variant state after adding
			setNewVariant({
				variant_name: "",
				sku: "",
				price: null,
				sale_price: null,
				sale_start: "",
				sale_end: "",
				media: "",
			});
		}
	};

	// Function to explicitly save all variant data
	const saveVariant = () => {
		if (selectedVariant) {
			// Update every field to ensure all data is saved properly
			Object.entries(selectedVariant).forEach(([key, value]) => {
				if (key !== "variant_id") {
					// Skip the ID field
					onVariantChange(index, key, value);
				}
			});
			setIsUpdated(false);
		}
	};

	// Check if any variant information has been entered
	const hasVariantInfo = () => {
		if (selectedVariant) {
			return (
				selectedVariant.variant_name.trim() !== "" ||
				selectedVariant.sku.trim() !== "" ||
				selectedVariant.price !== 0 ||
				selectedVariant.sale_price !== 0 ||
				selectedVariant.sale_start !== "" ||
				selectedVariant.sale_end !== "" ||
				selectedVariant.media.trim() !== ""
			);
		}

		return (
			newVariant.variant_name?.trim() !== "" ||
			newVariant.sku?.trim() !== "" ||
			newVariant.price !== null ||
			newVariant.sale_price !== null ||
			newVariant.sale_start !== "" ||
			newVariant.sale_end !== "" ||
			newVariant.media?.trim() !== ""
		);
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
								: newVariant.variant_name || ""
						}
						onChange={(e) =>
							selectedVariant
								? handleVariantFieldChange(
										"variant_name",
										e.target.value
								  )
								: handleNewVariantChangeString(
										"variant_name",
										e.target.value
								  )
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
						value={
							selectedVariant
								? selectedVariant.sku
								: newVariant.sku || ""
						}
						onChange={(e) =>
							selectedVariant
								? handleVariantFieldChange(
										"sku",
										e.target.value
								  )
								: handleNewVariantChangeString(
										"sku",
										e.target.value
								  )
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
						value={
							selectedVariant
								? selectedVariant.price
								: newVariant.price !== null
								? newVariant.price
								: ""
						}
						onChange={(e) => {
							const value =
								e.target.value === ""
									? null
									: parseFloat(e.target.value);
							if (selectedVariant) {
								handleVariantFieldChange(
									"price",
									value === null ? 0 : value
								);
							} else {
								handleNewVariantChangeNumber("price", value);
							}
						}}
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
							selectedVariant
								? selectedVariant.sale_price
								: newVariant.sale_price !== null
								? newVariant.sale_price
								: ""
						}
						onChange={(e) => {
							const value =
								e.target.value === ""
									? null
									: parseFloat(e.target.value);
							if (selectedVariant) {
								handleVariantFieldChange(
									"sale_price",
									value === null ? 0 : value
								);
							} else {
								handleNewVariantChangeNumber(
									"sale_price",
									value
								);
							}
						}}
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
							selectedVariant
								? selectedVariant.sale_start
								: newVariant.sale_start || ""
						}
						onChange={(e) =>
							selectedVariant
								? handleVariantFieldChange(
										"sale_start",
										e.target.value
								  )
								: handleNewVariantChangeString(
										"sale_start",
										e.target.value
								  )
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
						value={
							selectedVariant
								? selectedVariant.sale_end
								: newVariant.sale_end || ""
						}
						onChange={(e) =>
							selectedVariant
								? handleVariantFieldChange(
										"sale_end",
										e.target.value
								  )
								: handleNewVariantChangeString(
										"sale_end",
										e.target.value
								  )
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
						value={
							selectedVariant
								? selectedVariant.media
								: newVariant.media || ""
						}
						onChange={(e) =>
							selectedVariant
								? handleVariantFieldChange(
										"media",
										e.target.value
								  )
								: handleNewVariantChangeString(
										"media",
										e.target.value
								  )
						}
						placeholder="Enter media URL"
						className="block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-start mt-4">
				{selectedVariant ? (
					<button
						onClick={saveVariant}
						type="button"
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600"
					>
						<Save className="h-4 w-4 mr-1" />
						Update Variant
					</button>
				) : (
					<button
						onClick={handleAddVariant}
						type="button"
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!hasVariantInfo()}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Variant
					</button>
				)}
			</div>
		</div>
	);
};

export default ProductOptionVariant;
