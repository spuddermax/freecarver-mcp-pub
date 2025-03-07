import "react";
import { AvatarUpload } from "./AvatarUpload";
import { useState, useEffect } from "react";
import { useUserContext } from "../lib/userContext";

interface UserPictureProps {
	avatarUrl: string;
	onAvatarChange: (url: string) => void;
	userId: number;
}

export function UserPicture({
	avatarUrl,
	onAvatarChange,
	userId,
}: UserPictureProps) {
	// Add state to manage the display URL with cache busting
	const [displayUrl, setDisplayUrl] = useState(
		avatarUrl ? `${avatarUrl}?t=${Date.now()}` : ""
	);
	const { updateUserSettings } = useUserContext();

	// Update display URL whenever the base URL changes
	useEffect(() => {
		if (avatarUrl) {
			setDisplayUrl(`${avatarUrl}?t=${Date.now()}`);
		}
	}, [avatarUrl]);

	// Handle avatar changes with context updates
	const handleAvatarChange = (url: string) => {
		onAvatarChange(url);
		// Also update the user context
		updateUserSettings({ avatarUrl: url });
	};

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				User Picture
			</legend>
			<div className="space-y-2">
				<AvatarUpload
					url={displayUrl}
					onUpload={handleAvatarChange}
					size={120}
					userId={userId}
				/>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Click to upload. Maximum size: 2MB.
				</p>
			</div>
		</fieldset>
	);
}
