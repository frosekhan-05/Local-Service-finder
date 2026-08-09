// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import CustomerDashboard from './components/CustomerDashboard/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard/ProviderDashboard';
import HomePage from './components/HomePage/HomePage';
import NotificationBell from './components/NotificationBell/NotificationBell';

// Navigation Component
const Navigation = () => {
  const navigate = useNavigate();
  
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  };

  const user = getUser();
  const isLoggedIn = localStorage.getItem('token');

  console.log('🔍 Navigation - User status:', {
    isLoggedIn: !!isLoggedIn,
    user: user,
    token: localStorage.getItem('token')
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="/" className="nav-logo">
          Local Service Finder
        </a>
        
        <div className="nav-links">
          {isLoggedIn ? (
            <>
              {user.role === 'customer' && <NotificationBell />}
              <span className="user-welcome">Welcome, {user.email} ({user.role})</span>
              <button onClick={handleLogout} className="btn btn-outline btn-small">
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-link">Login</a>
              <a href="/signup" className="nav-link">Sign Up</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const isLoggedIn = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('🛡️ Protected Route Check:', {
    isLoggedIn: !!isLoggedIn,
    userRole: user.role,
    requiredRole: requiredRole,
    path: window.location.pathname
  });

  if (!isLoggedIn) {
    console.log('❌ Not logged in, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log(`❌ Role mismatch: ${user.role} required: ${requiredRole}`);
    
    // Redirect based on actual role
    if (user.role === 'provider') {
      return <Navigate to="/provider-dashboard" replace />;
    } else {
      return <Navigate to="/customer-dashboard" replace />;
    }
  }

  console.log('✅ Access granted to protected route');
  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🚀 App initialized - Checking auth status:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route 
            path="/customer-dashboard" 
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/provider-dashboard" 
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;