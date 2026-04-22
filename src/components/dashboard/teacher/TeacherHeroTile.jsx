import React from 'react';

function TeacherHeroTile({ onAddClick }) {
  return (
    <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Welcome Back!</h3>
          <p className="text-slate-400 text-lg">Manage your classes, students, and payments all in one place.</p>
        </div>
        <button
          onClick={onAddClick}
          className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 shrink-0"
        >
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add New Tuition
        </button>
      </div>
    </div>
  );
}

export default TeacherHeroTile;
