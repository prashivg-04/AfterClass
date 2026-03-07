export default function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Student Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Name</p>
            <p className="font-medium text-slate-900">{student.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Joined On</p>
            <p className="font-medium text-slate-900">
              {new Date(student.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="text-sm text-slate-500 mb-3">Performance</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">--%</p>
                <p className="text-xs text-slate-500">Attendance</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">--</p>
                <p className="text-xs text-slate-500">Classes</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">--</p>
                <p className="text-xs text-slate-500">Quizzes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
