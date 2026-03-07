export default function RemoveStudentModal({
  student,
  error,
  onCancel,
  onConfirm
}) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Remove Student
        </h3>
        <p className="text-slate-600 mb-6">
          Are you sure you want to remove {student.full_name} from this tuition?
        </p>
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Confirm Remove
          </button>
        </div>
      </div>
    </div>
  );
}
