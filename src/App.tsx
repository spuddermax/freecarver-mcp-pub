import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserEdit from './pages/UserEdit';
import Users from './pages/Users';
import { GridContext, useGridProvider } from './lib/grid';
import NotFound from './pages/NotFound';

/**
 * Helper function to decide which routes should be protected from unauthenticated users.
 * You can update the array below to list all the routes that require an active session.
 */
const isProtectedRoute = (pathname: string) => {
  const protectedRoutes = ['/', '/dashboard', '/users'];
  return protectedRoutes.includes(pathname);
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const gridState = useGridProvider();
  const navigate = useNavigate();
  const location = useLocation();

  const checkSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      // Only redirect when the route is protected.
      if (!session && isProtectedRoute(location.pathname)) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Only redirect when the current route is protected.
      if (!session && isProtectedRoute(location.pathname)) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSession, location.pathname, navigate]);

  const handleLogin = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    // Show a loading spinner centered on the screen
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
    </div>;
  }

  return (
      <GridContext.Provider value={gridState}>
        <Routes>
          <Route
            path="/login"
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          {session ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/useredit" element={<UserEdit user={null} onClose={() => console.log('Close UserEdit')} onSave={() => console.log('Save UserEdit')} />} />
              <Route
                path="/useredit/:id"
                element={
                  <UserEdit
                    user={null}
                    onClose={() => console.log('Close UserEdit')}
                    onSave={() => console.log('Save UserEdit')}
                  />
                }
              />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Navigate to="/login" replace />} />
              <Route path="/users" element={<Navigate to="/login" replace />} />
            </>
          )}
          <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<NotFound session={session} />} />
        </Routes>
      </GridContext.Provider>
  );
}

export default App;