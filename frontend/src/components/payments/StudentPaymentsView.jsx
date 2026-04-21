import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utilities/errorHandler';
import DashboardLayout from '../dashboard/DashboardLayout';
import toast from 'react-hot-toast';

function StudentPaymentsView() {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [tuitions, setTuitions] = useState([]);
  const [studentFees, setStudentFees] = useState({});
  const [payments, setPayments] = useState({});
  const [teacherPaymentDetails, setTeacherPaymentDetails] = useState({});
  const [selectedQrCode, setSelectedQrCode] = useState(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // 1. Get tuitions where user is student
      const { data: tuitionMembers, error: memberError } = await supabase
        .from('tuition_members')
        .select('tuition_id')
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'student');

      if (memberError) throw memberError;

      const tuitionIds = tuitionMembers?.map(m => m.tuition_id) || [];
      if (tuitionIds.length === 0) {
        setTuitions([]);
        return;
      }

      // 2. Fetch full tuition details (name, created_by)
      const { data: tuitionsData, error: tuitionError } = await supabase
        .from('tuition_spaces')
        .select('id, name, created_by, monthly_fee, due_day')
        .in('id', tuitionIds);

      if (tuitionError) throw tuitionError;
      setTuitions(tuitionsData || []);

      // 3. Fetch student fee overrides
      const { data: feesData, error: feesError } = await supabase
        .from('student_fees')
        .select('tuition_id, fee_amount, due_day')
        .eq('student_id', user.id)
        .in('tuition_id', tuitionIds);

      if (feesError) throw feesError;

      const feesMap = {};
      feesData?.forEach(f => {
        feesMap[f.tuition_id] = f;
      });
      setStudentFees(feesMap);

      // 4. Fetch current month payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('fees_payments')
        .select('tuition_id, status, paid_on')
        .eq('student_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .in('tuition_id', tuitionIds);

      if (paymentsError) throw paymentsError;

      const paymentMap = {};
      paymentsData?.forEach(p => {
        paymentMap[p.tuition_id] = p;
      });
      setPayments(paymentMap);

      // 5. Fetch teacher payment details (UPI, QR)
      const teacherIds = [...new Set(tuitionsData?.map(t => t.created_by) || [])];
      if (teacherIds.length > 0) {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_payment_details')
          .select('teacher_id, upi_id, qr_code_url')
          .in('teacher_id', teacherIds);
        
        if (teacherError && teacherError.code !== 'PGRST116') throw teacherError;
        
        const teacherMap = {};
        teacherData?.forEach(t => {
          teacherMap[t.teacher_id] = t;
        });
        setTeacherPaymentDetails(teacherMap);
      }
    } catch (err) {
      handleError(err, 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPending = async (tuitionId) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert({
        tuition_id: tuitionId,
        student_id: user.id,
        month: currentMonth,
        year: currentYear,
        status: 'pending',
      }, { onConflict: 'tuition_id,student_id,month,year' });

      if (error) throw error;
      toast.success('Payment submitted for approval');
      fetchStudentData();
    } catch (err) {
      handleError(err, 'Failed to submit payment');
    }
  };

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
    <DashboardLayout role="Student">
      <div className="space-y-6 lg:space-y-8">
        {/* ── Dark Hero Tile ── */}
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

        {loading ? (
          <div className="p-12 flex items-center justify-center">
             <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          </div>
        ) : tuitions.length === 0 ? (
          <div className="bg-white rounded-4xl p-12 border border-slate-200/80 shadow-sm text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No active tuitions</h3>
            <p className="text-slate-500 font-medium">You are not enrolled in any tuitions yet, so there are no fees to pay.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {tuitions.map((tuition) => {
              const fee = studentFees[tuition.id];
              const payment = payments[tuition.id];
              const status = payment?.status || 'unpaid';
              const feeAmount = fee?.fee_amount ?? tuition.monthly_fee ?? 0;
              const dueDay = fee?.due_day || tuition.due_day || 1;
              const teacherInfo = teacherPaymentDetails[tuition.created_by];

              return (
                <div key={tuition.id} className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                  {/* Decorative corner accent depending on status */}
                  <div className={`absolute right-0 top-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 pointer-events-none opacity-40 transition-colors ${
                     status === 'paid' ? 'bg-emerald-100' : status === 'pending' ? 'bg-amber-100' : 'bg-red-50'
                  }`}></div>

                  <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-start relative z-10">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2 pr-6 line-clamp-1">{tuition.name}</h3>
                      <p className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl inline-block">Due {dueDay}{[1, 21, 31].includes(dueDay) ? 'st' : [2, 22].includes(dueDay) ? 'nd' : [3, 23].includes(dueDay) ? 'rd' : 'th'} of month</p>
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
                                  onClick={() => setSelectedQrCode(teacherInfo.qr_code_url)}
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
                                <div className="w-full h-full min-h[100px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
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
                        onClick={() => handleMarkPending(tuition.id)}
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
            })}
          </div>
        )}
      </div>

      {/* QR Code Expansion Modal */}
      {selectedQrCode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity"
          onClick={() => setSelectedQrCode(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center transform transition-all scale-100" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedQrCode(null)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Scan to Pay</h3>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 w-full mb-6">
              <img src={selectedQrCode} alt="Expanded QR Code" className="w-full h-auto object-contain rounded-2xl shadow-sm mix-blend-multiply" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Point your scanner at the screen</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentPaymentsView;
