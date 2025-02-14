import React, { useRef, useState } from "react";
import { Lock, Loader2, Save } from "lucide-react";
import {
	validateAdminPassword,
	updateAdminUser,
} from "../lib/api_client/adminUsers";
import { decodeJWT } from "../lib/helpers";

interface UserPasswordProps {
	targetUserId: string; // Required admin user ID for the update API call
	onMessage: (
		message: { type: "success" | "error"; text: string } | null
	) => void;
	/** The role of the currently logged in admin user */
	adminRole: string;
}

export function UserPassword({
	targetUserId: userId,
	onMessage,
}: UserPasswordProps) {
	// Determine if current password is not required
	// (if the logged in user is a super admin editing someone else's account)

	const { adminRoleName, adminId } = decodeJWT(
		localStorage.getItem("jwtToken") || ""
	);

	const skipCurrentPassword =
		adminRoleName === "super_admin" && userId !== adminId;

	const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
	const [currentPasswordValid, setCurrentPasswordValid] = useState<
		boolean | null
	>(null);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		verifyPassword: "",
	});
	const [isDirty, setIsDirty] = useState({
		currentPassword: false,
		newPassword: false,
		verifyPassword: false,
	});
	const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
	const currentPasswordRef = useRef<HTMLInputElement>(null);

	const checkPasswordErrors = (newData: typeof passwordData) => {
		let newErrors: string[] = [];

		// Only check that newPassword differs from currentPassword if the field is not skipped
		if (
			!skipCurrentPassword &&
			isDirty.newPassword &&
			newData.newPassword === newData.currentPassword
		) {
			newErrors.push(
				"New password must be different from current password"
			);
		}

		if (
			isDirty.verifyPassword &&
			newData.newPassword !== newData.verifyPassword
		) {
			newErrors.push("Passwords do not match");
		}

		if (isDirty.newPassword && newData.newPassword.length < 8) {
			newErrors.push("New password must be at least 8 characters long");
		}

		setPasswordErrors(newErrors);
	};

	const handleCurrentPasswordKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			validateCurrentPassword(true);
		}
	};

	async function validateCurrentPassword(showErrors = false) {
		if (skipCurrentPassword) {
			return;
		}
		if (!passwordData.currentPassword || !userId) return;

		setIsVerifyingPassword(true);
		try {
			// Validate current password using the provided API function
			const isValidResult = await validateAdminPassword(
				userId,
				passwordData.currentPassword
			);
			setCurrentPasswordValid(isValidResult.result);

			if (isValidResult.result && showErrors) {
				checkPasswordErrors(passwordData);
			}
			if (!isValidResult.result) {
				onMessage({
					type: "error",
					text: isValidResult.message,
				});
			}
		} catch (error: any) {
			console.error("Error validating password:", error);
			setCurrentPasswordValid(false);
			onMessage({
				type: "error",
				text: error.message || "Error validating password",
			});
		} finally {
			setIsVerifyingPassword(false);
		}
	}

	async function handlePasswordChange(e: React.FormEvent) {
		e.preventDefault();
		setPasswordLoading(true);
		onMessage(null);
		setPasswordErrors([]);

		// Only enforce current password validation if we are not skipping this field
		if (!skipCurrentPassword && !currentPasswordValid) {
			onMessage({
				type: "error",
				text: "Please enter and verify your current password first",
			});
			setPasswordLoading(false);
			return;
		}

		if (passwordData.newPassword.length < 8) {
			onMessage({
				type: "error",
				text: "New password must be at least 8 characters long",
			});
			setPasswordLoading(false);
			return;
		}

		if (passwordData.newPassword !== passwordData.verifyPassword) {
			onMessage({ type: "error", text: "New passwords do not match" });
			setPasswordLoading(false);
			return;
		}

		if (
			!skipCurrentPassword &&
			passwordData.newPassword === passwordData.currentPassword
		) {
			setPasswordErrors((prev) => [
				...new Set([
					...prev,
					"New password must be different from current password",
				]),
			]);
			setPasswordLoading(false);
			return;
		}

		try {
			// Update the password via our new updateAdminUser API call.
			// We pass the user's id and only the password field.
			await updateAdminUser({
				id: userId,
				password: passwordData.newPassword,
			});
			onMessage({
				type: "success",
				text: "Password updated successfully!",
			});
			// Reset state upon success
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				verifyPassword: "",
			});
			setCurrentPasswordValid(null);
			setIsDirty({
				currentPassword: false,
				newPassword: false,
				verifyPassword: false,
			});
			setPasswordErrors([]);
		} catch (error: any) {
			console.error("Error updating password:", error);
			onMessage({
				type: "error",
				text:
					error.message ||
					"Error updating password. Please try again.",
			});
		} finally {
			setPasswordLoading(false);
		}
	}

	const getPasswordIconColor = () => {
		if (skipCurrentPassword) return "text-green-500";
		if (!isDirty.currentPassword) return "text-gray-400";
		if (currentPasswordValid === null) return "text-yellow-500";
		return currentPasswordValid ? "text-green-500" : "text-red-500";
	};

	const getNewPasswordIconColor = () => {
		if (!isDirty.newPassword) return "text-gray-400";
		if (
			!skipCurrentPassword &&
			passwordData.newPassword === passwordData.currentPassword
		)
			return "text-red-500";
		return passwordData.newPassword.length >= 8
			? "text-green-500"
			: "text-red-500";
	};

	const getVerifyPasswordIconColor = () => {
		if (!isDirty.verifyPassword) return "text-gray-400";
		if (!passwordData.verifyPassword || !passwordData.newPassword)
			return "text-yellow-500";
		return passwordData.verifyPassword === passwordData.newPassword
			? "text-green-500"
			: "text-red-500";
	};

	const isPasswordUpdateValid = () => {
		if (!skipCurrentPassword) {
			const validationResult =
				currentPasswordValid === true &&
				passwordData.newPassword.length >= 8 &&
				passwordData.verifyPassword === passwordData.newPassword &&
				passwordData.newPassword !== passwordData.currentPassword;

			return validationResult;
		} else {
			console.log(2);
			return (
				passwordData.newPassword.length >= 8 &&
				passwordData.verifyPassword === passwordData.newPassword
			);
		}
	};

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Password
			</legend>
			<div className="space-y-4">
				{!skipCurrentPassword && (
					<div>
						<label
							htmlFor="currentPassword"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Current Password
						</label>
						<div className="mt-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								{isVerifyingPassword ? (
									<Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
								) : (
									<Lock
										className={`h-5 w-5 ${getPasswordIconColor()}`}
									/>
								)}
							</div>
							<input
								ref={currentPasswordRef}
								type="password"
								id="currentPassword"
								value={passwordData.currentPassword}
								onChange={(e) => {
									setPasswordData({
										...passwordData,
										currentPassword: e.target.value,
									});
									setIsDirty((prev) => ({
										...prev,
										currentPassword: true,
									}));
									setCurrentPasswordValid(null);
									onMessage(null);
								}}
								onBlur={() => validateCurrentPassword()}
								onKeyDown={handleCurrentPasswordKeyDown}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								required={!skipCurrentPassword}
							/>
						</div>
					</div>
				)}
				<div>
					<label
						htmlFor="newPassword"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						New Password
					</label>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						(minimum length 8 characters)
					</p>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock
								className={`h-5 w-5 ${getNewPasswordIconColor()}`}
							/>
						</div>
						<input
							type="password"
							id="newPassword"
							value={passwordData.newPassword}
							onChange={(e) => {
								const newData = {
									...passwordData,
									newPassword: e.target.value,
								};
								setPasswordData(newData);
								setIsDirty((prev) => ({
									...prev,
									newPassword: true,
								}));
								checkPasswordErrors(newData);
							}}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>
				</div>
				<div>
					<label
						htmlFor="verifyPassword"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Verify New Password
					</label>
					<div className="mt-1 relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock
								className={`h-5 w-5 ${getVerifyPasswordIconColor()}`}
							/>
						</div>
						<input
							type="password"
							id="verifyPassword"
							value={passwordData.verifyPassword}
							onChange={(e) => {
								const newData = {
									...passwordData,
									verifyPassword: e.target.value,
								};
								setPasswordData(newData);
								setIsDirty((prev) => ({
									...prev,
									verifyPassword: true,
								}));
								checkPasswordErrors(newData);
							}}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>
				</div>
				{passwordErrors.length > 0 && (
					<div className="space-y-1">
						{passwordErrors.map((error, index) => (
							<p
								key={index}
								className="text-sm text-red-500 dark:text-red-400"
							>
								{error}
							</p>
						))}
					</div>
				)}
				<div className="flex justify-end">
					<button
						type="button"
						onClick={handlePasswordChange}
						disabled={passwordLoading || !isPasswordUpdateValid()}
						className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
							passwordLoading || !isPasswordUpdateValid()
								? "opacity-50 cursor-not-allowed"
								: ""
						}`}
					>
						<Save className="h-4 w-4 mr-2" />
						{passwordLoading ? "Updating..." : "Update Password"}
					</button>
				</div>
			</div>
		</fieldset>
	);
}
