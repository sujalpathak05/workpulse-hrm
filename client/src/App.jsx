import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getMe } from './redux/slices/authSlice';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth
import Login from './pages/auth/Login';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import AttendancePage from './pages/employee/Attendance';
import LeavesPage from './pages/employee/Leaves';
import DocumentsPage from './pages/employee/Documents';
import ProfilePage from './pages/employee/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import EmployeesPage from './pages/admin/Employees';
import AttendanceAdminPage from './pages/admin/AttendanceAdmin';
import LeaveManagementPage from './pages/admin/LeaveManagement';
import SettingsPage from './pages/admin/Settings';

// Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, token } = useSelector((s) => s.auth);

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'employee') return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(getMe());
  }, [dispatch, token]);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl text-sm"
      />
      <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={
          <ProtectedRoute allowedRoles={['employee', 'hr_admin', 'super_admin']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employee/attendance" element={
          <ProtectedRoute allowedRoles={['employee', 'hr_admin', 'super_admin']}>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/employee/leaves" element={
          <ProtectedRoute allowedRoles={['employee', 'hr_admin', 'super_admin']}>
            <LeavesPage />
          </ProtectedRoute>
        } />
        <Route path="/employee/documents" element={
          <ProtectedRoute allowedRoles={['employee', 'hr_admin', 'super_admin']}>
            <DocumentsPage />
          </ProtectedRoute>
        } />
        <Route path="/employee/profile" element={
          <ProtectedRoute allowedRoles={['employee', 'hr_admin', 'super_admin']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/employees" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']}>
            <EmployeesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']}>
            <AttendanceAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/leaves" element={
          <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']}>
            <LeaveManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
