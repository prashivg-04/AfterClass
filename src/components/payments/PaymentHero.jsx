export default function PaymentHero({ monthName, currentYear }) {
  return (
    <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <p className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-3">Fee Tracking</p>
           <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">My Payments.</h1>
           <p className="text-slate-400 text-base max-w-lg">Track and manage your tuition fees for {monthName} {currentYear}.</p>
        </div>
        <div className="shrink-0 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl">
           <div className="bg-emerald-500/20 w-14 h-14 flex items-center justify-center rounded-2xl border border-emerald-500/30">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <div className="pr-2">
             <p className="text-xs font-bold tracking-wider text-emerald-200/70 uppercase">Cycle</p>
             <p className="text-2xl font-black text-white tracking-tight">{monthName}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
