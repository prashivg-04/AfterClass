export function ClassResourcesTab({ isTeacher }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">Resources</h3>
        </div>

        <div className="p-8">
          {isTeacher ? (
            <>
              <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-10 text-center transition-colors hover:bg-slate-50 hover:border-slate-400">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-slate-900 mb-1">Upload class resources</div>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  Share PDFs, study notes, assignments, and documents for this class with your students.
                </p>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Select Files
                </button>
              </div>
              <p className="text-center text-sm font-medium text-slate-400 mt-6">No resources uploaded yet.</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-2">Class Resources</div>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                PDFs, notes, and documents uploaded by your teacher will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassResourcesTab;
