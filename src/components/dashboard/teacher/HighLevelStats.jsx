import React from 'react';

function HighLevelStats({ analytics, analyticsLoading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Total Students</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : analytics.totalStudents}
        </p>
      </div>

      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Total Classes</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : analytics.totalClasses}
        </p>
      </div>

      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Uptime (Avg)</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : `${Math.max(0, analytics.averageAttendance)}%`}
        </p>
      </div>

      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Pending Fees</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : analytics.pendingFees}
        </p>
      </div>
    </div>
  );
}

export default HighLevelStats;
