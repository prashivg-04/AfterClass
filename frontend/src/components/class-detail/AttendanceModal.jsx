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

  const markedCount = Object.keys(pendingAttendance).length;
  const presentCount = Object.values(pendingAttendance).filter(s => s === 'present').length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/60">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Mark Attendance</h3>
              <p className="text-xs font-bold text-slate-400">{markedCount} of {students.length} marked · {presentCount} present</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Student List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {students.map(student => {
            const status = pendingAttendance[student.id];
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isPresent
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : isAbsent
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shrink-0 transition-colors ${
                    isPresent ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                    : isAbsent ? 'bg-red-100 border-red-200 text-red-700'
                    : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-black text-slate-900 text-sm">{student.full_name}</span>
                </div>

                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectStatus(student.id, 'present')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                      isPresent
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStatus(student.id, 'absent')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                      isAbsent
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0 rounded-b-[2rem]">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="px-7 py-3 text-sm font-black bg-slate-900 text-white rounded-2xl hover:bg-slate-700 disabled:opacity-50 transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
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
