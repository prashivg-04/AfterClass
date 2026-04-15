import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProfileCheckRoute({ children }) {
  const { needsProfile, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (needsProfile) {
    return <Navigate to="/role-selection" replace />;
  }

  return children;
}
