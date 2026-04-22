export function ClassAttendanceTab({
  isTeacher,
  students,
  attendance,
  hasAttendanceSubmitted,
  onMarkAttendance,
}) {
  const myAttendance = attendance;

  return (
    <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {isTeacher ? 'Class Attendance' : 'Your Attendance'}
            </h3>
            {isTeacher && students.length > 0 && (
              <p className="text-xs font-bold text-slate-400 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
            )}
          </div>
        </div>
        {isTeacher && students.length > 0 && (
          <button
            onClick={onMarkAttendance}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm ${
              hasAttendanceSubmitted
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {hasAttendanceSubmitted
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
            {hasAttendanceSubmitted ? 'Edit Attendance' : 'Mark Attendance'}
          </button>
        )}
      </div>

      {isTeacher ? (
        students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-5 text-slate-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No students yet</h4>
            <p className="text-slate-500 font-medium">No students have joined this tuition.</p>
          </div>
        ) : hasAttendanceSubmitted ? (
          <div className="divide-y divide-slate-100">
            {students.map(student => {
              const currentStatus = attendance[student.id];
              const isPresent = currentStatus === 'present';
              return (
                <div key={student.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shrink-0 ${
                      isPresent ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-black text-slate-900">{student.full_name}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                    isPresent
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center mb-5 text-amber-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Attendance Not Marked</h4>
            <p className="text-slate-500 max-w-sm font-medium mb-6">
              Record attendance for {students.length} {students.length === 1 ? 'student' : 'students'} to track participation.
            </p>
            <button
              onClick={onMarkAttendance}
              className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-700 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Mark Attendance Now
            </button>
          </div>
        )
      ) : (
        /* Student view */
        <div className="p-8">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border ${
            !myAttendance
              ? 'bg-slate-50 border-slate-200'
              : myAttendance === 'present'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Your Status</p>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">Your attendance for this class</h4>
            </div>
            {myAttendance ? (
              <span className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black border ${
                myAttendance === 'present'
                  ? 'bg-white text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-white text-red-700 border-red-200 shadow-sm'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${myAttendance === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                {myAttendance === 'present' ? 'Present' : 'Absent'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black bg-white text-slate-500 border border-slate-200 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Not marked yet
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassAttendanceTab;
