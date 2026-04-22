export default function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Details</h2>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</p>
            <p className="font-bold text-lg text-slate-900">{student.full_name}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Joined On</p>
            <p className="font-bold text-lg text-slate-900">
              {new Date(student.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="pt-2">
            <p className="text-sm font-bold text-slate-900 mb-3">Performance Overview</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <p className="text-2xl font-extrabold text-slate-900">--%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Attendance</p>
              </div>
              <div className="text-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                <p className="text-2xl font-extrabold text-slate-900">--</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Classes</p>
              </div>
              <div className="text-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                <p className="text-2xl font-extrabold text-slate-900">--</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Quizzes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full px-6 py-3.5 text-sm font-bold tracking-wide text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
