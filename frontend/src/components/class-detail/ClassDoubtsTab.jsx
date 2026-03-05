export function ClassDoubtsTab({ isTeacher }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">
            {isTeacher ? 'Student Doubts' : 'Ask a Doubt'}
          </h3>
        </div>

        <div className="p-6 sm:p-8">
          {isTeacher ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-1">No doubts yet</h4>
              <p className="text-sm text-slate-500 max-w-sm">Students haven't posted any questions for this class yet.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-slate-50 rounded-xl p-1 shadow-sm border border-slate-200">
                <textarea
                  placeholder="What's your question about this class?"
                  rows={4}
                  className="w-full px-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200/60 mt-2">
                  <div className="text-xs text-slate-400 font-medium">Keep it concise and clear</div>
                  <button className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Question
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Previous Questions</h4>
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500 font-medium">No doubts posted yet for this class.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassDoubtsTab;
