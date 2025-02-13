import React, { useState, useEffect } from 'react';
import { Lock, Mail, Database, Database as DatabaseOff, DatabaseBackup, Sun, Moon, Grid, Pause, Play } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useGrid } from '../lib/grid';
import { TronGrid } from '../components/TronGrid/index';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // You might want to implement a new connectivity check for your API,
  // or remove connectionStatus entirely if not needed.
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const { theme, setTheme } = useTheme();
  const { showGrid, setShowGrid, animateGrid, setAnimateGrid } = useGrid();
  const isDark = theme === 'dark';

  // Option 1: Check API connectivity on mount (simple ping)
  useEffect(() => {
    fetch('/api') // assuming your API root returns something
      .then(res => {
        if (res.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      })
      .catch(err => {
        console.error('API connection error:', err);
        setConnectionStatus('error');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        // If status code is not OK, throw an error to be caught below
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      // Assume the response contains a JWT token. Store it (e.g., in localStorage).
      if (data.token) {
        localStorage.setItem('jwtToken', data.token);
        setEmail('');
        setPassword('');
        onLogin();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const ConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Database className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <DatabaseOff className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <DatabaseBackup className="h-5 w-5 text-gray-600 dark:text-gray-400 animate-pulse" />;
    }
  };

  const connectionTooltip = {
    checking: 'Checking API connection...',
    connected: 'Connected to API',
    error: 'API connection error'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {showGrid && <TronGrid />}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Carver MCP</h1>
            <p className="text-gray-600 dark:text-gray-400">Master Control Program</p>
            <div className="mt-2 flex justify-center items-center space-x-4">
              <div className="relative group">
                <div className="cursor-help">
                  <ConnectionIcon />
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {connectionTooltip[connectionStatus]}
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Switch to {isDark ? 'light' : 'dark'} mode
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={() => {
                    if (!showGrid) {
                      setShowGrid(true);
                      setAnimateGrid(true);
                    } else {
                      setAnimateGrid(!animateGrid);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                  aria-label={showGrid ? (animateGrid ? 'Pause grid' : 'Resume grid') : 'Show grid'}
                >
                  <Grid className={`h-5 w-5 ${showGrid ? 'text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  {showGrid && (
                    <div className="absolute bottom-1 right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                      {animateGrid ? (
                        <Pause className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Play className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                  )}
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {showGrid ? (animateGrid ? 'Pause Grid' : 'Resume Grid') : 'Show Grid'}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 text-red-500 dark:text-red-200 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
