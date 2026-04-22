import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utilities/errorHandler';
import DashboardLayout from '../dashboard/DashboardLayout';
import toast from 'react-hot-toast';

import PaymentHero from './PaymentHero';
import TuitionPaymentCard from './TuitionPaymentCard';
import QrScannerModal from './QrScannerModal';

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

  return (
    <DashboardLayout role="Student">
      <div className="space-y-6 lg:space-y-8">
        
        <PaymentHero monthName={monthName} currentYear={currentYear} />

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
                <TuitionPaymentCard 
                  key={tuition.id}
                  tuition={tuition}
                  feeAmount={feeAmount}
                  dueDay={dueDay}
                  status={status}
                  payment={payment}
                  teacherInfo={teacherInfo}
                  onMarkPending={handleMarkPending}
                  onExpandQr={setSelectedQrCode}
                />
              );
            })}
          </div>
        )}
      </div>

      <QrScannerModal 
        qrCodeUrl={selectedQrCode} 
        onClose={() => setSelectedQrCode(null)} 
      />

    </DashboardLayout>
  );
}

export default StudentPaymentsView;
