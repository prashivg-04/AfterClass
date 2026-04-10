import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PublicRoute } from './components/PublicRoute';
import { PrivateRoute } from './components/PrivateRoute';
import { RoleRoute } from './components/RoleRoute';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TuitionDetail from './pages/TuitionDetail';
import ClassDetail from './pages/ClassDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Payments from './pages/Payments';

function App() {
  const { loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'text-sm font-medium shadow-lg rounded-xl',
          style: {
            padding: '16px',
            color: '#1e293b',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
              color: '#166534',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              background: '#fef2f2',
              borderColor: '#fecaca',
              color: '#991b1b',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/role-selection" element={
          <PrivateRoute>
            <RoleSelection />
          </PrivateRoute>
        } />
        <Route path="/dashboard/teacher" element={
          <RoleRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </RoleRoute>
        } />
        <Route path="/dashboard/student" element={
          <RoleRoute allowedRoles={['student']}>
            <StudentDashboard />
          </RoleRoute>
        } />
        <Route path="/dashboard/teacher/tuition/:tuitionId" element={
          <RoleRoute allowedRoles={['teacher']}>
            <TuitionDetail role="Teacher" />
          </RoleRoute>
        } />
        <Route path="/dashboard/student/tuition/:tuitionId" element={
          <RoleRoute allowedRoles={['student']}>
            <TuitionDetail role="Student" />
          </RoleRoute>
        } />
        <Route path="/dashboard/teacher/tuition/:tuitionId/class/:classId" element={
          <RoleRoute allowedRoles={['teacher']}>
            <ClassDetail role="Teacher" />
          </RoleRoute>
        } />
        <Route path="/dashboard/student/tuition/:tuitionId/class/:classId" element={
          <RoleRoute allowedRoles={['student']}>
            <ClassDetail role="Student" />
          </RoleRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/payments" element={
          <RoleRoute allowedRoles={['teacher', 'student']}>
            <Payments />
          </RoleRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;