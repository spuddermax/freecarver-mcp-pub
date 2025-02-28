import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	User as UserIcon,
	Mail as MailIcon,
	Search as SearchIcon,
	UserPlus as UserPlusIcon,
	Loader2 as Loader2Icon,
} from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { fetchAdminUsers } from "../lib/api_client/adminUsers";
import { formatUser } from "../utils/formatters";
import { LoadingModal } from "../components/LoadingModal";

interface UserData {
	id: string;
	email: string;
	role: string;
	firstName: string;
	lastName: string;
	avatarUrl: string;
	createdAt: string;
}

export default function Users() {
	const navigate = useNavigate();
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		loadUsers();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsSearching(true);
			// The search filtering is done immediately based on state.
			setIsSearching(false);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	async function loadUsers() {
		try {
			const usersData = await fetchAdminUsers();
			const formattedUsers = usersData.map((user: any) =>
				formatUser(user)
			);
			setUsers(formattedUsers);
		} catch (error: any) {
			console.error("Error loading users:", error);
			setMessage({ type: "error", text: error.message });
		} finally {
			setLoading(false);
		}
	}

	const filterUsers = () => {
		const searchLower = searchQuery.toLowerCase();
		if (!searchLower) return users;
		return users.filter((user) => {
			const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
			return (
				user.email.toLowerCase().includes(searchLower) ||
				fullName.includes(searchLower) ||
				user.firstName.toLowerCase().includes(searchLower) ||
				user.lastName.toLowerCase().includes(searchLower)
			);
		});
	};

	const filteredUsers = filterUsers();

	const getRoleColor = (role: string) => {
		switch (role) {
			case "Super Admin":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "Admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "Editor":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<Layout
			pageInfo={{
				title: "Manage Users",
				icon: UserIcon,
				iconColor: "text-blue-600 dark:text-blue-600",
			}}
			breadcrumbs={[
				{ label: "Dashboard", link: "/dashboard" },
				{ label: "Manage Users" },
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
						<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
								<div className="mt-4 sm:mt-0 flex items-center space-x-4">
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											{isSearching ? (
												<Loader2Icon className="h-5 w-5 text-gray-400 animate-spin" />
											) : (
												<SearchIcon className="h-5 w-5 text-gray-400" />
											)}
										</div>
										<input
											type="text"
											placeholder="Search users..."
											value={searchQuery}
											onChange={(e) =>
												setSearchQuery(e.target.value)
											}
											className={`block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
												isSearching
													? "border-blue-300 dark:border-blue-700"
													: ""
											}`}
										/>
										{searchQuery && (
											<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
												<button
													onClick={() =>
														setSearchQuery("")
													}
													className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
												>
													<span className="sr-only">
														Clear search
													</span>
													<svg
														className="h-5 w-5"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fillRule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
															clipRule="evenodd"
														/>
													</svg>
												</button>
											</div>
										)}
									</div>
									<button
										className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										onClick={() => {}}
									>
										<UserPlusIcon className="h-4 w-4 mr-2" />
										Add User
									</button>
								</div>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
								<thead className="bg-gray-50 dark:bg-gray-900">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											User
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Role
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Created
										</th>
										{/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Actions
										</th> */}
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{loading ? (
										<LoadingModal
											isOpen={loading}
											message="Loading users..."
										/>
									) : filteredUsers.length === 0 ? (
										<tr>
											<td
												colSpan={5}
												className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
											>
												No users found
											</td>
										</tr>
									) : (
										filteredUsers.map((user) => (
											// Start of Selection
											<tr
												key={user.id}
												className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
												onClick={() => {
													console.log(
														"clicked on user:",
														user
													);
													navigate(
														`/userEdit/${user.id}`
													);
												}}
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														{user.avatarUrl ? (
															<img
																src={
																	user.avatarUrl
																}
																alt=""
																className="h-8 w-8 rounded-full"
															/>
														) : (
															<div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
																<UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
															</div>
														)}
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900 dark:text-white">
																{user.firstName}{" "}
																{user.lastName}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
														<MailIcon className="h-4 w-4 mr-2" />
														{user.email}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
															user.role
														)}`}
													>
														{user.role}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{user.createdAt}
												</td>
												{/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
													<div className="flex items-center justify-end space-x-3">
														<button
															onClick={() =>
																navigate(
																	`/userEdit/${user.id}`
																)
															}
															className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
														>
															<EditIcon className="h-4 w-4" />
														</button>
														<button
															onClick={() => {
																// Delete user logic: ideally call an API function from your client library here
															}}
															className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
														>
															<Trash2Icon className="h-4 w-4" />
														</button>
													</div>
												</td> */}
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
