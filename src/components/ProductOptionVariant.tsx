import React from "react";

interface ProductOptionVariantProps {
	index: number;
	inputValue: string;
	onInputChange: (index: number, value: string) => void;
	onKeyPress: (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => void;
}

const ProductOptionVariant: React.FC<ProductOptionVariantProps> = ({
	index,
	inputValue,
	onInputChange,
	onKeyPress,
}) => {
	return (
		<div className="p-4">
			<label className="block text-sm font-medium text-gray-700">
				Variant:
			</label>
			<input
				type="text"
				value={inputValue || ""}
				onChange={(e) => onInputChange(index, e.target.value)}
				onKeyPress={(e) => onKeyPress(e, index)}
				placeholder="Enter variant name and press Enter"
				className="block w-full pl-3 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
			/>
		</div>
	);
};

export default ProductOptionVariant;
