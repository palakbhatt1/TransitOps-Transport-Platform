import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { client } from './api/client';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const user = client.auth.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

// Simple stubs for other pages
const PlaceholderPage = ({ title }) => (
  <div>
    <h1 className="text-3xl font-bold text-zinc-100">{title}</h1>
    <p className="text-sm text-zinc-400 mt-2">This module is under active construction.</p>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Vehicles />
            </ProtectedRoute>
          } />
          <Route path="/drivers" element={
            <ProtectedRoute>
              <Drivers />
            </ProtectedRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute>
              <Trips />
            </ProtectedRoute>
          } />
          <Route path="/maintenance" element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <PlaceholderPage title="Fuel & Expenses" />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <PlaceholderPage title="Analytics" />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PlaceholderPage title="Settings" />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
