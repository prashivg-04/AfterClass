import toast from 'react-hot-toast';

export default function TuitionPaymentCard({
  tuition,
  feeAmount,
  dueDay,
  status,
  payment,
  teacherInfo,
  onMarkPending,
  onExpandQr
}) {

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Paid</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Unpaid</span>;
    }
  };

  return (
    <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
      {/* Decorative corner accent depending on status */}
      <div className={`absolute right-0 top-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 pointer-events-none opacity-40 transition-colors ${
          status === 'paid' ? 'bg-emerald-100' : status === 'pending' ? 'bg-amber-100' : 'bg-red-50'
      }`}></div>

      <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2 pr-6 line-clamp-1">{tuition.name}</h3>
          <p className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl inline-block">
            Due {dueDay}{[1, 21, 31].includes(dueDay) ? 'st' : [2, 22].includes(dueDay) ? 'nd' : [3, 23].includes(dueDay) ? 'rd' : 'th'} of month
          </p>
        </div>
        <div className="shrink-0 mt-1">
          {getStatusBadge(status)}
        </div>
      </div>
      
      <div className="p-6 lg:p-8 flex-1 relative z-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Total Amount</p>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">₹{feeAmount}</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <span className="font-serif text-2xl font-bold">₹</span>
          </div>
        </div>

        {/* Teacher Payment Info Card */}
        {teacherInfo ? (
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 mb-6">
            <div className="flex items-center gap-2.5 mb-5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Teacher Setup</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* UPI Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between group">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    UPI ID
                  </p>
                  {teacherInfo.upi_id ? (
                    <p className="font-bold text-slate-900 break-all text-base">{teacherInfo.upi_id}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic py-1">No UPI provided</p>
                  )}
                </div>
                {teacherInfo.upi_id && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(teacherInfo.upi_id);
                      toast.success('UPI ID Copied!');
                    }}
                    className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 w-full px-4 py-2.5 rounded-xl border border-indigo-100/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Copy ID
                  </button>
                )}
              </div>

              {/* QR Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                  QR Code
                </p>
                <div className="flex-1 flex items-center justify-center">
                  {teacherInfo.qr_code_url ? (
                    <div 
                      className="border-2 border-slate-100 rounded-2xl p-2.5 inline-block cursor-zoom-in hover:border-indigo-200 hover:shadow-lg transition-all group relative bg-white"
                      onClick={() => onExpandQr(teacherInfo.qr_code_url)}
                      title="Click to expand"
                    >
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-600 drop-shadow-sm bg-white rounded-full p-1.5 border border-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      </div>
                      <img 
                        src={teacherInfo.qr_code_url} 
                        alt="Teacher QR Code" 
                        className="w-28 h-28 object-contain rounded-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'inline-flex';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[100px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
                      <p className="text-xs text-slate-400 font-medium italic">No QR mapped</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200/60 mb-6 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-amber-900 tracking-tight text-sm mb-1">Awaiting Details</h4>
                <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                  Your teacher has not provided a UPI ID or QR Code mapped. Contact them directly to receive payment details.
                </p>
              </div>
          </div>
        )}

        {status === 'paid' && payment?.paid_on && (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-0.5">Payment Verified</p>
              <p className="text-sm font-medium text-emerald-800">Remitted on {new Date(payment.paid_on).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 lg:p-8 pt-0 relative z-10 mt-auto">
        {status === 'unpaid' ? (
          <button 
            onClick={() => onMarkPending(tuition.id)}
            className="w-full py-4 bg-slate-900 hover:bg-amber-600 text-white rounded-2xl font-bold transition-colors shadow-md active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            I have made the payment
          </button>
        ) : status === 'pending' ? (
            <div className="w-full py-4 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-2xl font-bold flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Waiting for teacher's approval
            </div>
        ) : (
            <div className="w-full py-4 bg-emerald-50 border border-emerald-200/50 text-emerald-700 rounded-2xl font-bold flex justify-center items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Payment approved by teacher
            </div>
        )}
      </div>
    </div>
  );
}
