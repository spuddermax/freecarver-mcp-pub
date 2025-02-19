// /src/components/DashboardQuickActions.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Tag, Users, Settings } from "lucide-react";

interface QuickAction {
	icon: React.ElementType;
	label: string;
	buttonClass: string;
	onClick?: () => void;
}

export function DashboardQuickActions() {
	const navigate = useNavigate();

	const actions: QuickAction[] = [
		{
			icon: Package,
			label: "Manage Products",
			buttonClass:
				"bg-red-900 hover:bg-red-800 dark:bg-red-900 dark:hover:bg-red-800 text-white",
			onClick: () => navigate("/products"),
		},
		{
			icon: Tag,
			label: "Manage Product Categories",
			buttonClass:
				"bg-green-900 hover:bg-green-800 dark:bg-green-900 dark:hover:bg-green-800 text-white",
			onClick: () => navigate("/productCategories"),
		},
		{
			icon: Users,
			label: "Manage Users",
			buttonClass:
				"bg-blue-800 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 text-white",
			onClick: () => navigate("/users"),
		},
		{
			icon: Settings,
			label: "Settings",
			buttonClass:
				"bg-violet-800 hover:bg-violet-700 dark:bg-violet-800 dark:hover:bg-violet-700 text-white",
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
							className={`w-full flex items-center px-4 py-3 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${action.buttonClass}`}
						>
							<action.icon className="h-5 w-5 " />
							<span className="ml-3 text-sm font-medium ">
								{action.label}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
