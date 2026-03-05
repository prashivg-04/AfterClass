export function OverviewTab({ cls, isTeacher, hasAttendanceSubmitted, attendanceSummary, students }) {
  return (
    <div className="space-y-6">
      {/* Class Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Class Summary</h3>
        <p className="text-slate-600 whitespace-pre-wrap">
          {cls.summary || 'No summary added for this class.'}
        </p>
      </div>

      {/* Attendance Summary Card - Teacher only */}
      {isTeacher && students.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Attendance Summary</h3>
            <span className="text-sm text-slate-500">
              {hasAttendanceSubmitted ? (
                <span className="text-green-600 font-medium">Submitted</span>
              ) : (
                <span className="text-amber-600 font-medium">Pending</span>
              )}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{attendanceSummary}</p>
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
