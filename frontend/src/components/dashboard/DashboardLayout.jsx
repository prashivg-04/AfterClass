import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useState, useEffect } from 'react';
import logo from '../../assets/afterclass_logo_v2.svg';

function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [profileName, setProfileName] = useState(() => sessionStorage.getItem('cachedProfileName') || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {
    } else {
    }

    // Navigate after signOut completes
    navigate('/login');
  };



  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
           if (data?.full_name) {
             setProfileName(data.full_name);
             sessionStorage.setItem('cachedProfileName', data.full_name);
           }
        });
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
    <div className="h-screen overflow-hidden bg-[#FDFDFD] flex relative font-sans selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Unified Brand Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMXoiIGZpbGw9IiNlN2U1ZTQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.4] mask-[linear-gradient(to_bottom,white,transparent_80%)]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-linear-to-bl from-indigo-100/50 via-purple-50/20 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-linear-to-tr from-emerald-100/50 via-blue-50/20 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`w-64 shrink-0 bg-white/90 lg:bg-white/70 backdrop-blur-2xl border-r border-slate-200/60 flex flex-col h-full fixed lg:relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.05)] lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 lg:h-24 shrink-0 flex items-center px-8 justify-between">
          <img src={logo} alt="AfterClass Logo" className="w-36 lg:w-44 h-auto mix-blend-multiply opacity-90 transition-opacity" />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide mt-4">
          <Link
            to={role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student'}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold tracking-tight text-sm transition-all ${isActive(role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 line-through decoration-transparent'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/payments"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold tracking-tight text-sm transition-all ${isActive('/payments') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 line-through decoration-transparent'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payments
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200/60 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Secure Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-300">
            {role}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 min-w-0">
        {/* Header */}
        <header className="h-20 lg:h-24 shrink-0 px-4 sm:px-6 lg:px-12 flex items-center justify-between border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl border-2 border-transparent hover:border-slate-200 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:flex flex-col">
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight capitalize block">{role} Portal</h2>
              {profileName && <span className="text-xs lg:text-sm font-semibold text-slate-400">Welcome, {profileName}</span>}
            </div>
            {/* Mobile Title View */}
            <h2 className="sm:hidden text-lg font-black text-slate-900 tracking-tight capitalize">{role}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-white text-slate-400 hover:text-slate-900 rounded-full border-2 border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <Link
              to="/profile"
              className="w-10 h-10 shrink-0 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer border-2 border-white/80 ring-2 ring-transparent hover:ring-indigo-100"
              title="View Profile"
            >
              {getInitials()}
            </Link>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
