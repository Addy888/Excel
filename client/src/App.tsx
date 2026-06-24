import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { RulesPage } from './pages/RulesPage';
import { CreateRulePage } from './pages/CreateRulePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="report/:id" element={<ReportDetailPage />} />
            <Route path="rules" element={<RulesPage />} />
            
            {/* Admin Routes */}
            <Route path="admin/dashboard" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="admin/rules" element={
              <AdminRoute>
                <RulesPage />
              </AdminRoute>
            } />
            <Route path="admin/rules/create" element={
              <AdminRoute>
                <CreateRulePage />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
