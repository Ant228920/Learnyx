 feat/frontend-foundation
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../app/providers';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import StudentDashboard from '../pages/student/StudentDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import Dashboard from '../pages/Dashboard';
 develop

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публічні сторінки — з MainLayout (хедер LearNYX) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Студент — власний layout (сайдбар + хедер всередині компонента) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Менеджер / Адмін — власний layout */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Будь-який інший шлях → головна */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}