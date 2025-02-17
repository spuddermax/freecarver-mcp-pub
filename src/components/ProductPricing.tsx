import { ChangeEvent } from "react";

export interface ProductPricingProps {
	price: number;
	salePrice?: number;
	saleStart?: string;
	saleEnd?: string;
	onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ProductPricing({
	price,
	salePrice,
	saleStart,
	saleEnd,
	onInputChange,
}: ProductPricingProps) {
	return (
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
						value={price}
						onChange={onInputChange}
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
						value={salePrice || ""}
						onChange={onInputChange}
						className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
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
					<input
						type="datetime-local"
						name="saleStart"
						id="saleStart"
						value={saleStart || ""}
						onChange={onInputChange}
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
						value={saleEnd || ""}
						onChange={onInputChange}
						className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
		</fieldset>
	);
}
