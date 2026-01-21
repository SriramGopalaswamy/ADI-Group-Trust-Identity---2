import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ConsumerForm from './components/ConsumerForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

const App: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check session on load
    const auth = sessionStorage.getItem('adi_admin_auth');
    if (auth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('adi_admin_auth', 'true');
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adi_admin_auth');
    setIsAdminAuthenticated(false);
  };

  return (
    <HashRouter>
      <Routes>
        {/* Consumer Route */}
        <Route path="/" element={<ConsumerForm />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            isAdminAuthenticated ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
