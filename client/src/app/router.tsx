import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../app/providers';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentHomework from '../pages/student/StudentHomework';
import StudentSchedule from '../pages/student/StudentSchedule';
import StudentSubscription from '../pages/student/StudentSubscription';
import StudentGrades from '../pages/student/StudentGrades';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherSchedule from '../pages/teacher/TeacherSchedule';
import TeacherFinances from '../pages/teacher/TeacherFinances';
import TeacherStudents from '../pages/teacher/TeacherStudents';
import TeacherHomework from '../pages/teacher/TeacherHomework';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerApplications from '../pages/manager/ManagerApplications';
import ManagerSubscriptions from '../pages/manager/ManagerSubscriptions';
import ManagerReports from '../pages/manager/ManagerReports';
import ManagerMatching from '../pages/manager/ManagerMatching';

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const S = ['student'];
const T = ['teacher'];
const M = ['manager', 'admin'];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публічні сторінки — з MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Студент */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Менеджер / Адмін */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}

        {/* Student */}
        <Route path="/dashboard">
          <Route index element={<ProtectedRoute allowedRoles={S}><StudentDashboard /></ProtectedRoute>} />
          <Route path="homework" element={<ProtectedRoute allowedRoles={S}><StudentHomework /></ProtectedRoute>} />
          <Route path="schedule" element={<ProtectedRoute allowedRoles={S}><StudentSchedule /></ProtectedRoute>} />
          <Route path="subscription" element={<ProtectedRoute allowedRoles={S}><StudentSubscription /></ProtectedRoute>} />
          <Route path="grades" element={<ProtectedRoute allowedRoles={S}><StudentGrades /></ProtectedRoute>} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher">
          <Route index element={<ProtectedRoute allowedRoles={T}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="schedule" element={<ProtectedRoute allowedRoles={T}><TeacherSchedule /></ProtectedRoute>} />
          <Route path="finances" element={<ProtectedRoute allowedRoles={T}><TeacherFinances /></ProtectedRoute>} />
          <Route path="students" element={<ProtectedRoute allowedRoles={T}><TeacherStudents /></ProtectedRoute>} />
          <Route path="homework" element={<ProtectedRoute allowedRoles={T}><TeacherHomework /></ProtectedRoute>} />
        </Route>

        {/* Manager */}
        <Route path="/manager">
          <Route index element={<ProtectedRoute allowedRoles={M}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="applications" element={<ProtectedRoute allowedRoles={M}><ManagerApplications /></ProtectedRoute>} />
          <Route path="subscriptions" element={<ProtectedRoute allowedRoles={M}><ManagerSubscriptions /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={M}><ManagerReports /></ProtectedRoute>} />
          <Route path="matching" element={<ProtectedRoute allowedRoles={M}><ManagerMatching /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}