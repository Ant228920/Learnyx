import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../app/providers';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';

// Student
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentHomework from '../pages/student/StudentHomework';
import StudentSchedule from '../pages/student/StudentSchedule';
import StudentSubscription from '../pages/student/StudentSubscription';
import StudentGrades from '../pages/student/StudentGrades';
import StudentSettings from '../pages/student/StudentSettings';

// Teacher
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherSchedule from '../pages/teacher/TeacherSchedule';
import TeacherFinances from '../pages/teacher/TeacherFinances';
import TeacherStudents from '../pages/teacher/TeacherStudents';
import TeacherHomework from '../pages/teacher/TeacherHomework';
import TeacherSettings from '../pages/teacher/TeacherSettings';

// Manager
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerApplications from '../pages/manager/ManagerApplications';
import ManagerSubscriptions from '../pages/manager/ManagerSubscriptions';
import ManagerReports from '../pages/manager/ManagerReports';
import ManagerMatching from '../pages/manager/ManagerMatching';
import ManagerSettings from '../pages/manager/ManagerSettings';

function roleDashboard(role: string): string {
  if (role === 'Student') return '/dashboard';
  if (role === 'Teacher') return '/teacher';
  if (role === 'Manager' || role === 'Admin') return '/manager';
  return '/';
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={roleDashboard(user.role)} replace />;
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role.toLowerCase())) return <Navigate to={roleDashboard(user.role)} replace />;
  return <>{children}</>;
}


const S = ['student'];
const T = ['teacher'];
const M = ['manager', 'admin'];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — redirect to dashboard if already logged in */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Student */}
        <Route path="/dashboard">
          <Route index element={<ProtectedRoute allowedRoles={S}><StudentDashboard /></ProtectedRoute>} />
          <Route path="homework" element={<ProtectedRoute allowedRoles={S}><StudentHomework /></ProtectedRoute>} />
          <Route path="schedule" element={<ProtectedRoute allowedRoles={S}><StudentSchedule /></ProtectedRoute>} />
          <Route path="subscription" element={<ProtectedRoute allowedRoles={S}><StudentSubscription /></ProtectedRoute>} />
          <Route path="grades" element={<ProtectedRoute allowedRoles={S}><StudentGrades /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={S}><StudentSettings /></ProtectedRoute>} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher">
          <Route index element={<ProtectedRoute allowedRoles={T}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="schedule" element={<ProtectedRoute allowedRoles={T}><TeacherSchedule /></ProtectedRoute>} />
          <Route path="finances" element={<ProtectedRoute allowedRoles={T}><TeacherFinances /></ProtectedRoute>} />
          <Route path="students" element={<ProtectedRoute allowedRoles={T}><TeacherStudents /></ProtectedRoute>} />
          <Route path="homework" element={<ProtectedRoute allowedRoles={T}><TeacherHomework /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={T}><TeacherSettings /></ProtectedRoute>} />
        </Route>

        {/* Manager */}
        <Route path="/manager">
          <Route index element={<ProtectedRoute allowedRoles={M}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="applications" element={<ProtectedRoute allowedRoles={M}><ManagerApplications /></ProtectedRoute>} />
          <Route path="subscriptions" element={<ProtectedRoute allowedRoles={M}><ManagerSubscriptions /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={M}><ManagerReports /></ProtectedRoute>} />
          <Route path="matching" element={<ProtectedRoute allowedRoles={M}><ManagerMatching /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={M}><ManagerSettings /></ProtectedRoute>} />
        </Route>

        {/* Fallback — authenticated users go to their dashboard, others to homepage */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
