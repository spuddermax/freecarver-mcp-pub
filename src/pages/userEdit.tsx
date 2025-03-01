import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { UserEmail } from "../components/UserEmail";
import { UserPersonalDetails } from "../components/UserPersonalDetails";
import { UserPicture } from "../components/UserPicture";
import { UserPassword } from "../components/UserPassword";
import { UserPreferences } from "../components/UserPreferences";
import { UserDelete } from "../components/UserDelete";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAdminUser } from "../lib/api_client/adminUsers";
import { UserIcon } from "lucide-react";
import { LoadingModal } from "../components/LoadingModal";

export interface UserData {
	id: string;
	email: string;
	role: string;
	firstName: string;
	lastName: string;
	avatarUrl: string;
	createdAt: string;
	phoneNumber: string;
	twoFactorEnabled: boolean;
	notificationsEnabled: boolean;
	notificationPreference: string;
	timezone: string;
}

/**
 * Edit the user details
 * @returns The user details
 */
export default function UserEdit() {
	const { targetId } = useParams<{ targetId: string }>();
	const navigate = useNavigate();

	// State for loading
	const [loading, setLoading] = useState<boolean>(true);

	// State for messages (for success/error notifications)
	const [message, setMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);

	// Local user state. Note: We use "userData" (lowercase) to avoid confusion with component names.
	const [userData, setUserData] = useState<UserData>({
		id: "",
		email: "",
		firstName: "",
		lastName: "",
		phoneNumber: "",
		avatarUrl: "",
		twoFactorEnabled: false,
		notificationsEnabled: true,
		notificationPreference: "email",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		role: "",
		createdAt: "",
	});

	// Load user details from the API when the component mounts or when the targetId changes.
	useEffect(() => {
		async function loadUser() {
			setLoading(true);
			if (!targetId) {
				console.log("No UUID provided");
				setLoading(false);
				return;
			}
			try {
				const result = await fetchAdminUser(targetId);
				const data = result.admin;
				// Adjust the property names if your API returns different keys.
				setUserData({
					id: data.id,
					email: data.email || "",
					firstName: data.first_name || "",
					lastName: data.last_name || "",
					phoneNumber: data.phone_number || "",
					avatarUrl: data.avatar_url || "",
					twoFactorEnabled: data.mfa_enabled || false,
					notificationsEnabled: true,
					notificationPreference: "email",
					timezone:
						data.timezone ||
						Intl.DateTimeFormat().resolvedOptions().timeZone,
					role: data.role || "viewer",
					createdAt: new Date(
						data.createdAt || data.created_at
					).toLocaleDateString(),
				});
			} catch (error) {
				console.error("Error loading user:", error);
				setMessage({
					type: "error",
					text: "Failed to load user details.",
				});
			} finally {
				setLoading(false);
			}
		}
		loadUser();
	}, [targetId]);

	return (
		<Layout
			pageInfo={{
				title: "User Editor",
				icon: UserIcon,
				iconColor: "text-blue-600 dark:text-blue-600",
			}}
			breadcrumbs={[
				{ label: "Dashboard", link: "/dashboard" },
				{ label: "Manage Users", link: "/users" },
				{ label: "User Editor" },
			]}
		>
			{message && (
				<Toast
					message={message.text}
					type={message.type}
					onClose={() => setMessage(null)}
				/>
			)}
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
						<div className="p-6 space-y-8">
							{loading ? (
								<LoadingModal
									isOpen={loading}
									message="Loading user..."
								/>
							) : (
								<>
									<UserEmail
										email={userData.email}
										targetUserId={userData.id}
										onEmailChange={(email) =>
											setUserData((prev) => ({
												...prev,
												email,
											}))
										}
										onMessage={setMessage}
									/>

									<UserPersonalDetails
										User={{
											id: userData.id,
											firstName: userData.firstName,
											lastName: userData.lastName,
											phoneNumber: userData.phoneNumber,
										}}
										onMessage={setMessage}
										onUserChange={(changes) =>
											setUserData((prev) => ({
												...prev,
												...changes,
											}))
										}
									/>

									<UserPicture
										avatarUrl={userData.avatarUrl}
										onAvatarChange={(url) =>
											setUserData((prev) => ({
												...prev,
												avatarUrl: url,
											}))
										}
										userId={parseInt(userData.id, 10)}
									/>

									<UserPassword
										targetUserId={userData.id}
										onMessage={setMessage}
										adminRole={userData.role}
									/>

									<UserPreferences
										preferences={{
											twoFactorEnabled:
												userData.twoFactorEnabled,
											notificationsEnabled:
												userData.notificationsEnabled,
											notificationPreference:
												userData.notificationPreference,
											timezone: userData.timezone,
										}}
										onMessage={setMessage}
										onPreferencesChange={(changes) =>
											setUserData((prev) => ({
												...prev,
												...changes,
											}))
										}
									/>

									<UserDelete
										userId={userData.id}
										onMessage={setMessage}
										onDelete={() => {
											// popup a confirmation toast
											setMessage({
												type: "info",
												text: "User deleted successfully",
											});
											navigate("/users");
										}}
									/>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
