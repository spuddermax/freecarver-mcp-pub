import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Users from './pages/Users';
import { GridContext, useGridProvider } from './lib/grid';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const gridState = useGridProvider();
  const navigate = useNavigate();
  const location = useLocation();

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session && location.pathname !== '/login') {
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
      if (!session && location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSession]);

  const handleLogin = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <GridContext.Provider value={gridState}>
    <Routes>
      <Route path="/login" element={
        session ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
      } />
      {session ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<Users />} />
        </>
      ) : (
        <>
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />
          <Route path="/profile" element={<Navigate to="/login" replace />} />
          <Route path="/users" element={<Navigate to="/login" replace />} />
        </>
      )}
      <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
    </Routes>
    </GridContext.Provider>
  );
}

export default App;