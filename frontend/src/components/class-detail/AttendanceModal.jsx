export function AttendanceModal({
  isOpen,
  students,
  pendingAttendance,
  onSelectStatus,
  onCancel,
  onSubmit,
  isSaving,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
            <p className="text-sm text-slate-500">Select status for {students.length} students</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full border border-slate-200 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-3">
            {students.map(student => {
              const status = pendingAttendance[student.id];
              return (
                <div
                  key={student.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${status === 'present'
                      ? 'border-green-200 bg-green-50/30'
                      : status === 'absent'
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 shadow-sm">
                      {student.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{student.full_name}</span>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg self-end sm:self-auto w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onSelectStatus(student.id, 'present')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${status === 'present'
                          ? 'bg-white text-green-700 shadow-sm border border-slate-200/50'
                          : 'text-slate-600 hover:text-green-600'
                        }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectStatus(student.id, 'absent')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${status === 'absent'
                          ? 'bg-white text-red-700 shadow-sm border border-slate-200/50'
                          : 'text-slate-600 hover:text-red-600'
                        }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceModal;
