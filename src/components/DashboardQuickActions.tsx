import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Tag, Users, Settings } from "lucide-react";

interface QuickAction {
	icon: React.ElementType;
	label: string;
	onClick?: () => void;
}

export function DashboardQuickActions() {
	const navigate = useNavigate();

	const actions: QuickAction[] = [
		{
			icon: Package,
			label: "Manage Products",
			onClick: () => navigate("/products"),
		},
		{
			icon: Tag,
			label: "Manage Product Categories",
			onClick: () => navigate("/productCategories"),
		},
		{
			icon: Users,
			label: "Manage Users",
			onClick: () => navigate("/users"),
		},
		{
			icon: Settings,
			label: "Settings",
			onClick: () => navigate("/settings"),
		},
	];

	return (
		<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
			<div className="p-6">
				<h3 className="text-lg font-medium text-gray-900 dark:text-white">
					Quick Actions
				</h3>
				<div className="mt-6 space-y-4">
					{actions.map((action, index) => (
						<button
							key={index}
							onClick={action.onClick}
							className="w-full flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
						>
							<action.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
							<span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
								{action.label}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
