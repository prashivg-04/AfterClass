export function ClassAttendanceTab({
  isTeacher,
  students,
  attendance,
  hasAttendanceSubmitted,
  onMarkAttendance,
}) {
  const myAttendance = attendance; // For student view - would need userId passed in

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">
              {isTeacher ? 'Class Attendance' : 'Your Attendance'}
            </h3>
          </div>
          {isTeacher && !hasAttendanceSubmitted && students.length > 0 && (
            <button
              onClick={onMarkAttendance}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Attendance
            </button>
          )}
          {isTeacher && hasAttendanceSubmitted && students.length > 0 && (
            <button
              onClick={onMarkAttendance}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Attendance
            </button>
          )}
        </div>

        {isTeacher ? (
          students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No students in this tuition.</p>
            </div>
          ) : hasAttendanceSubmitted ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(student => {
                    const currentStatus = attendance[student.id];
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                              {student.full_name.charAt(0)}
                            </div>
                            <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${currentStatus === 'present'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentStatus === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {currentStatus === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-1">Attendance Not Marked</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Record attendance for {students.length} {students.length === 1 ? 'student' : 'students'} to track participation.
              </p>
              <button
                onClick={onMarkAttendance}
                className="mt-6 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                Mark Attendance Now
              </button>
            </div>
          )
        ) : (
          <div className="p-8">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border ${!myAttendance
                ? 'bg-slate-50 border-slate-200'
                : myAttendance === 'present'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Class Status</h4>
                <p className="text-sm text-slate-500 mt-0.5">Your recorded attendance for this class</p>
              </div>

              {myAttendance ? (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${myAttendance === 'present'
                    ? 'bg-white text-green-700 border border-green-200'
                    : 'bg-white text-red-700 border border-red-200'
                  }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${myAttendance === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {myAttendance === 'present' ? 'Present' : 'Absent'}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 shadow-sm">
                  <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  To be marked
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassAttendanceTab;
