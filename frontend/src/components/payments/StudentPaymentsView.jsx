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
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">My Payments</h1>
          <p className="text-slate-600">Track and manage your tuition fees for {monthName} {currentYear}</p>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tuitions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center text-slate-500">
            You are not enrolled in any tuitions yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tuitions.map((tuition) => {
              const fee = studentFees[tuition.id];
              const payment = payments[tuition.id];
              const status = payment?.status || 'unpaid';
              const feeAmount = fee?.fee_amount || tuition.monthly_fee || 0;
              const dueDay = fee?.due_day || tuition.due_day || 1;
              const teacherInfo = teacherPaymentDetails[tuition.created_by];

              return (
                <div key={tuition.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{tuition.name}</h3>
                      <p className="text-sm text-slate-500">Due by {dueDay}{[1, 21, 31].includes(dueDay) ? 'st' : [2, 22].includes(dueDay) ? 'nd' : [3, 23].includes(dueDay) ? 'rd' : 'th'} of month</p>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                  
                  <div className="p-5 flex-1">
                    <div className="mb-6">
                      <p className="text-sm text-slate-500 mb-1">Fee Amount</p>
                      <p className="text-2xl font-bold text-slate-900">₹{feeAmount}</p>
                    </div>

                    {/* Teacher Payment Info Card - ALWAYS VISIBLE */}
                    {teacherInfo ? (
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-slate-800">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                          <h4 className="font-bold">Teacher Payment Details</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* UPI Card */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                UPI Payment
                              </p>
                              {teacherInfo.upi_id ? (
                                <p className="font-bold text-slate-900 break-all text-base">{teacherInfo.upi_id}</p>
                              ) : (
                                <p className="text-sm text-slate-400 italic py-2">No UPI ID provided</p>
                              )}
                            </div>
                            {teacherInfo.upi_id && (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(teacherInfo.upi_id);
                                  toast.success('UPI ID Copied!');
                                }}
                                className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 w-full py-2.5 rounded-lg border border-blue-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                Copy UPI ID
                              </button>
                            )}
                          </div>

                          {/* QR Card */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                              Scan QR
                            </p>
                            <div className="flex-1 flex items-center justify-center">
                              {teacherInfo.qr_code_url ? (
                                <div 
                                  className="border-2 border-slate-100 rounded-xl p-2 inline-block cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group relative"
                                  onClick={() => setSelectedQrCode(teacherInfo.qr_code_url)}
                                  title="Click to expand"
                                >
                                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600 drop-shadow-sm bg-white rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                  </div>
                                  <img 
                                    src={teacherInfo.qr_code_url} 
                                    alt="Teacher Payment QR Code" 
                                    className="w-32 h-32 object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'inline-flex';
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full py-8 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                  <p className="text-sm text-slate-400 italic">No QR image provided</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 mb-6 flex flex-col gap-3 shadow-sm">
                         <div className="flex items-center gap-2 text-amber-800 font-bold">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                           Awaiting Payment Details
                         </div>
                         <p className="text-sm text-amber-700 leading-relaxed font-medium">
                           Your teacher has not provided a UPI ID or QR Code yet. Please contact them directly so you know where to send your fees!
                         </p>
                      </div>
                    )}

                    {status === 'paid' && payment?.paid_on && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-6">
                        <p className="text-sm text-emerald-800 font-medium mb-1">Receipt</p>
                        <p className="text-xs text-emerald-600">Paid on {new Date(payment.paid_on).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/30">
                    {status === 'unpaid' ? (
                      <button 
                        onClick={() => handleMarkPending(tuition.id)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                      >
                        I Have Paid
                      </button>
                    ) : status === 'pending' ? (
                        <button disabled className="w-full py-2.5 bg-amber-100 text-amber-700 rounded-xl font-medium cursor-not-allowed">
                          Waiting for approval
                        </button>
                    ) : (
                        <button disabled className="w-full py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-medium cursor-not-allowed">
                          Paid ✅
                        </button>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedQrCode(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center transform transition-all" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedQrCode(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6 mt-2">Scan to Pay</h3>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 w-full mb-4">
              <img src={selectedQrCode} alt="Expanded QR Code" className="w-full h-auto object-contain rounded-xl" />
            </div>
            <p className="text-sm font-medium text-slate-500">Point your scanner at the screen</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentPaymentsView;
