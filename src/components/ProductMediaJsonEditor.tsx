// /src/components/ProductMediaJsonEditor.tsx

import "react";
import { Modal } from "./Modal";
import { Save, X } from "lucide-react";

export interface ProductMediaJsonEditorProps {
	isOpen: boolean;
	jsonText: string;
	onJsonTextChange: (text: string) => void;
	onSave: (parsedJSON: any) => void;
	onClose: () => void;
}

export function ProductMediaJsonEditor({
	isOpen,
	jsonText,
	onJsonTextChange,
	onSave,
	onClose,
}: ProductMediaJsonEditorProps) {
	const handleApply = () => {
		try {
			const parsedJSON = JSON.parse(jsonText);
			onSave(parsedJSON);
		} catch (error) {
			alert("Invalid JSON. Please check your syntax and try again.");
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="JSON Edit">
			<textarea
				value={jsonText}
				onChange={(e) => onJsonTextChange(e.target.value)}
				className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 w-full h-60 overflow-auto border border-gray-300 dark:border-gray-600 p-2 rounded"
			/>
			<div className="mt-4 flex justify-end gap-4">
				<button
					type="button"
					onClick={handleApply}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<Save className="h-4 w-4 mr-1" />
					Apply Changes
				</button>
				<button
					type="button"
					onClick={onClose}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<X className="h-4 w-4 mr-1" />
					Close
				</button>
			</div>
		</Modal>
	);
}
