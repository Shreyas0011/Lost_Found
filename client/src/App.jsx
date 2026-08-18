import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import AdminRequests from './pages/AdminRequests';
import AdminChat from './pages/AdminChat';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-mesh">
          <div className="bg-mesh__orb bg-mesh__orb--1"></div>
          <div className="bg-mesh__orb bg-mesh__orb--2"></div>
          <div className="bg-mesh__orb bg-mesh__orb--3"></div>
          <div className="bg-mesh__grid"></div>
        </div>
        <Navbar />

        <Routes>
          {/* Main Landing Route is NOW Login */}
          <Route path="/" element={<StudentLogin />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          {/* Public Search & Detail */}
          <Route path="/search" element={<StudentSearch />} />
          <Route path="/item/:id" element={<ItemDetail />} />

          {/* Student Protected Routes */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute role="student">
                <SubmitItem />
              </ProtectedRoute>
            }
          />
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
    </AuthProvider>
  );
}
