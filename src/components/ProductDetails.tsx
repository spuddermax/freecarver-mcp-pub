// /src/components/ProductDetails.tsx

import { ChangeEvent, useEffect, useState } from "react";
import { Box, Barcode, FileText, Save } from "lucide-react";

export interface ProductDetailsProps {
	productSKU: string;
	name: string;
	description: string;
	onInputChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
	// Optionally, add an onSaveDetails callback here if needed.
}

export function ProductDetails({
	productSKU,
	name,
	description,
	onInputChange,
}: ProductDetailsProps) {
	// Store the original details on mount.
	const [originalDetails, setOriginalDetails] = useState({
		productSKU,
		name,
		description,
	});

	useEffect(() => {
		setOriginalDetails({ productSKU, name, description });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const detailsUnchanged =
		JSON.stringify(originalDetails) ===
		JSON.stringify({ productSKU, name, description });

	const handleSaveDetails = () => {
		// Replace this alert with your actual save functionality.
		alert("Save Details Clicked");
		setOriginalDetails({ productSKU, name, description });
	};

	return (
		<div>
			<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
				<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
					Product Details
				</legend>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Product Name
						</label>
						<div className="mt-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Box className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								name="name"
								id="name"
								value={name}
								onChange={onInputChange}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Product SKU
						</label>
						<div className="mt-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Barcode className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								name="sku"
								id="sku"
								value={productSKU}
								onChange={onInputChange}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Description
						</label>
						<div className="mt-1 relative">
							<div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
								<FileText className="h-5 w-5 text-gray-400" />
							</div>
							<textarea
								name="description"
								id="description"
								rows={4}
								value={description}
								onChange={onInputChange}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</div>
			</fieldset>
			{/* Save Details Button */}
			<div className="mt-4 flex justify-center">
				<button
					type="button"
					onClick={handleSaveDetails}
					disabled={detailsUnchanged}
					className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						detailsUnchanged
							? "text-gray-500 bg-blue-900 cursor-not-allowed"
							: "text-white bg-blue-600 hover:bg-blue-700"
					}`}
				>
					<Save className="h-4 w-4 mr-1" />
					Save Details
				</button>
			</div>
		</div>
	);
}
