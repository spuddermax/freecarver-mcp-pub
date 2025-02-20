import React, { useState } from "react";
import { Option } from "../types/ProductData";
import { OptionIcon } from "lucide-react";

export interface APIOption {
	id: number;
	name: string;
}

export interface ProductOptionsProps {
	initialOptions?: Option[];
	initialSKUs?: string[];
	onChange: (options: Option[]) => void;
	availableOptions?: APIOption[];
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
	initialOptions = [],
	initialSKUs = [],
	onChange,
	availableOptions = [],
}) => {
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
					values: [...option.values, variantValue.trim()],
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
				const filteredValues = option.values.filter(
					(_, j) => j !== variantIndex
				);
				return { ...option, values: filteredValues };
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
		const newOption: Option = { id: Date.now(), name: "", values: [] };
		updateOptions([...options, newOption]);
	};

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Options
			</legend>
			{options.map((option, index) => (
				<div key={option.id} className="mb-4">
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
						<select
							id={`option-name-${index}`}
							value={option.name || ""} // Ensure value is always a string
							onChange={(e) =>
								handleOptionNameChange(index, e.target.value)
							}
							className="block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
						>
							<option value="">Select Option</option>
							{availableOptions.map((opt) => (
								<option key={opt.id} value={opt.name}>
									{opt.name}
								</option>
							))}
						</select>
						<button
							onClick={() => handleRemoveOption(index)}
							className="absolute inset-y-0 right-0 pr-3 text-red-600 hover:text-red-800 text-sm"
							type="button"
						>
							Remove
						</button>
					</div>

					{/* Variant Select */}
					{option.name && (
						<>
							<label
								htmlFor={`variant-select-${index}`}
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2"
							>
								Option Variants
							</label>
							<select
								id={`variant-select-${index}`}
								multiple
								className="block w-full mt-1 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							>
								{option.values.map((value, idx) => (
									<option key={idx} value={value}>
										{value}{" "}
										<button
											onClick={() =>
												handleRemoveVariant(index, idx)
											}
											className="text-red-600 hover:text-red-800 ml-2"
											type="button"
										>
											Remove
										</button>
									</option>
								))}
							</select>
						</>
					)}

					{/* New Variant Input */}
					{option.name && (
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
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
						</div>
					)}
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
				{options.some((opt) => opt.name) && (
					<button
						onClick={() => {
							const selectedIndex = options.findIndex(
								(opt) => opt.name
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
						disabled={!options.some((opt) => opt.name)}
					>
						Add Variant
					</button>
				)}
			</div>
		</fieldset>
	);
};

export default ProductOptions;
