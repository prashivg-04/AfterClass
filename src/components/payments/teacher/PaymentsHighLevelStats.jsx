const PaymentsHighLevelStats = ({ loading, allStudents, payments }) => {
  if (loading || allStudents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Total Managed</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{allStudents.length}</p>
      </div>

      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Pending Approvals</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {allStudents.filter((s) => payments[`${s.tuition_id}-${s.user_id}`]?.status === 'pending').length}
        </p>
      </div>

      <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Paid This Month</p>
        <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {allStudents.filter((s) => payments[`${s.tuition_id}-${s.user_id}`]?.status === 'paid').length}
        </p>
      </div>
    </div>
  );
};

export default PaymentsHighLevelStats;
