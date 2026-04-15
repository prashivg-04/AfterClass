import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useState, useEffect } from 'react';

function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    console.log('Logout clicked');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    } else {
      console.log('SignOut successful, navigating to /login');
    }

    // Navigate after signOut completes
    navigate('/login');
  };

  const [profileName, setProfileName] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => setProfileName(data?.full_name));
    }
  }, [session?.user?.id]);

  const getInitials = () => {
    if (!session?.user) return role?.[0]?.toUpperCase() || '?';
    const name = profileName || session.user.user_metadata?.full_name;
    const email = session.user.email;
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }
    if (email) {
        return email[0].toUpperCase();
    }
    return role?.[0]?.toUpperCase() || '?';
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">AfterClass</h1>
          <p className="text-sm text-slate-600 mt-1 capitalize">{role} Dashboard</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          <Link
            to={role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student'}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${isActive(role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student') ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/payments"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${isActive('/payments') ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payments
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <Link
                to="/profile"
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm hover:shadow hover:ring-2 hover:ring-indigo-500/50 hover:ring-offset-2 transition-all cursor-pointer"
                title="View Profile"
              >
                {getInitials()}
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
