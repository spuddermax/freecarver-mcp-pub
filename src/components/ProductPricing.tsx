// /src/components/ProductPricing.tsx

import { ChangeEvent, useState, useEffect } from "react";
import { DollarSign, Tag, Calendar, Save } from "lucide-react";

export interface ProductPricingProps {
	price: number;
	salePrice?: number;
	saleStart?: string;
	saleEnd?: string;
	onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
	onSavePricing?: () => void;
}

export function ProductPricing({
	price,
	salePrice,
	saleStart,
	saleEnd,
	onInputChange,
	onSavePricing,
}: ProductPricingProps) {
	// Store the original pricing values when the component first mounts.
	const [originalPricing, setOriginalPricing] = useState({
		price,
		salePrice,
		saleStart,
		saleEnd,
	});

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
	const handleSavePricing = () => {
		if (onSavePricing) {
			onSavePricing();
		} else {
			alert("Save Pricing Clicked");
		}
		setOriginalPricing({ price, salePrice, saleStart, saleEnd });
	};

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
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</div>
				<div>
					<label
						htmlFor="salePrice"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Tag className="h-5 w-5 text-gray-400" />
						</div>
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
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
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
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Calendar className="h-5 w-5 text-gray-400" />
						</div>
						Sale End (optional)
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
							? "text-gray-500 bg-gray-400 cursor-not-allowed"
							: "text-white bg-blue-700 hover:bg-blue-600"
					}`}
				>
					<Save className="h-4 w-4 mr-1" />
					Save Pricing
				</button>
			</div>
		</fieldset>
	);
}
