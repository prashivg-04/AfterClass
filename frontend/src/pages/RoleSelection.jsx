import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user already has a role - redirect to dashboard if so
    const checkExistingRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role) {
        if (profile.role === 'teacher') navigate('/dashboard/teacher');
        else if (profile.role === 'student') navigate('/dashboard/student');
        return;
      }

      setLoading(false);
    };

    checkExistingRole();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }

    setSubmitting(true);
    try {
      // First try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      const user = session.user;
      if (!user) throw new Error('Could not get user details. Please log in again.');

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: selectedRole,
        });

      if (upsertError) throw upsertError;

      if (selectedRole === 'teacher') {
        navigate('/dashboard/teacher');
      } else if (selectedRole === 'student') {
        navigate('/dashboard/student');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving your role.');
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage classes, students, and assignments',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Access classes, assignments, and resources',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <AuthLayout title="Choose your role" subtitle="Select how you'll be using AfterClass">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`
                relative p-6 rounded-lg border-2 transition-all text-left
                ${selectedRole === role.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                    flex-shrink-0 p-3 rounded-lg transition-colors
                    ${selectedRole === role.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  {role.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{role.title}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <div
                  className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all mt-1.5
                    ${selectedRole === role.id
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {selectedRole === role.id && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!selectedRole || submitting}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedRole && !submitting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {submitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
