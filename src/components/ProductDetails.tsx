// /src/components/ProductDetails.tsx

import { ChangeEvent, useEffect, useState } from "react";
import { Box, Barcode, FileText, Eye } from "lucide-react";
import { updateProduct } from "../lib/api_client/products";
import { Modal } from "../components/Modal";
import Toast from "../components/Toast";

export interface ProductDetailsProps {
	productId: string;
	productSKU: string;
	name: string;
	description: string;
	onInputChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
	// Optionally, add a callback prop to show a toast if needed.
}

export function ProductDetails({
	productId,
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

	// Toast state for showing notifications.
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	// Track whether to show the description preview modal.
	const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

	useEffect(() => {
		setOriginalDetails({ productSKU, name, description });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const detailsUnchanged =
		JSON.stringify(originalDetails) ===
		JSON.stringify({ productSKU, name, description });

	const handleSaveDetails = async () => {
		try {
			// Call your API to update the product details.
			await updateProduct({
				id: productId,
				name: name,
				sku: productSKU,
				description: description,
			});
			setOriginalDetails({ productSKU, name, description });
			setToast({
				message: "Product details updated successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error updating product details", error);
			setToast({
				message: "Error updating product details: " + error.message,
				type: "error",
			});
		}
	};

	return (
		<div>
			<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
				<legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2">
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
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-700"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="sku"
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
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-700"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Description
							<button
								type="button"
								onClick={() => setShowDescriptionPreview(true)}
								disabled={!description.trim()}
								className={`inline-flex items-center gap-1 ml-2 px-3 py-1 text-xs rounded focus:outline-none ${
									description.trim()
										? "text-white bg-blue-600 hover:bg-blue-700"
										: "text-gray-500 bg-blue-900 cursor-not-allowed"
								}`}
							>
								<Eye className="h-4 w-4" />
								Preview
							</button>
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
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600
                                    rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 text-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</div>
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
						Save Details
					</button>
				</div>
			</fieldset>
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
			{/* Description Preview Modal */}
			{showDescriptionPreview && (
				<Modal
					isOpen={showDescriptionPreview}
					title="Description Preview"
					onClose={() => setShowDescriptionPreview(false)}
				>
					<div className="p-4 max-h-[80vh] overflow-y-auto">
						<div
							dangerouslySetInnerHTML={{ __html: description }}
						/>
					</div>
				</Modal>
			)}
		</div>
	);
}
