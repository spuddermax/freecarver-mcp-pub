import React, { forwardRef } from "react";
import {
	User as UserIcon,
	Users as UsersIcon,
	Sun,
	Moon,
	Grid,
	Pause,
	Play,
	LogOut,
	Package as PackageIcon,
	Folder as FolderIcon,
} from "lucide-react";

export interface NavMenuProps {
	onDashboardClick: () => void;
	onMySettingsClick: () => void;
	onUsersClick: () => void;
	onThemeToggle: () => void;
	onGridToggle: () => void;
	onLogout: () => Promise<void> | void;
	isDark: boolean;
	showGrid: boolean;
	animateGrid: boolean;
}

const NavMenu = forwardRef<HTMLDivElement, NavMenuProps>(
	(
		{
			onDashboardClick,
			onMySettingsClick,
			onUsersClick,
			onThemeToggle,
			onGridToggle,
			onLogout,
			isDark,
			showGrid,
			animateGrid,
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
			>
				<div className="py-1" role="menu">
					<button
						onClick={onMySettingsClick}
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<UserIcon className="h-4 w-4 mr-2" />
						My User Settings
					</button>
					<button
						onClick={onThemeToggle}
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						{isDark ? (
							<Sun className="h-4 w-4 mr-2" />
						) : (
							<Moon className="h-4 w-4 mr-2" />
						)}
						{isDark ? "Light Mode" : "Dark Mode"}
					</button>
					<button
						onClick={onGridToggle}
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<div className="flex items-center">
							<Grid className="h-4 w-4 mr-2" />
							{!showGrid
								? "Show Grid"
								: animateGrid
								? "Pause Grid"
								: "Resume Grid"}
						</div>
						<div className="ml-2">
							{animateGrid ? (
								<Pause className="h-3 w-3" />
							) : (
								<Play className="h-3 w-3" />
							)}
						</div>
					</button>
					<button
						onClick={onUsersClick}
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<UsersIcon className="h-4 w-4 mr-2" />
						Manage Users
					</button>
					<a
						href="/products"
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<PackageIcon className="h-4 w-4 mr-2" />
						Manage Products
					</a>
					<a
						href="/productCategories"
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<FolderIcon className="h-4 w-4 mr-2" />
						Manage Categories
					</a>
					<button
						onClick={onLogout}
						className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						role="menuitem"
					>
						<LogOut className="h-4 w-4 mr-2" />
						Sign Out
					</button>
				</div>
			</div>
		);
	}
);

NavMenu.displayName = "NavMenu";

export default NavMenu;
