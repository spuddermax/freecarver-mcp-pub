import React, { useState, useEffect } from "react";
import {
	Calendar,
	Tag,
	DollarSign,
	Barcode,
	Image,
	Plus,
	Save,
	Trash2,
	Type,
} from "lucide-react";
import { Variant } from "./ProductOptions";
import { format } from "date-fns";

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
	onAddVariant?: (index: number, variantData: Partial<Variant>) => void;
	onDeleteVariant?: (index: number, variantId: number) => void;
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
	onDeleteVariant = () => {},
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

	// State to track edits to existing variant
	const [editedVariant, setEditedVariant] = useState<
		Record<string, string | number>
	>({});

	// State to track if variant has been updated
	const [isUpdated, setIsUpdated] = useState(false);

	// State to track which fields have been modified
	const [modifiedFields, setModifiedFields] = useState<Set<string>>(
		new Set()
	);

	// Keep track of the currently selected variant's ID to detect real variant changes vs updates
	const [previousVariantId, setPreviousVariantId] = useState<number | null>(
		null
	);

	// Update the dateInputs state to use format() from date-fns
	const [dateInputs, setDateInputs] = useState({
		sale_start: selectedVariant?.sale_start ? 
			(new Date(selectedVariant.sale_start).toString() !== "Invalid Date" ? 
				format(new Date(selectedVariant.sale_start), "yyyy-MM-dd'T'HH:mm") : "") : "",
		sale_end: selectedVariant?.sale_end ? 
			(new Date(selectedVariant.sale_end).toString() !== "Invalid Date" ? 
				format(new Date(selectedVariant.sale_end), "yyyy-MM-dd'T'HH:mm") : "") : ""
	});

	// Update the useEffect that syncs dateInputs with selectedVariant
	useEffect(() => {
		if (selectedVariant) {
			setDateInputs({
				sale_start: selectedVariant.sale_start ? 
					(new Date(selectedVariant.sale_start).toString() !== "Invalid Date" ? 
						format(new Date(selectedVariant.sale_start), "yyyy-MM-dd'T'HH:mm") : "") : "",
				sale_end: selectedVariant.sale_end ? 
					(new Date(selectedVariant.sale_end).toString() !== "Invalid Date" ? 
						format(new Date(selectedVariant.sale_end), "yyyy-MM-dd'T'HH:mm") : "") : ""
			});
		} else {
			setDateInputs({
				sale_start: "",
				sale_end: ""
			});
		}
	}, [selectedVariant]);

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

	// Reset states when selectedVariant changes
	useEffect(() => {
		// Only reset if we switched to a completely different variant (different ID)
		if (
			selectedVariant &&
			previousVariantId !== selectedVariant.variant_id
		) {
			// Reset states when a different variant is selected
			setIsUpdated(false);
			setModifiedFields(new Set());
			setEditedVariant({}); // Clear edited variant data
			setPreviousVariantId(selectedVariant.variant_id);
		} else if (!selectedVariant) {
			// Reset when no variant is selected
			setIsUpdated(false);
			setModifiedFields(new Set());
			setEditedVariant({});
			setPreviousVariantId(null);
		}
	}, [selectedVariant, previousVariantId]);

	// Set isUpdated to true when a variant field change occurs
	const handleVariantFieldChange = (
		field: string,
		value: string | number
	) => {
		if (!selectedVariant) return;

		// Special handling for date fields - always mark them as modified
		const isDateField = field === "sale_start" || field === "sale_end";

		// Check if the value has actually changed, or if it's a date field (which we always want to track)
		if (
			isDateField ||
			String(selectedVariant[field as keyof Variant]) !== String(value)
		) {
			// Store the change locally instead of sending to parent immediately
			setEditedVariant((prev) => ({
				...prev,
				[field]: value,
			}));

			setIsUpdated(true);
			setModifiedFields((prev) => {
				const updated = new Set(prev);
				updated.add(field);
				return updated;
			});
		} else {
			// If the value is reset to original, remove from modified fields
			setEditedVariant((prev) => {
				const updated = { ...prev };
				delete updated[field];
				return updated;
			});

			setModifiedFields((prev) => {
				const updated = new Set(prev);
				updated.delete(field);
				// If no more modified fields, set isUpdated to false
				if (updated.size === 0) {
					setIsUpdated(false);
				}
				return updated;
			});
		}
	};

	// Update the handleDateChange function
	const handleDateChange = (field: string, value: string) => {
		// Update the display value immediately
		setDateInputs(prev => ({
			...prev,
			[field]: value
		}));
		
		// Mark field as modified
		if (selectedVariant) {
			// Special handling for date fields
			setIsUpdated(true);
			setModifiedFields((prev) => {
				const updated = new Set(prev);
				updated.add(field);
				return updated;
			});
			
			// Store the ISO string in editedVariant for API
			if (value) {
				const dateObj = new Date(value);
				if (dateObj.toString() !== "Invalid Date") {
					setEditedVariant((prev) => ({
						...prev,
						[field]: dateObj.toISOString(),
					}));
				}
			} else {
				setEditedVariant((prev) => ({
					...prev,
					[field]: "",
				}));
			}
		} else {
			// For new variant, if there's a valid date, convert to ISO string
			if (value) {
				const dateObj = new Date(value);
				if (dateObj.toString() !== "Invalid Date") {
					handleNewVariantChangeString(field, dateObj.toISOString());
				} else {
					handleNewVariantChangeString(field, "");
				}
			} else {
				handleNewVariantChangeString(field, "");
			}
		}
	};

	const handleAddVariant = () => {
		if (newVariant.variant_name && newVariant.variant_name.trim()) {
			// Prepare the complete variant data to pass to the parent
			const completeVariant = {
				variant_name: newVariant.variant_name.trim(),
				sku: newVariant.sku || "",
				price: newVariant.price !== null ? newVariant.price : 0,
				sale_price:
					newVariant.sale_price !== null ? newVariant.sale_price : 0,
				sale_start: newVariant.sale_start || "",
				sale_end: newVariant.sale_end || "",
				media: newVariant.media || "",
			};

			// Pass the complete variant data to the parent
			onAddVariant(index, completeVariant);

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

	// Update saveVariant method to use formatDate for dates
	const saveVariant = () => {
		if (!selectedVariant) return;

		// Prepare changes with modified fields
		const changes: Record<string, string | number> = {};
		for (const field of modifiedFields) {
			if (field in editedVariant) {
				// Format dates when sending to API
				if (field === "sale_start" || field === "sale_end") {
					const dateValue = editedVariant[field];
					changes[field] = typeof dateValue === "string" ? dateValue : "";
				} else {
					changes[field] = editedVariant[field];
				}
			}
		}

		// If we have modified fields, notify parent
		if (Object.keys(changes).length > 0) {
			for (const [field, value] of Object.entries(changes)) {
				onVariantChange(index, field, value);
			}
		}
		
		setIsUpdated(false);
		setModifiedFields(new Set());
		setEditedVariant({});
	};

	// Function to add the current variant data as a new variant
	const addAsNew = () => {
		if (selectedVariant) {
			// Create a new variant with base data from the selected variant
			const newVariantData: Partial<Variant> = {
				variant_name: selectedVariant.variant_name,
				sku: selectedVariant.sku,
				price: selectedVariant.price,
				sale_price: selectedVariant.sale_price,
				sale_start: selectedVariant.sale_start,
				sale_end: selectedVariant.sale_end,
				media: selectedVariant.media,
			};

			// Apply any edits that have been made
			Object.entries(editedVariant).forEach(([field, value]) => {
				// This cast is safe because we're only adding properties that exist in Variant
				(newVariantData as Record<string, string | number>)[field] =
					value;
			});

			// Add as a new variant
			onAddVariant(index, newVariantData);

			// Reset update status
			setIsUpdated(false);
			setModifiedFields(new Set());
			setEditedVariant({});

			// Note: We don't clear any fields here to allow the user to continue editing
			// the same variant data they just added
		}
	};

	// Get the display value for a field (either from edits or original variant)
	const getFieldValue = (field: keyof Variant) => {
		if (selectedVariant) {
			// If the field has been edited, use the edited value
			if (field in editedVariant) {
				return editedVariant[field];
			}
			// Otherwise use the original value
			return selectedVariant[field];
		}
		return null;
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

	// Returns appropriate border class based on whether field has been modified
	const getFieldBorderClass = (field: string) => {
		if (!selectedVariant) return "";
		return modifiedFields.has(field)
			? "border-yellow-400 dark:border-yellow-600"
			: "border-gray-300 dark:border-gray-600";
	};

	return (
		<div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700 mt-4">
			<h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
				{selectedVariant ? "Edit Variant" : "New Variant"}
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Variant Name */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Variant Name
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Type className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							value={
								selectedVariant
									? (getFieldValue("variant_name") as string)
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
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${getFieldBorderClass(
								"variant_name"
							)}`}
						/>
					</div>
				</div>

				{/* SKU */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						SKU
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Barcode className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							value={
								selectedVariant
									? (getFieldValue("sku") as string)
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
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${getFieldBorderClass(
								"sku"
							)}`}
						/>
					</div>
				</div>

				{/* Price */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Price
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<DollarSign className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="number"
							step="0.01"
							min="0"
							value={
								selectedVariant
									? (getFieldValue("price") as number)
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
									handleNewVariantChangeNumber(
										"price",
										value
									);
								}
							}}
							placeholder="0.00"
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${getFieldBorderClass(
								"price"
							)}`}
						/>
					</div>
				</div>

				{/* Sale Price */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Sale Price
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Tag className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="number"
							step="0.01"
							min="0"
							value={
								selectedVariant
									? (getFieldValue("sale_price") as number)
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
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${getFieldBorderClass(
								"sale_price"
							)}`}
						/>
					</div>
				</div>

				{/* Sale Start Date */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Sale Start Date (optional)
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="datetime-local"
							value={selectedVariant ? dateInputs.sale_start : newVariant.sale_start || ""}
							onChange={(e) => {
								if (selectedVariant) {
									handleDateChange("sale_start", e.target.value);
								} else {
									handleNewVariantChangeString("sale_start", e.target.value);
								}
							}}
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
								getFieldBorderClass("sale_start")
							}`}
						/>
					</div>
				</div>

				{/* Sale End Date */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Sale End Date (optional)
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="datetime-local"
							value={selectedVariant ? dateInputs.sale_end : newVariant.sale_end || ""}
							onChange={(e) => {
								if (selectedVariant) {
									handleDateChange("sale_end", e.target.value);
								} else {
									handleNewVariantChangeString("sale_end", e.target.value);
								}
							}}
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
								getFieldBorderClass("sale_end")
							}`}
						/>
					</div>
				</div>

				{/* Media URL: TODO: Add this back in if we want to allow media items for variants */}
				{/* <div className="col-span-1 md:col-span-2">
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Media URL
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Image className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							value={
								selectedVariant
									? (getFieldValue("media") as string)
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
							className={`block w-full pl-10 pr-3 py-2 border text-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${getFieldBorderClass(
								"media"
							)}`}
						/>
					</div>
				</div> */}
			</div>

			{/* Action Buttons */}
			<div className="flex justify-between mt-4">
				<div>
					{selectedVariant ? (
						<div className="flex space-x-2">
							<button
								onClick={saveVariant}
								type="button"
								disabled={!isUpdated}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Save className="h-4 w-4 mr-1" />
								Update Variant
							</button>
							<button
								onClick={addAsNew}
								type="button"
								disabled={!isUpdated}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Plus className="h-4 w-4 mr-1" />
								Add As New
							</button>
						</div>
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
				{selectedVariant && (
					<button
						type="button"
						onClick={() =>
							onDeleteVariant(index, selectedVariant.variant_id)
						}
						className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
					>
						<Trash2 className="h-4 w-4 mr-1" />
						Delete Variant
					</button>
				)}
			</div>
		</div>
	);
};

export default ProductOptionVariant;
