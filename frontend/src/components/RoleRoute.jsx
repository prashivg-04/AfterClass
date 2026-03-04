import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function RoleRoute({ children, allowedRoles }) {
  const { user, role, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has a role and it's not in allowedRoles, redirect to their dashboard
  if (role && !allowedRoles.includes(role)) {
    if (role === 'teacher') {
      return <Navigate to="/dashboard/teacher" replace />;
    }
    if (role === 'student') {
      return <Navigate to="/dashboard/student" replace />;
    }
  }

  // If role is not yet set, allow access (user needs to select role)
  return children;
}
