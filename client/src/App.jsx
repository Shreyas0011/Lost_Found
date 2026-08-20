import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import StudentSearch from './pages/StudentSearch';
import StudentLogin from './pages/StudentLogin';
import SubmitItem from './pages/SubmitItem';
import ItemDetail from './pages/ItemDetail';
import ClaimChat from './pages/ClaimChat';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminItems from './pages/AdminItems';
import AdminAddItem from './pages/AdminAddItem';
import SuperAdminPortal from './pages/SuperAdminPortal';
import AdminRequests from './pages/AdminRequests';
import AdminChat from './pages/AdminChat';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="bg-mesh">
            <div className="bg-mesh__orb bg-mesh__orb--1"></div>
            <div className="bg-mesh__orb bg-mesh__orb--2"></div>
            <div className="bg-mesh__orb bg-mesh__orb--3"></div>
            <div className="bg-mesh__grid"></div>
          </div>
          <Navbar />

          <Routes>
            {/* Main Landing Route is NOW Public View-Only Search */}
            <Route path="/" element={<StudentSearch />} />
            <Route path="/search" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            {/* Item Detail View */}
            <Route path="/item/:id" element={<ItemDetail />} />

            {/* Student Protected Routes */}
            <Route path="/submit" element={<Navigate to="/search" replace />} />
            <Route
              path="/chat/:requestId"
              element={
                <ProtectedRoute role="student">
                  <ClaimChat />
                </ProtectedRoute>
              }
            />

            {/* Admin Login Public */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/superadmin"
              element={
                <ProtectedRoute role="superadmin">
                  <SuperAdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-item"
              element={
                <ProtectedRoute role="admin">
                  <AdminAddItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items"
              element={
                <ProtectedRoute role="admin">
                  <AdminItems />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute role="admin">
                  <AdminRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chat"
              element={
                <ProtectedRoute role="admin">
                  <AdminChat />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
