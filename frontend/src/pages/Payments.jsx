import { useSelector } from 'react-redux';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function Payments() {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user_metadata?.role === 'teacher' ? 'Teacher' : 'Student';

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-60 animate-pulse"></div>
          <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* Decorative small icons */}
          <div className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm -rotate-6 z-20">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -left-4 w-8 h-8 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-center shadow-sm rotate-12 z-20">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Payments Coming Soon</h2>

        <p className="text-base text-slate-600 max-w-md leading-relaxed mb-8">
          We're building a seamless way to manage your class subscriptions, process online payments, and view your transaction history.
        </p>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200/60 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Currently in development
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Payments;