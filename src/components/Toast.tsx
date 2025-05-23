import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ToastProps {
	message: string;
	type: "success" | "error" | "info";
	onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			handleClose();
		}, 10000);

		return () => clearTimeout(timer);
	}, []);

	const handleClose = () => {
		setIsExiting(true);
		setTimeout(() => {
			onClose();
		}, 1000); // Wait for animation to complete
	};

	const bgColor =
		type === "success"
			? "bg-green-50 dark:bg-green-900/90"
			: type === "error"
			? "bg-red-50 dark:bg-red-900/90"
			: "bg-blue-50 dark:bg-blue-900/90";

	const textColor =
		type === "success"
			? "text-green-800 dark:text-green-200"
			: type === "error"
			? "text-red-800 dark:text-red-200"
			: "text-blue-800 dark:text-blue-200";

	const iconColor =
		type === "success"
			? "text-green-500 dark:text-green-400"
			: type === "error"
			? "text-red-500 dark:text-red-400"
			: "text-blue-500 dark:text-blue-400";

	return (
		<div
			className={`fixed bottom-4 inset-x-0 mx-auto max-w-sm w-full ${bgColor} rounded-lg shadow-lg z-[1000] ${
				isExiting ? "toast-exit" : "toast-enter"
			}`}
		>
			<div className="p-4">
				<div className="flex items-start">
					<div className="ml-3 w-0 flex-1 pt-0.5">
						<p className={`text-sm font-medium ${textColor}`}>
							{message}
						</p>
					</div>
					<div className="ml-4 flex-shrink-0 flex">
						<button
							onMouseDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleClose();
							}}
							className={`inline-flex rounded-md p-1.5 ${iconColor} hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-600`}
						>
							<span className="sr-only">Close</span>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Toast;
