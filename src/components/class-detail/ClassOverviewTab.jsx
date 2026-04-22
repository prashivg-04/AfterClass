export function ClassOverviewTab({ cls, hasAttendanceSubmitted, isTeacher, presentCount, totalCount }) {
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ── Main Content: Class Summary ── */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Class Summary</h3>
          </div>
          <div className="p-6 lg:p-8">
            {cls?.summary ? (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">{cls.summary}</p>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="font-black text-slate-700 tracking-tight">No summary yet</p>
                <p className="text-sm text-slate-400 mt-1 font-medium">No summary has been added for this class.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar: Attendance Stats ── */}
      <div className="space-y-5">
        {isTeacher && totalCount > 0 && (
          <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                hasAttendanceSubmitted
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Attendance</h3>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                hasAttendanceSubmitted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {hasAttendanceSubmitted ? 'Done' : 'Pending'}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-5xl font-black text-slate-900 tracking-tight">{presentCount}</p>
                <p className="text-base font-bold text-slate-400">/ {totalCount} present</p>
              </div>
              {hasAttendanceSubmitted && totalCount > 0 && (
                <>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${attendancePct}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-400">{attendancePct}% attendance rate</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Class Info Card */}
        <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Class Details</p>
          <div className="space-y-3">
            {cls?.created_at && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(cls.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassOverviewTab;
