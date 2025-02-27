import React, { useState, useEffect } from "react";
import {
	OptionIcon,
	Trash2,
	SlidersHorizontal,
	Star,
	Plus,
	Code,
	X,
} from "lucide-react";
import ProductOptionVariant from "./ProductOptionVariant";
import { ProductOptionsJsonEditor } from "./ProductOptionsJsonEditor";
import { Modal } from "../components/Modal";

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
	initialOptions?: Option[];
	onChange: (options: Option[]) => void;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
	initialOptions = [],
	onChange,
}) => {
	//console.log(initialOptions);
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

	// Update the JSON text when options change
	useEffect(() => {
		setJsonText(JSON.stringify(options, null, 2));
	}, [options]);

	const updateOptions = (newOptions: Option[]) => {
		setOptions(newOptions);
		onChange(newOptions);
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
		const updatedOptions = options.filter((_, i) => i !== index);
		updateOptions(updatedOptions);
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
		const updatedOptions = options.map((option, i) => {
			if (i === optionIndex) {
				const variantName = selectedVariants[optionIndex];
				const variantIndex = option.variants.findIndex(
					(v) => v.variant_name === variantName
				);

				if (variantIndex >= 0) {
					const updatedVariants = [...option.variants];
					updatedVariants[variantIndex] = {
						...updatedVariants[variantIndex],
						[field]: value,
					};

					return {
						...option,
						variants: updatedVariants,
					};
				}
			}
			return option;
		});

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
			<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
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

			<ProductOptionsJsonEditor
				isOpen={jsonEditorOpen}
				jsonText={jsonText}
				onJsonTextChange={setJsonText}
				onSave={handleSaveJson}
				onClose={() => setJsonEditorOpen(false)}
			/>
		</>
	);
};

export default ProductOptions;
