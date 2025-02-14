import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminUser } from "../lib/api_client/adminUsers";

export interface UserDeleteProps {
	userId: string;
	onMessage: (
		message: { type: "success" | "error"; text: string } | null
	) => void;
	onDelete?: () => void;
}

export function UserDelete({ userId, onMessage, onDelete }: UserDeleteProps) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (
			!window.confirm(
				"Are you sure you want to delete your account? This action cannot be undone."
			)
		) {
			return;
		}

		setLoading(true);
		onMessage(null);

		try {
			await deleteAdminUser(userId);
			onMessage({
				type: "success",
				text: "Your account has been deleted successfully.",
			});
			if (onDelete) onDelete();
		} catch (error) {
			console.error("Error deleting account:", error);
			onMessage({
				type: "error",
				text: "Error deleting account. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<button
				type="button"
				onClick={handleDelete}
				disabled={loading}
				className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
					loading ? "bg-red-400" : "bg-red-600 hover:bg-red-700"
				}`}
			>
				<Trash2 className="h-4 w-4 mr-2" />
				{loading ? "Deleting..." : "Delete Account"}
			</button>
		</div>
	);
}
