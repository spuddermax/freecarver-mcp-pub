import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { MCPIcon } from "./MCPIcon";
import { useTheme } from "../lib/theme";
import { useGrid } from "../lib/grid";
import { TronGrid } from "./TronGrid/index";
import NavMenu from "./NavMenu";
import { useUserContext } from "../lib/userContext";

interface PageInfo {
	title: string;
	icon: React.ElementType | null;
	iconColor: string;
}

interface BreadcrumbItem {
	label: string;
	link?: string; // if undefined, it will render as plain text
}

interface LayoutProps {
	children: React.ReactNode;
	pageInfo?: PageInfo;
	breadcrumbs?: BreadcrumbItem[];
}

export default function Layout({
	children,
	pageInfo,
	breadcrumbs,
}: LayoutProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [notifications] = useState(3);
	const { userMySettings } = useUserContext();
	const [showNavMenu, setShowNavMenu] = useState(false);
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark";
	const { showGrid, setShowGrid, animateGrid, setAnimateGrid } = useGrid();
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				menuRef.current &&
				buttonRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setShowNavMenu(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleLogout = async () => {
		// Clear the JWT token and navigate to the login page
		localStorage.removeItem("jwtToken");
		navigate("/login");
		window.location.reload();
	};

	const handleMySettingsClick = () => {
		console.log("My Settings Clicked");
		setShowNavMenu(false);
		navigate(`/userEdit/${userMySettings.adminId}`);
	};

	const handleDashboardClick = () => {
		setShowNavMenu(false);
		navigate("/dashboard");
	};

	const handleThemeToggle = () => {
		setTheme(isDark ? "light" : "dark");
		setShowNavMenu(false);
	};

	// Use pageInfo passed from the page or fallback to a default empty state
	const { title = "", icon: Icon, iconColor = "" } = pageInfo || {};

	return (
		<div className="min-h-screen">
			{showGrid && <TronGrid />}
			<nav className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col">
						<div className="flex justify-between h-16 items-center">
							{location.pathname === "/dashboard" ? (
								<div className="flex items-center space-x-3">
									<MCPIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
									<h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
										Master Control Program
									</h1>
								</div>
							) : (
								<div
									onClick={handleDashboardClick}
									className="flex items-center space-x-3 cursor-pointer group"
								>
									<MCPIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
									<button className="text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
										Master Control Program
									</button>
								</div>
							)}
							<div className="flex items-center space-x-4">
								<button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
									<Bell className="h-6 w-6" />
									{notifications > 0 && (
										<span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
											{notifications}
										</span>
									)}
								</button>

								<div className="relative">
									<button
										ref={buttonRef}
										onClick={() =>
											setShowNavMenu(!showNavMenu)
										}
										className="flex items-center space-x-3 focus:outline-none"
									>
										{userMySettings.avatarUrl ? (
											<img
												src={userMySettings.avatarUrl}
												alt="MySettings"
												className="h-8 w-8 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900"
											/>
										) : (
											<div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
												<User className="h-5 w-5" />
											</div>
										)}
										<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
											{userMySettings.adminFirstName}
										</span>
									</button>

									{showNavMenu && (
										<NavMenu
											onDashboardClick={
												handleDashboardClick
											}
											onMySettingsClick={
												handleMySettingsClick
											}
											onUsersClick={() => {
												setShowNavMenu(false);
												navigate("/users");
											}}
											onThemeToggle={handleThemeToggle}
											onGridToggle={() => {
												if (!showGrid) {
													setShowGrid(true);
													setAnimateGrid(true);
												} else {
													setAnimateGrid(
														!animateGrid
													);
												}
												setShowNavMenu(false);
											}}
											onLogout={handleLogout}
											isDark={isDark}
											showGrid={showGrid}
											animateGrid={animateGrid}
											ref={menuRef}
										/>
									)}
								</div>
							</div>
						</div>
						<div className="px-4 py-2 border-t dark:border-gray-700">
							<div className="flex items-center space-x-2">
								{Icon && (
									<Icon className={`h-5 w-5 ${iconColor}`} />
								)}
								<h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">
									{title}
								</h2>
							</div>
							{breadcrumbs && breadcrumbs.length > 0 && (
								<nav aria-label="Breadcrumb" className="mt-2">
									<ol className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
										{breadcrumbs.map((item, index) => (
											<li
												key={index}
												className="flex items-center"
											>
												{item.link ? (
													<Link
														to={item.link}
														className="text-blue-600 hover:underline"
													>
														{item.label}
													</Link>
												) : (
													<span>{item.label}</span>
												)}
												{index <
													breadcrumbs.length - 1 && (
													<svg
														className="w-3 h-3 mx-2 text-gray-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														xmlns="http://www.w3.org/2000/svg"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M9 5l7 7-7 7"
														></path>
													</svg>
												)}
											</li>
										))}
									</ol>
								</nav>
							)}
						</div>
					</div>
				</div>
			</nav>

			<main className="pt-28 relative z-9">{children}</main>
		</div>
	);
}
