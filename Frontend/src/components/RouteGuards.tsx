import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils';

// PublicRoute is used for Login and Register components to prevent logged in users from accessing them
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const role = await getUserRole();
        if (role === 'Restaurant Owner') {
          setRedirectPath('/company');
        } else {
          setRedirectPath('/student');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// ProtectedRoute is used to ensure users are logged in and have the requested role
export const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRole: string }> = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Check if logged in at all
      if (!isAuthenticated()) {
        setRedirectPath('/login');
        setLoading(false);
        return;
      }

      // 2. User is logged in, verify role
      const role = await getUserRole();
      
      if (role === allowedRole) {
        setHasAccess(true);
      } else {
        // Logged in, but wrong role. Redirect to the correct dashboard.
        if (role === 'Restaurant Owner') {
          setRedirectPath('/company');
        } else {
          setRedirectPath('/student');
        }
      }
      setLoading(false);
    };
    
    checkAccess();
  }, [allowedRole]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return hasAccess ? <>{children}</> : null;
};
