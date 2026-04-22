const PaymentsList = ({
  loading,
  filteredStudents,
  tuitions,
  studentFees,
  payments,
  searchQuery,
  setSearchQuery,
  tuitionFilter,
  setTuitionFilter,
  statusFilter,
  setStatusFilter,
  handleApprovePayment,
  handleRejectPayment,
  handleMarkPaid,
  handleEditFee
}) => {
  return (
    <div className="xl:col-span-2 flex flex-col space-y-6 lg:order-1 order-2">
      {/* Filters Bar */}
      <div className="bg-white rounded-4xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="flex-1 w-full relative">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Find User</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or tuition..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="sm:w-[150px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tuition</label>
            <select
              value={tuitionFilter}
              onChange={(e) => setTuitionFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-slate-900 font-bold appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}
            >
              <option value="all">All</option>
              {tuitions.map((t) => (
                <option key={t.id} value={t.id} className="font-medium text-slate-900">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sm:w-[150px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-slate-900 font-bold appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}
            >
              <option value="all">Any Status</option>
              <option value="unpaid" className="text-red-600 font-bold">Unpaid</option>
              <option value="pending" className="text-amber-600 font-bold">Pending</option>
              <option value="paid" className="text-emerald-600 font-bold">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List Wrapper */}
      <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Roster ({filteredStudents.length})</h3>
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="w-12 h-12 rounded-full border-[3px] border-indigo-100 border-t-indigo-600 animate-spin"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="font-bold text-lg text-slate-600">No students found</p>
              <p className="text-sm">Try adjusting your active filters above.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const key = `${student.tuition_id}-${student.user_id}`;
                const fee = studentFees[key];
                const payment = payments[key];
                const status = payment?.status || 'unpaid';
                const feeAmount = fee?.fee_amount || 0;
                const dueDay = fee?.due_day || 1;

                return (
                  <div key={key} className="p-5 md:p-6 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center font-black text-indigo-700 shadow-sm shrink-0 border border-white group-hover:scale-105 transition-transform">
                          {student.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-lg truncate mb-1">{student.full_name}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                             <span className="truncate bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 border border-slate-200">
                               {student.tuition_name}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 justify-between lg:justify-end border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                        <div className="flex flex-col items-start lg:items-end w-24">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly</span>
                           <span className="font-black text-slate-900 text-xl">₹{feeAmount}</span>
                        </div>

                        <div className="flex flex-col items-start lg:items-end w-20">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due {dueDay}</span>
                           {status === 'paid' ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Paid
                              </span>
                           ) : status === 'pending' ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                Pending
                              </span>
                           ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200 overflow-hidden relative">
                                <span className="relative z-10">Unpaid</span>
                              </span>
                           )}
                        </div>
                      </div>

                      {/* Actions Group */}
                      <div className="flex lg:flex-col justify-end gap-2 shrink-0">
                          {status === 'pending' && (
                            <div className="flex gap-2 flex-col xs:flex-row w-full lg:w-32">
                              <button onClick={() => handleApprovePayment(student)} className="flex-1 lg:w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-center">
                                Approve
                              </button>
                              <button onClick={() => handleRejectPayment(student)} className="flex-1 lg:w-full px-3 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl active:scale-95 transition-all text-center">
                                Reject
                              </button>
                            </div>
                          )}

                          {status === 'unpaid' && (
                            <button onClick={() => handleMarkPaid(student)} className="flex-1 lg:w-32 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl shadow-[0_4px_14px_rgba(15,23,42,0.2)] active:scale-95 transition-all outline-none">
                              Mark Paid
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEditFee(student)}
                            className="w-10 h-10 lg:w-32 lg:h-auto lg:px-4 lg:py-2 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-slate-500 rounded-xl transition-all shadow-sm flex flex-col justify-center items-center active:scale-95 outline-none font-bold text-[13px]"
                            title="Edit Fee Setup"
                          >
                             <span className="hidden lg:block lg:mb-0">Edit Fee</span>
                             <svg className="w-5 h-5 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;
