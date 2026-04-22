const PaymentsHeroTile = ({ monthName, currentYear }) => {
  return (
    <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold tracking-wider uppercase border border-white/10 shadow-inner">
              {monthName} {currentYear}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Billing & Collections</h1>
          <p className="text-slate-400 text-lg max-w-xl">Oversee fee collections, mark payments, and manage your payment details seamlessly.</p>
        </div>
        <div className="shrink-0 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsHeroTile;
