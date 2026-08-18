import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { AmbientBackground } from '@/components/ui/ambient-background';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import TasksPage from '@/pages/Tasks';
import AttendancePage from '@/pages/Attendance';
import LeaderboardPage from '@/pages/Leaderboard';
import InsightsPage from '@/pages/Insights';
import AdminPage from '@/pages/Admin';

// Root ("/") has no content of its own — it just sends visitors into
// the dashboard. If they're not logged in, DashboardLayout's own auth
// check redirects to /login from there. This mirrors what app/page.tsx
// did in the Next.js version (that file existing was the fix for the
// earlier 404-at-root bug — same logic, just expressed as a route here
// instead of a missing file).
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AmbientBackground />
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
