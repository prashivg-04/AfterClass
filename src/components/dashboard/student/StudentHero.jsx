export default function StudentHero({ onOpenJoinModal }) {
  return (
    <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">Student Command Center</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Your Learning Hub.</h1>
          <p className="text-slate-400 text-base max-w-lg">Track your attendance, quizzes, and tuitions all in one place.</p>
        </div>
        <button
          onClick={onOpenJoinModal}
          className="shrink-0 flex items-center gap-2.5 px-6 py-3.5 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 border border-white/80"
        >
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Join Tuition
        </button>
      </div>
    </div>
  );
}
