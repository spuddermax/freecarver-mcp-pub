// /src/components/ProductDetails.tsx

import { ChangeEvent } from "react";
import { Box, Barcode, FileText } from "lucide-react";

interface ProductDetailsProps {
	productSKU: string;
	name: string;
	description: string;
	onInputChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
}

export function ProductDetails({
	productSKU,
	name,
	description,
	onInputChange,
}: ProductDetailsProps) {
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
		</div>
	);
}
