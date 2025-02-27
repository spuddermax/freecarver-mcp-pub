import React, { useState } from "react";
import { OptionIcon, Trash2, SlidersHorizontal, Star } from "lucide-react";

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
	console.log(initialOptions);
	const [options, setOptions] = useState<Option[]>(initialOptions);
	const [newVariantInputs, setNewVariantInputs] = useState<{
		[key: number]: string;
	}>({});

	const updateOptions = (newOptions: Option[]) => {
		setOptions(newOptions);
		onChange(newOptions);
	};

	const handleOptionNameChange = (index: number, newName: string) => {
		const updatedOptions = options.map((option, i) =>
			i === index ? { ...option, name: newName } : option
		);
		updateOptions(updatedOptions);
	};

	const handleAddVariant = (index: number, variantValue: string) => {
		if (!variantValue.trim()) return;
		const updatedOptions = options.map((option, i) => {
			if (i === index) {
				return {
					...option,
					variant_name: variantValue.trim(),
					sku: variantValue.trim(),
				};
			}
			return option;
		});
		updateOptions(updatedOptions);
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
					variant_name: "",
					sku: "",
				};
			}
			return option;
		});
		updateOptions(updatedOptions);
	};

	const handleNewVariantInputChange = (index: number, value: string) => {
		setNewVariantInputs((prev) => ({ ...prev, [index]: value }));
	};

	const handleVariantKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const variant = newVariantInputs[index] || "";
			handleAddVariant(index, variant);
			setNewVariantInputs((prev) => ({ ...prev, [index]: "" }));
		}
	};

	const handleAddOption = () => {
		const newOption: Option = {
			option_id: Date.now(),
			option_name: "",
			variants: [],
		};
		updateOptions([...options, newOption]);
	};

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Options
			</legend>
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
								handleOptionNameChange(index, e.target.value)
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
								Option Variants
							</label>
							<div className="mt-1 relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<SlidersHorizontal className="h-5 w-5 text-gray-400" />
								</div>
								<select
									id={`variant-select-${index}`}
									className="block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								>
									{option.variants.map((variant) => (
										<option
											key={variant.variant_id}
											value={variant.variant_name}
										>
											{variant.variant_name} ($
											{variant.price})
										</option>
									))}
								</select>
							</div>
						</>
					)}

					{/* New Variant Input */}
					{option.option_name && (
						<div className="flex items-center space-x-2 mt-2">
							<label className="block text-sm font-medium text-gray-700">
								New Variant:
							</label>
							<input
								type="text"
								value={newVariantInputs[index] || ""}
								onChange={(e) =>
									handleNewVariantInputChange(
										index,
										e.target.value
									)
								}
								onKeyPress={(e) =>
									handleVariantKeyPress(e, index)
								}
								className="block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					)}

					<div className="flex justify-end space-x-2 mt-4">
						<button
							type="button"
							onClick={() => handleRemoveOption(index)}
							className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<Trash2 className="h-4 w-4 mr-1" />
							Delete
						</button>
					</div>
				</div>
			))}
			<div className="flex justify-end space-x-2 mt-4">
				<button
					onClick={handleAddOption}
					type="button"
					className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
				>
					Add Option
				</button>
				{options.some((opt) => opt.option_name) && (
					<button
						onClick={() => {
							const selectedIndex = options.findIndex(
								(opt) => opt.option_name
							);
							if (selectedIndex !== -1) {
								const variant =
									newVariantInputs[selectedIndex] || "";
								handleAddVariant(selectedIndex, variant);
								setNewVariantInputs((prev) => ({
									...prev,
									[selectedIndex]: "",
								}));
							}
						}}
						type="button"
						className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
						disabled={!options.some((opt) => opt.option_name)}
					>
						Add Variant
					</button>
				)}
			</div>
		</fieldset>
	);
};

export default ProductOptions;
