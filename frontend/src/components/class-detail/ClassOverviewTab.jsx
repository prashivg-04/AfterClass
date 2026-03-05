export function ClassOverviewTab({ cls, attendanceSummary, hasAttendanceSubmitted, isTeacher }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Content Area - Class Summary */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Class Summary</h3>
          </div>
          <div className="p-6">
            {cls?.summary ? (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {cls.summary}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-slate-500">No summary added for this class.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Area - Stats & Info */}
      <div className="space-y-6">
        {/* Attendance Summary Card - Teacher only */}
        {isTeacher && attendanceSummary && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            {/* Background decorative accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 opacity-20 transition-all group-hover:opacity-40 ${hasAttendanceSubmitted ? 'bg-green-500' : 'bg-amber-500'
              }`}></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${hasAttendanceSubmitted ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Attendance</h3>
                </div>

                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${hasAttendanceSubmitted
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {hasAttendanceSubmitted ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      Submitted
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
                      Pending
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{attendanceSummary.split(' / ')[0]}</p>
                <p className="text-sm font-medium text-slate-500">/ {attendanceSummary.split(' / ')[1]} present</p>
              </div>

              {hasAttendanceSubmitted && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${(parseInt(attendanceSummary.split(' / ')[0]) / parseInt(attendanceSummary.split(' / ')[1])) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassOverviewTab;
