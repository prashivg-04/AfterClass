const EditFeeModal = ({
  editingStudent,
  setEditingStudent,
  feeAmount,
  setFeeAmount,
  dueDay,
  setDueDay,
  handleSaveFee
}) => {
  if (!editingStudent) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl max-w-sm w-full shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 flex items-center justify-between relative">
           <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-blue-50/80 to-transparent pointer-events-none"></div>
           <div className="relative z-10 flex flex-col">
             <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Fee Config</h2>
             <p className="text-sm font-semibold text-slate-500 truncate max-w-[200px]">{editingStudent.full_name}</p>
           </div>
           <button onClick={() => setEditingStudent(null)} className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-2">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">{editingStudent.tuition_name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Monthly Fee (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all focus:bg-white"
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold tracking-wide text-slate-700 mb-2">Due Day of Month</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all focus:bg-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setEditingStudent(null)} className="flex-1 px-4 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
              Discard
            </button>
            <button onClick={handleSaveFee} className="flex-1 px-4 py-3 font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
              Update Fee
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditFeeModal;
