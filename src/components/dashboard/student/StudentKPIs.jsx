export default function StudentKPIs({ kpiData, kpiLoading, analyticsLoading, averageQuizScore }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Attendance % */}
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Attendance</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : `${kpiData.attendancePercentage}%`}
        </p>
      </div>

      {/* Classes Attended */}
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Classes</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : kpiData.classesAttended}
        </p>
      </div>

      {/* Quizzes Attempted */}
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Quizzes</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : kpiData.quizzesAttempted}
        </p>
      </div>

      {/* Avg Quiz Score */}
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Avg Score</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : `${averageQuizScore}%`}
        </p>
      </div>
    </div>
  );
}
