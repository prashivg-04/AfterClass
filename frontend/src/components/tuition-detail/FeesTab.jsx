import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utilities/errorHandler';

function FeesTab({ tuitionId, isTeacher }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState({});
  const [payments, setPayments] = useState({});
  const [teacherPaymentDetails, setTeacherPaymentDetails] = useState(null);
  const [tuitionInfo, setTuitionInfo] = useState(null);

  // For editing fees
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  // For teacher payment settings
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [savingPaymentDetails, setSavingPaymentDetails] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        await fetchTuitionInfo();
        await fetchTeacherPaymentDetails();

        if (isTeacher) {
          await fetchStudents();
        } else {
          await fetchStudentFeeInfo(currentUser.id);
        }
      }

      setLoading(false);
    };

    init();
  }, [tuitionId, isTeacher]);

  const fetchTuitionInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('tuition_spaces')
        .select('id, name, created_by')
        .eq('id', tuitionId)
        .single();

      if (error) throw error;
      setTuitionInfo(data);
    } catch (err) {
      handleError(err, 'Failed to fetch tuition info');
    }
  };

  const fetchTeacherPaymentDetails = async () => {
    try {
      if (!tuitionInfo?.created_by) {
        // Fetch tuition info first to get teacher id
        const { data: tuition } = await supabase
          .from('tuition_spaces')
          .select('created_by')
          .eq('id', tuitionId)
          .single();

        if (!tuition?.created_by) return;

        const { data, error } = await supabase
          .from('teacher_payment_details')
          .select('*')
          .eq('teacher_id', tuition.created_by)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setTeacherPaymentDetails(data);
        if (data) {
          setUpiId(data.upi_id || '');
          setQrCodeUrl(data.qr_code_url || '');
        }
      } else {
        const { data, error } = await supabase
          .from('teacher_payment_details')
          .select('*')
          .eq('teacher_id', tuitionInfo.created_by)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setTeacherPaymentDetails(data);
        if (data) {
          setUpiId(data.upi_id || '');
          setQrCodeUrl(data.qr_code_url || '');
        }
      }
    } catch (err) {
      handleError(err, 'Failed to fetch teacher payment details');
    }
  };

  const fetchStudents = async () => {
    try {

      // Get students in this tuition
      const { data: membersData, error: membersError } = await supabase
        .from('tuition_members')
        .select('user_id, created_at')
        .eq('tuition_id', tuitionId)
        .eq('role_in_tuition', 'student');


      if (membersError) throw membersError;

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);

        // Get profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);


        if (profilesError) throw profilesError;

        const profileMap = {};
        profilesData?.forEach((p) => {
          profileMap[p.id] = p.full_name;
        });

        const studentsList = membersData.map((m) => ({
          user_id: m.user_id,
          full_name: profileMap[m.user_id] || 'Unknown',
          joined_at: m.created_at,
        }));

        setStudents(studentsList);

        // Get individual fee settings
        const { data: feesData, error: feesError } = await supabase
          .from('student_fees')
          .select('student_id, fee_amount, due_day')
          .eq('tuition_id', tuitionId);


        if (feesError) throw feesError;

        const feesMap = {};
        feesData?.forEach((f) => {
          feesMap[f.student_id] = f;
        });
        setStudentFees(feesMap);

        // Get payment records for current month
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('fees_payments')
          .select('*')
          .eq('tuition_id', tuitionId)
          .eq('month', currentMonth)
          .eq('year', currentYear);

        if (paymentsError) throw paymentsError;

        const paymentMap = {};
        paymentsData?.forEach((p) => {
          paymentMap[p.student_id] = p;
        });
        setPayments(paymentMap);
      } else {
        setStudents([]);
      }
    } catch (err) {
      handleError(err, 'Failed to fetch students');
    }
  };

  const fetchStudentFeeInfo = async (studentId) => {
    try {

      // Get student's fee settings for this tuition
      const { data: feeData, error: feeError } = await supabase
        .from('student_fees')
        .select('fee_amount, due_day')
        .eq('tuition_id', tuitionId)
        .eq('student_id', studentId)
        .maybeSingle();


      if (feeError && feeError.code !== 'PGRST116') throw feeError;

      setStudentFees({ [studentId]: feeData || { fee_amount: 0, due_day: 1 } });

      // Get payment record for current month
      const { data: paymentData, error: paymentError } = await supabase
        .from('fees_payments')
        .select('*')
        .eq('tuition_id', tuitionId)
        .eq('student_id', studentId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();


      if (paymentError && paymentError.code !== 'PGRST116') throw paymentError;

      setPayments({ [studentId]: paymentData || { status: 'unpaid' } });
    } catch (err) {
      handleError(err, 'Failed to fetch fee info');
    }
  };

  const handleEditFee = (student) => {
    setEditingStudent(student);
    const fee = studentFees[student.user_id];
    setFeeAmount(fee?.fee_amount?.toString() || '');
    setDueDay(fee?.due_day?.toString() || '1');
  };

  const handleSaveFee = async () => {
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from('student_fees')
        .upsert(
          {
            tuition_id: tuitionId,
            student_id: editingStudent.user_id,
            fee_amount: parseFloat(feeAmount) || 0,
            due_day: parseInt(dueDay) || 1,
          },
          {
            onConflict: 'tuition_id,student_id',
          }
        );

      if (error) throw error;

      toast.success('Fee settings saved');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      handleError(err, 'Failed to save fee settings');
    }
  };

  const handleMarkPaid = async (studentId) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: tuitionId,
          student_id: studentId,
          month: currentMonth,
          year: currentYear,
          status: 'paid',
          paid_on: new Date().toISOString(),
        },
        {
          onConflict: 'tuition_id,student_id,month,year',
        }
      );

      if (error) throw error;

      toast.success('Payment marked as paid');
      fetchStudents();
    } catch (err) {
      handleError(err, 'Failed to mark payment');
    }
  };

  const handleApprovePayment = async (studentId) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: tuitionId,
          student_id: studentId,
          month: currentMonth,
          year: currentYear,
          status: 'paid',
          paid_on: new Date().toISOString(),
        },
        {
          onConflict: 'tuition_id,student_id,month,year',
        }
      );

      if (error) throw error;

      toast.success('Payment approved');
      fetchStudents();
    } catch (err) {
      handleError(err, 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (studentId) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: tuitionId,
          student_id: studentId,
          month: currentMonth,
          year: currentYear,
          status: 'unpaid',
          paid_on: null,
        },
        {
          onConflict: 'tuition_id,student_id,month,year',
        }
      );

      if (error) throw error;

      toast.success('Payment rejected');
      fetchStudents();
    } catch (err) {
      handleError(err, 'Failed to reject payment');
    }
  };

  const handleRequestPayment = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: tuitionId,
          student_id: user.id,
          month: currentMonth,
          year: currentYear,
          status: 'pending',
          paid_on: new Date().toISOString(),
        },
        {
          onConflict: 'tuition_id,student_id,month,year',
        }
      );

      if (error) throw error;

      toast.success('Payment request submitted. Awaiting teacher approval.');
      fetchStudentFeeInfo(user.id);
    } catch (err) {
      handleError(err, 'Failed to submit payment request');
    }
  };

  const handleSaveTeacherPaymentDetails = async () => {
    if (!user) return;

    setSavingPaymentDetails(true);
    try {
      const { error } = await supabase.from('teacher_payment_details').upsert(
        {
          teacher_id: user.id,
          upi_id: upiId || null,
          qr_code_url: qrCodeUrl || null,
        },
        {
          onConflict: 'teacher_id',
        }
      );

      if (error) throw error;

      toast.success('Payment details saved');
      fetchTeacherPaymentDetails();
    } catch (err) {
      handleError(err, 'Failed to save payment details');
    } finally {
      setSavingPaymentDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Unpaid
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDueDate = (dueDay) => {
    const day = dueDay || 1;
    return `${day} ${monthName}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // TEACHER VIEW
  if (isTeacher) {
    return (
      <div className="space-y-6">
        {/* Teacher Payment Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Your Payment Details</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Students will see these details to make payments
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g., yourname@upi"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">QR Code URL</label>
              <input
                type="text"
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSaveTeacherPaymentDetails}
              disabled={savingPaymentDetails}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingPaymentDetails ? 'Saving...' : 'Save Payment Details'}
            </button>
          </div>
        </div>

        {/* Student Fees Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">
                Fee Management - {monthName} {currentYear}
              </h3>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No students enrolled in this tuition
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map((student) => {
                const fee = studentFees[student.user_id];
                const payment = payments[student.user_id];
                const status = payment?.status || 'unpaid';
                const feeAmount = fee?.fee_amount || 0;
                const dueDay = fee?.due_day || 1;

                return (
                  <div key={student.user_id} className="p-4 hover:bg-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Student Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {student.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{student.full_name}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="text-slate-500">Fee: ₹{feeAmount}</span>
                            <span className="text-slate-500">Due: {getDueDate(dueDay)}</span>
                            {fee?.fee_amount && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Custom</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(status)}

                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(student.user_id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(student.user_id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {status === 'unpaid' && (
                          <button
                            onClick={() => handleMarkPaid(student.user_id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          onClick={() => handleEditFee(student)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Edit Fee
                        </button>
                      </div>
                    </div>

                    {/* Payment date if paid */}
                    {payment?.paid_on && status === 'paid' && (
                      <p className="text-xs text-slate-500 mt-2 ml-14">
                        Paid on: {formatDate(payment.paid_on)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Fee Modal */}
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Edit Fee for {editingStudent.full_name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STUDENT VIEW
  const studentId = user?.id;
  const fee = studentFees[studentId];
  const payment = payments[studentId];
  const status = payment?.status || 'unpaid';
  const currentFeeAmount = fee?.fee_amount || 0;
  const currentDueDay = fee?.due_day || 1;

  return (
    <div className="space-y-6">
      {/* Fee Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">Your Fee Details</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Fee Amount</p>
            <p className="text-2xl font-bold text-slate-900">₹{currentFeeAmount}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Due Date</p>
            <p className="text-2xl font-bold text-slate-900">{getDueDate(currentDueDay)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <div className="mt-1">{getStatusBadge(status)}</div>
          </div>
        </div>

        {/* Action Button */}
        {status === 'unpaid' && (
          <button
            onClick={handleRequestPayment}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            I Have Paid
          </button>
        )}

        {status === 'pending' && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Payment request submitted. Awaiting teacher approval.</span>
          </div>
        )}

        {status === 'paid' && payment?.paid_on && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Payment confirmed on {formatDate(payment.paid_on)}</span>
          </div>
        )}
      </div>

      {/* Teacher Payment Details */}
      {teacherPaymentDetails && (teacherPaymentDetails.upi_id || teacherPaymentDetails.qr_code_url) && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Teacher Payment Details</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {teacherPaymentDetails.upi_id && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">UPI ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 px-4 py-2 rounded-lg text-slate-900 font-mono">
                    {teacherPaymentDetails.upi_id}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(teacherPaymentDetails.upi_id);
                      toast.success('UPI ID copied');
                    }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Copy UPI ID"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {teacherPaymentDetails.qr_code_url && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">QR Code</label>
                <img
                  src={teacherPaymentDetails.qr_code_url}
                  alt="Payment QR Code"
                  className="w-32 h-32 object-contain border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!teacherPaymentDetails?.upi_id && !teacherPaymentDetails?.qr_code_url && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800">Payment details not set</p>
              <p className="text-sm text-amber-700 mt-1">
                The teacher has not added UPI ID or QR code yet. Please contact your teacher for payment details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeesTab;
