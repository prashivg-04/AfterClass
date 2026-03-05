export function ClassQuizTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">Class Quizzes</h3>
        </div>

        <div className="p-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm relative rotate-3 hover:rotate-6 transition-transform">
                <span className="text-4xl text-blue-500 font-bold italic">?</span>
              </div>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Quiz Feature Coming Soon</h4>
            <p className="text-slate-500 leading-relaxed">
              We're building an interactive quiz system to test knowledge directly from the platform. Check back soon for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassQuizTab;
