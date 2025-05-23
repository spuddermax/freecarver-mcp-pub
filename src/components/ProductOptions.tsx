import React, { useState, useEffect, useRef } from "react";
import {
	OptionIcon,
	Trash2,
	SlidersHorizontal,
	Star,
	Plus,
	Code,
	X,
	Save,
} from "lucide-react";
import ProductOptionVariant from "./ProductOptionVariant";
import { ProductOptionsJsonEditor } from "./ProductOptionsJsonEditor";
import { Modal } from "../components/Modal";
import Toast from "../components/Toast";
import { updateProductOptionsAndVariants } from "../lib/api_client/productOptions";
import { Product, ProductOption } from "../types/Interfaces";
import { LoadingModal } from "./LoadingModal";

// Local interface definitions
export interface Option {
	option_id: number;
	option_name: string;
	variants: Variant[];
}

export interface APIOption {
	id: number;
	option_name: string;
}

export interface Variant {
	variant_id: number;
	variant_name: string;
	sku: string;
	price: number;
	sale_price: number;
	sale_start: string;
	sale_end: string;
	media: string;
}

export interface ProductOptionsProps {
	product: Product;
	onChange: (options: Option[]) => void;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
	product,
	onChange,
}) => {
	// Extract product ID and convert options to the local Option format
	const productId = product.id.toString();
	// console.log("product:", product);
	// console.log("product.sale_start:", product.sale_end);
	// console.log("product.options.variants:", product.options[0].variants);

	const initialOptions = (product.options || []).map(
		(opt: ProductOption) => ({
			option_id: opt.option_id,
			option_name: opt.option_name,
			variants: Array.isArray(opt.variants) 
				? opt.variants
					// Filter out any variant with null variant_id
					.filter(v => v.variant_id !== null) 
					.map((v) => ({
						variant_id: v.variant_id,
						variant_name: v.variant_name,
						sku: v.sku,
						price: v.price,
						sale_price: v.sale_price,
						sale_start: v.sale_start ? String(v.sale_start) : "",
						sale_end: v.sale_end ? String(v.sale_end) : "",
						// Convert media to string (our Variant interface expects a string)
						media: Array.isArray(v.media)
							? JSON.stringify(v.media)
							: typeof v.media === "object" && v.media !== null
							? JSON.stringify(v.media)
							: v.media
							? String(v.media)
							: "",
					}))
				: [],
		})
	);

	const [options, setOptions] = useState<Option[]>(initialOptions);
	const [newVariantInputs, setNewVariantInputs] = useState<{
		[key: number]: string;
	}>({});
	const [selectedVariants, setSelectedVariants] = useState<{
		[key: number]: string;
	}>({});
	const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
	const [jsonText, setJsonText] = useState(JSON.stringify(options, null, 2));
	const [newVariantData, setNewVariantData] = useState<{
		[key: number]: Partial<Variant>;
	}>({});
	const [deleteVariantInfo, setDeleteVariantInfo] = useState<{
		optionIndex: number;
		variantId: number;
	} | null>(null);

	// State for tracking original options and save button visibility
	const [originalOptionsJSON, setOriginalOptionsJSON] = useState(
		JSON.stringify(initialOptions)
	);
	const saveButtonRef = useRef<HTMLButtonElement>(null);
	const [isSaveButtonVisible, setIsSaveButtonVisible] = useState(true);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error" | "info";
	} | null>(null);

	// Loading state for API operations
	const [isLoading, setIsLoading] = useState(false);

	// Add these state variables after other useState declarations
	const [showDeleteOptionModal, setShowDeleteOptionModal] = useState(false);
	const [optionToDeleteIndex, setOptionToDeleteIndex] = useState<number | null>(null);

	// Update the JSON text when options change
	useEffect(() => {
		setJsonText(JSON.stringify(options, null, 2));
	}, [options]);

	// Set up observer for save button visibility
	useEffect(() => {
		if (!saveButtonRef.current) return;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					setIsSaveButtonVisible(entry.isIntersecting);
				});
			},
			{ root: null, threshold: 0.1 }
		);
		observer.observe(saveButtonRef.current);
		return () => {
			if (saveButtonRef.current) {
				observer.unobserve(saveButtonRef.current);
			}
		};
	}, []);

	// Check if options have changed
	const isOptionsUnchanged = JSON.stringify(options) === originalOptionsJSON;

	const updateOptions = (newOptions: Option[]) => {
		setOptions(newOptions);
		onChange(newOptions);
	};

	// Handle saving options explicitly
	const handleSaveOptions = async () => {
		setIsLoading(true);
		try {
			// First, call onChange to notify parent of changes (local state update)
			onChange(options);

			// If we have a productId, save to the backend
			if (productId) {
				// Save to the backend using the API client
				await updateProductOptionsAndVariants(productId, options);
			}

			// Update the original options JSON after saving
			setOriginalOptionsJSON(JSON.stringify(options));

			// Show success message
			setToast({
				message: "Product options saved successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error saving product options:", error);
			setToast({
				message: "Error saving options: " + error.message,
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveJson = (parsedJson: Option[]) => {
		updateOptions(parsedJson);
		setJsonEditorOpen(false);
	};

	const handleOptionNameChange = (index: number, newName: string) => {
		const updatedOptions = options.map((option, i) =>
			i === index ? { ...option, option_name: newName } : option
		);
		updateOptions(updatedOptions);
	};

	const handleAddVariant = (index: number, variantData: Partial<Variant>) => {
		if (!variantData.variant_name || !variantData.variant_name.trim())
			return;

		const newVariant: Variant = {
			variant_id: Date.now(),
			variant_name: variantData.variant_name.trim(),
			sku: variantData.sku || "",
			price:
				typeof variantData.price === "number" ? variantData.price : 0,
			sale_price:
				typeof variantData.sale_price === "number"
					? variantData.sale_price
					: 0,
			sale_start: variantData.sale_start || "",
			sale_end: variantData.sale_end || "",
			media: variantData.media || "",
		};

		const updatedOptions = options.map((option, i) => {
			if (i === index) {
				return {
					...option,
					variants: [...option.variants, newVariant],
				};
			}
			return option;
		});

		// Clear the variant data after adding
		setNewVariantData((prev) => {
			const updated = { ...prev };
			delete updated[index];
			return updated;
		});

		// Clear the variant input after adding
		setNewVariantInputs((prev) => ({ ...prev, [index]: "" }));

		// Update the options
		updateOptions(updatedOptions);

		// Auto-select the newly added variant
		setSelectedVariants((prev) => ({
			...prev,
			[index]: newVariant.variant_name,
		}));
	};

	const handleRemoveOption = (index: number) => {
		const optionToRemove = options[index];
		
		// Check if the option has variants
		if (optionToRemove.variants && optionToRemove.variants.length > 0) {
			// Show the confirmation modal
			setOptionToDeleteIndex(index);
			setShowDeleteOptionModal(true);
		} else {
			// No variants, delete directly without confirmation
			deleteOption(index);
		}
	};

	// Add this function to handle the actual deletion
	const deleteOption = (index: number) => {
		const updatedOptions = options.filter((_, i) => i !== index);
		updateOptions(updatedOptions);
		
		// Reset the state
		setOptionToDeleteIndex(null);
		setShowDeleteOptionModal(false);
	};

	const handleRemoveVariant = (optionIndex: number, variantIndex: number) => {
		const updatedOptions = options.map((option, i) => {
			if (i === optionIndex) {
				return {
					...option,
					variants: option.variants.filter(
						(_, vi) => vi !== variantIndex
					),
				};
			}
			return option;
		});
		updateOptions(updatedOptions);
	};

	const handleNewVariantInputChange = (index: number, value: string) => {
		setNewVariantInputs((prev) => ({ ...prev, [index]: value }));

		// Also update the variant data
		setNewVariantData((prev) => ({
			...prev,
			[index]: {
				...prev[index],
				variant_name: value,
			},
		}));
	};

	// Handle changes to other variant fields for new variants
	const handleNewVariantDataChange = (
		index: number,
		field: string,
		value: string | number | null
	) => {
		// Use null coalescing to handle numeric fields
		const safeValue =
			value === null && (field === "price" || field === "sale_price")
				? 0
				: value;

		setNewVariantData((prev) => {
			const updated = { ...prev };
			if (!updated[index]) {
				updated[index] = {};
			}
			updated[index] = {
				...updated[index],
				[field]: safeValue,
			};
			return updated;
		});
	};

	const handleVariantKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const variant = newVariantInputs[index] || "";
			handleAddVariant(index, { variant_name: variant });
			setNewVariantInputs((prev) => ({ ...prev, [index]: "" }));
		}
	};

	const handleVariantChange = (
		optionIndex: number,
		field: string,
		value: string | number
	) => {
		console.log(
			`🔄 Variant change received: field=${field}, value=${value}, type=${typeof value}`
		);

		const updatedOptions = options.map((option, i) => {
			if (i === optionIndex) {
				const variantName = selectedVariants[optionIndex];

				console.log(
					`Finding variant with name "${variantName}" in option ${optionIndex}`
				);

				const variantIndex = option.variants.findIndex(
					(v) => v.variant_name === variantName
				);

				if (variantIndex >= 0) {
					const updatedVariants = [...option.variants];

					// Enhanced logging for date fields
					const isDateField =
						field === "sale_start" || field === "sale_end";
					if (isDateField) {
						console.log(`📅 Updating date field: ${field}`);
						console.log(
							`  Previous value: "${
								updatedVariants[variantIndex][
									field as keyof Variant
								]
							}"`
						);
						console.log(`  New value: "${value}"`);
					} else {
						// Log before update for non-date fields
						console.log(
							`Updating variant[${variantIndex}].${field} from`,
							updatedVariants[variantIndex][
								field as keyof Variant
							],
							"to",
							value
						);
					}

					// Create a new variant object with the updated field
					updatedVariants[variantIndex] = {
						...updatedVariants[variantIndex],
						[field]: value,
					};

					console.log(
						`Updated variant ${variantIndex} in option ${optionIndex}`
					);

					return {
						...option,
						variants: updatedVariants,
					};
				} else {
					console.warn(
						`⚠️ Could not find variant with name "${variantName}" in option ${optionIndex}`
					);
				}
			}
			return option;
		});

		console.log("Calling updateOptions with updated variant data");
		updateOptions(updatedOptions);
	};

	const handleAddOption = () => {
		const newOption: Option = {
			option_id: Date.now(),
			option_name: "",
			variants: [],
		};
		updateOptions([...options, newOption]);
	};

	const handleVariantSelect = (index: number, value: string) => {
		setSelectedVariants((prev) => ({
			...prev,
			[index]: value,
		}));
	};

	const getSelectedVariant = (optionIndex: number): Variant | undefined => {
		const option = options[optionIndex];
		const variantName = selectedVariants[optionIndex];

		if (option && variantName) {
			return option.variants.find((v) => v.variant_name === variantName);
		}

		return undefined;
	};

	// Request to delete a variant (shows confirmation modal)
	const handleRequestDeleteVariant = (
		optionIndex: number,
		variantId: number
	) => {
		setDeleteVariantInfo({ optionIndex, variantId });
	};

	// Actually delete the variant after confirmation
	const confirmDeleteVariant = () => {
		if (!deleteVariantInfo) return;

		const { optionIndex, variantId } = deleteVariantInfo;

		const updatedOptions = options.map((option, i) => {
			if (i === optionIndex) {
				return {
					...option,
					variants: option.variants.filter(
						(variant) => variant.variant_id !== variantId
					),
				};
			}
			return option;
		});

		// Clear the selected variant if it was deleted
		setSelectedVariants((prev) => {
			const updated = { ...prev };
			delete updated[optionIndex];
			return updated;
		});

		updateOptions(updatedOptions);
		setDeleteVariantInfo(null);
	};

	return (
		<>
			<fieldset className="border rounded-lg p-4 border-cyan-200 dark:border-cyan-700 relative">
				<legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2 flex items-center justify-between">
					<span>Product Options</span>
				</legend>
				{options.length > 0 && (
					<div id="options-container">
						{options.map((option, index) => (
							<div
								key={option.option_id}
								className="mb-4 border rounded-lg p-4 border-gray-200 dark:border-gray-700"
							>
								{/* Option Name Select */}
								<label
									htmlFor={`option-name-${index}`}
									className="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Option Name
								</label>
								<div className="mt-1 relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<OptionIcon className="h-5 w-5 text-gray-400" />
									</div>
									<input
										type="text"
										id={`option-name-${index}`}
										value={option.option_name || ""}
										onChange={(e) =>
											handleOptionNameChange(
												index,
												e.target.value
											)
										}
										placeholder="Enter Option Name"
										className="block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
									/>
								</div>

								{/* Variant Select */}
								{option.option_name && (
									<>
										<label
											htmlFor={`variant-select-${index}`}
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2"
										>
											Option Variants{" "}
											{option.variants.length === 0 && (
												<span className="text-xs text-amber-600">
													(Add a variant first)
												</span>
											)}
										</label>
										<div className="mt-1 relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<SlidersHorizontal className="h-5 w-5 text-gray-400" />
											</div>
											<select
												id={`variant-select-${index}`}
												className={`block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
													option.variants.length === 0
														? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
														: ""
												}`}
												onChange={(e) =>
													handleVariantSelect(
														index,
														e.target.value
													)
												}
												value={
													selectedVariants[index] ||
													""
												}
												disabled={
													option.variants.length === 0
												}
											>
												<option value="">
													{option.variants.length ===
													0
														? "No variants available yet"
														: "Select Variant..."}
												</option>
												{option.variants.map(
													(variant) => (
														<option
															key={
																variant.variant_id
															}
															value={
																variant.variant_name
															}
														>
															★{" "}
															{
																variant.variant_name
															}{" "}
															($
															{variant.price})
														</option>
													)
												)}
											</select>
										</div>
									</>
								)}

								{/* Variant Editor */}
								{option.option_name && (
									<ProductOptionVariant
										index={index}
										inputValue={
											newVariantInputs[index] || ""
										}
										onInputChange={
											handleNewVariantInputChange
										}
										onKeyPress={handleVariantKeyPress}
										selectedVariant={getSelectedVariant(
											index
										)}
										onVariantChange={
											getSelectedVariant(index)
												? handleVariantChange
												: handleNewVariantDataChange
										}
										onAddVariant={handleAddVariant}
										onDeleteVariant={
											handleRequestDeleteVariant
										}
									/>
								)}

								<div className="flex justify-end space-x-2 mt-4">
									<button
										type="button"
										onClick={() =>
											handleRemoveOption(index)
										}
										className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
									>
										<Trash2 className="h-4 w-4 mr-1" />
										Delete Option
									</button>
								</div>
							</div>
						))}
					</div>
				)}
				<div className="flex justify-start space-x-2">
					<button
						onClick={handleAddOption}
						type="button"
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Option
					</button>
					<button
						type="button"
						onClick={() => setJsonEditorOpen(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-600"
					>
						<Code className="h-3 w-3 mr-1" />
						Edit Options JSON
					</button>
					<button
						type="button"
						ref={saveButtonRef}
						onClick={handleSaveOptions}
						disabled={isOptionsUnchanged || isLoading}
						className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							isOptionsUnchanged || isLoading
								? "text-gray-500 bg-blue-900 cursor-not-allowed"
								: "text-white bg-blue-600 hover:bg-blue-700"
						}`}
					>
						<Save className="h-4 w-4 mr-1" />
						Save Options
					</button>
				</div>
			</fieldset>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteVariantInfo !== null}
				onClose={() => setDeleteVariantInfo(null)}
				title="Confirm Delete"
			>
				<div>
					<p>
						Are you sure you want to delete this variant? You must
						still save the options to actually remove it from the
						database.
					</p>
					<div className="mt-4 flex justify-end gap-4">
						<button
							type="button"
							onClick={() => setDeleteVariantInfo(null)}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							<X className="h-4 w-4 mr-1" />
							Cancel
						</button>
						<button
							type="button"
							onClick={confirmDeleteVariant}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<Trash2 className="h-4 w-4 mr-1" />
							Delete
						</button>
					</div>
				</div>
			</Modal>

			{/* Fixed Save Options button when original is scrolled out of view */}
			{!isOptionsUnchanged && !isSaveButtonVisible && (
				<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
					<button
						type="button"
						onClick={handleSaveOptions}
						disabled={isLoading}
						className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							isLoading
								? "bg-blue-300 cursor-not-allowed"
								: "bg-blue-700 hover:bg-blue-600"
						}`}
					>
						<Save className="h-4 w-4 mr-1" />
						Save Options
					</button>
				</div>
			)}

			<ProductOptionsJsonEditor
				isOpen={jsonEditorOpen}
				jsonText={jsonText}
				onJsonTextChange={setJsonText}
				onSave={handleSaveJson}
				onClose={() => setJsonEditorOpen(false)}
			/>

			{/* Loading Modal */}
			<LoadingModal
				isOpen={isLoading}
				message="Updating product options..."
			/>

			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}

			{showDeleteOptionModal && optionToDeleteIndex !== null && (
				<Modal
					isOpen={showDeleteOptionModal}
					title="Confirm Deletion"
					onClose={() => setShowDeleteOptionModal(false)}
				>
					<div className="p-5 space-y-4">
						<p className="text-gray-700 dark:text-gray-300">
							Are you sure you want to delete the option "
							<span className="font-semibold">{options[optionToDeleteIndex].option_name}</span>"?
						</p>
						<p className="text-gray-700 dark:text-gray-300">
							This will delete all {options[optionToDeleteIndex].variants.length} variants 
							associated with this option.
						</p>
						<div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 my-3">
							<div className="flex">
								<div className="ml-3">
									<p className="text-sm text-yellow-700 dark:text-yellow-200">
										You must click "Save Options" after removing this option to permanently 
										delete it from the database.
									</p>
								</div>
							</div>
						</div>
						<div className="flex justify-end space-x-3 mt-4">
							<button
								type="button"
								onClick={() => setShowDeleteOptionModal(false)}
								className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => deleteOption(optionToDeleteIndex)}
								className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
							>
								Delete
							</button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
};

export default ProductOptions;
