import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
	isOpen: boolean;
	message?: string;
}

export function LoadingModal({
	isOpen,
	message = "Updating...",
}: LoadingModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full flex flex-col items-center">
				<Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
				<p className="text-lg font-medium text-gray-700 dark:text-gray-300 text-center">
					{message}
				</p>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
					Please wait while we process your request...
				</p>
			</div>
		</div>
	);
}
