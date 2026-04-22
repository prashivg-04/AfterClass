import { useNavigate } from 'react-router-dom';

export default function StudentProgressBanner({ kpiData, analyticsLoading, pendingFees, joinedTuitionsLength }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Progress Overview</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">
              {analyticsLoading ? 'Loading...' : (
                joinedTuitionsLength > 0 ? (
                  kpiData.attendancePercentage >= 80 ? (
                    <>Great job! 🎉 Your attendance is excellent</>
                  ) : kpiData.attendancePercentage >= 60 ? (
                    <>Good progress! Keep it up 👍</>
                  ) : (
                    <>Attendance needs attention 📚</>
                  )
                ) : 'Join a tuition to start learning'
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          View Fees
        </button>
      </div>
      {/* Pending fees pill */}
      {!analyticsLoading && pendingFees > 0 && (
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {pendingFees} pending fee{pendingFees > 1 ? 's' : ''} this month
        </div>
      )}
    </div>
  );
}
