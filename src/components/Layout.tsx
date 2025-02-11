import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, LayoutDashboard, Sun, Moon, Grid, Pause, Play, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MCPIcon } from './MCPIcon';
import { useTheme } from '../lib/theme';
import { useGrid } from '../lib/grid';
import { TronGrid } from './TronGrid/index';
import NavMenu from './NavMenu';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState(3);
  const [userProfile, setUserProfile] = useState({
    email: '',
    firstName: '',
    avatarUrl: '',
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { showGrid, setShowGrid, animateGrid, setAnimateGrid } = useGrid();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function getUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        setUserProfile({
          email: user.email || 'User',
          firstName: metadata.first_name || '',
          avatarUrl: metadata.avatar_url || '',
        });
      }
    }

    // Initial profile load
    getUserProfile();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session?.user) {
        // Reload user profile on any auth state change
        const metadata = session.user.user_metadata || {};
        setUserProfile({
          email: session.user.email || 'User',
          firstName: metadata.first_name || '',
          avatarUrl: metadata.avatar_url || '',
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    setShowProfileMenu(false);
    navigate('/dashboard');
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
    setShowProfileMenu(false);
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { 
          title: 'Dashboard', 
          icon: LayoutDashboard,
          iconColor: 'text-blue-500 dark:text-blue-400'
        };
      case '/profile':
        return { 
          title: 'Profile', 
          icon: User,
          iconColor: 'text-purple-500 dark:text-purple-400'
        };
      case '/users':
        return {
          title: 'Manage Users',
          icon: User,
          iconColor: 'text-green-500 dark:text-green-400'
        };
      default:
        return { 
          title: '', 
          icon: null,
          iconColor: ''
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen">
      {showGrid && <TronGrid />}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            <div className="flex justify-between h-16 items-center">
              {location.pathname === '/dashboard' ? (
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
                  <button
                    className="text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors"
                  >
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
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {userProfile.firstName}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <NavMenu
                      onDashboardClick={handleDashboardClick}
                      onProfileClick={handleProfileClick}
                      onUsersClick={() => {
                        setShowProfileMenu(false);
                        navigate('/users');
                      }}
                      onThemeToggle={handleThemeToggle}
                      onGridToggle={() => {
                        if (!showGrid) {
                          setShowGrid(true);
                          setAnimateGrid(true);
                        } else {
                          setAnimateGrid(!animateGrid);
                        }
                        setShowProfileMenu(false);
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
            <div className="h-12 flex items-center border-t dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {pageInfo.icon && (
                  <pageInfo.icon className={`h-5 w-5 ${pageInfo.iconColor}`} />
                )}
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {pageInfo.title}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-28 relative z-10">
        {children}
      </main>
    </div>
  );
}