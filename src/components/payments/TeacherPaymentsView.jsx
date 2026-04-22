import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utilities/errorHandler';

import PaymentsHeroTile from './teacher/PaymentsHeroTile';
import PaymentsHighLevelStats from './teacher/PaymentsHighLevelStats';
import PaymentsTeacherConfig from './teacher/PaymentsTeacherConfig';
import PaymentsList from './teacher/PaymentsList';
import EditFeeModal from './teacher/EditFeeModal';

function TeacherPaymentsView() {
  const { user } = useSelector((state) => state.auth);
  // Default to Teacher logic here
  const role = 'Teacher';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [tuitions, setTuitions] = useState([]);
  const [studentFees, setStudentFees] = useState({});
  const [payments, setPayments] = useState({});
  const [teacherPaymentDetails, setTeacherPaymentDetails] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [tuitionFilter, setTuitionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // For editing fees
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  // For teacher payment settings
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [savingPaymentDetails, setSavingPaymentDetails] = useState(false);
  const [isEditingPaymentDetails, setIsEditingPaymentDetails] = useState(false);
  const fileInputRef = useRef(null);

  const handleDeleteQrCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const { error } = await supabase.from('teacher_payment_details').upsert(
        {
          teacher_id: user.id,
          upi_id: upiId || null,
          qr_code_url: null,
        },
        {
          onConflict: 'teacher_id',
        }
      );
      
      if (error) throw error;
      
      setQrCodeUrl('');
      toast.success('QR Code removed!');
      fetchTeacherData();
    } catch(err) {
      handleError(err, 'Failed to remove QR Code');
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allStudents, statusFilter, tuitionFilter, searchQuery]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Step 1: Get all tuitions where user is a teacher (via created_by OR via tuition_members)

      // Get tuitions created by user
      const { data: createdTuitions, error: createdError } = await supabase
        .from('tuition_spaces')
        .select('id, name, subject, grade')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdError) {
        throw createdError;
      }

      // Get tuitions where user is a member with teacher role
      const { data: memberTuitions, error: memberError } = await supabase
        .from('tuition_members')
        .select('tuition_id')
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'teacher');

      if (memberError) {
        throw memberError;
      }

      // Combine all tuition IDs
      const tuitionIdsFromCreated = createdTuitions?.map((t) => t.id) || [];
      const tuitionIdsFromMember = memberTuitions?.map((m) => m.tuition_id) || [];
      const allTuitionIds = [...new Set([...tuitionIdsFromCreated, ...tuitionIdsFromMember])];


      // Fetch full tuition data for all unique IDs
      let allTuitionsData = [];
      if (allTuitionIds.length > 0) {
        const { data: fullTuitions, error: fullError } = await supabase
          .from('tuition_spaces')
          .select('id, name, subject, grade')
          .in('id', allTuitionIds)
          .order('created_at', { ascending: false });

        if (fullError) throw fullError;
        allTuitionsData = fullTuitions || [];
      }

      setTuitions(allTuitionsData);

      // Step 2: Fetch all students across all tuitions
      if (allTuitionIds.length > 0) {

        const { data: membersData, error: membersError } = await supabase
          .from('tuition_members')
          .select('user_id, tuition_id, created_at')
          .in('tuition_id', allTuitionIds)
          .eq('role_in_tuition', 'student');

        if (membersError) {
          throw membersError;
        }


        if (membersData && membersData.length > 0) {
          const userIds = [...new Set(membersData.map((m) => m.user_id))];

          // Get profiles for all students
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (profilesError) {
            throw profilesError;
          }


          const profileMap = {};
          profilesData?.forEach((p) => {
            profileMap[p.id] = p.full_name;
          });

          const tuitionMap = {};
          allTuitionsData?.forEach((t) => {
            tuitionMap[t.id] = t;
          });

          const studentsList = membersData.map((m) => ({
            user_id: m.user_id,
            tuition_id: m.tuition_id,
            full_name: profileMap[m.user_id] || 'Unknown',
            tuition_name: tuitionMap[m.tuition_id]?.name || 'Unknown',
            subject: tuitionMap[m.tuition_id]?.subject || '',
            grade: tuitionMap[m.tuition_id]?.grade || '',
          }));

          setAllStudents(studentsList);
          // Initialize filtered students with all students
          setFilteredStudents(studentsList);

          // Step 3: Fetch all student fees (will be empty if none set, that's ok)
          const { data: feesData, error: feesError } = await supabase
            .from('student_fees')
            .select('student_id, tuition_id, fee_amount, due_day')
            .in('tuition_id', allTuitionIds);

          if (feesError) {
            throw feesError;
          }


          const feesMap = {};
          feesData?.forEach((f) => {
            const key = `${f.tuition_id}-${f.student_id}`;
            feesMap[key] = f;
          });
          setStudentFees(feesMap);

          // Step 4: Fetch all payment records for current month (will be empty if none, that's ok)
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('fees_payments')
            .select('*')
            .in('tuition_id', allTuitionIds)
            .eq('month', currentMonth)
            .eq('year', currentYear);

          if (paymentsError) {
            throw paymentsError;
          }


          const paymentMap = {};
          paymentsData?.forEach((p) => {
            const key = `${p.tuition_id}-${p.student_id}`;
            paymentMap[key] = p;
          });
          setPayments(paymentMap);
        } else {
          setAllStudents([]);
        }
      } else {
      }

      // Fetch teacher payment details
      const { data: teacherPaymentData, error: teacherPaymentError } = await supabase
        .from('teacher_payment_details')
        .select('*')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (teacherPaymentError && teacherPaymentError.code !== 'PGRST116') {
        throw teacherPaymentError;
      }

      setTeacherPaymentDetails(teacherPaymentData);
      if (teacherPaymentData) {
        setUpiId(teacherPaymentData.upi_id || '');
        setQrCodeUrl(teacherPaymentData.qr_code_url || '');
      }
    } catch (err) {
      handleError(err, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allStudents];

    // Filter by tuition
    if (tuitionFilter !== 'all') {
      filtered = filtered.filter((s) => s.tuition_id === tuitionFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => {
        const key = `${s.tuition_id}-${s.user_id}`;
        const payment = payments[key];
        const status = payment?.status || 'unpaid';
        return status === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name.toLowerCase().includes(query) ||
          s.tuition_name.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleEditFee = (student) => {
    setEditingStudent(student);
    const key = `${student.tuition_id}-${student.user_id}`;
    const fee = studentFees[key];
    setFeeAmount(fee?.fee_amount?.toString() || '');
    setDueDay(fee?.due_day?.toString() || '1');
  };

  const handleSaveFee = async () => {
    if (!editingStudent) return;

    try {
      const { error } = await supabase.from('student_fees').upsert(
        {
          tuition_id: editingStudent.tuition_id,
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
      fetchTeacherData();
    } catch (err) {
      handleError(err, 'Failed to save fee settings');
    }
  };

  const handleMarkPaid = async (student) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: student.tuition_id,
          student_id: student.user_id,
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
      fetchTeacherData();
    } catch (err) {
      handleError(err, 'Failed to mark payment');
    }
  };

  const handleApprovePayment = async (student) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: student.tuition_id,
          student_id: student.user_id,
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
      fetchTeacherData();
    } catch (err) {
      handleError(err, 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (student) => {
    try {
      const { error } = await supabase.from('fees_payments').upsert(
        {
          tuition_id: student.tuition_id,
          student_id: student.user_id,
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
      fetchTeacherData();
    } catch (err) {
      handleError(err, 'Failed to reject payment');
    }
  };

  const handleSaveTeacherPaymentDetails = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingPaymentDetails(true);
    try {
      let finalUrl = qrCodeUrl;

      if (qrCodeFile) {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment_qrs')
          .upload(filePath, qrCodeFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('payment_qrs')
          .getPublicUrl(filePath);

        finalUrl = publicUrlData.publicUrl;
        setQrCodeUrl(finalUrl);
      }

      const { error } = await supabase.from('teacher_payment_details').upsert(
        {
          teacher_id: user.id,
          upi_id: upiId || null,
          qr_code_url: finalUrl || null,
        },
        {
          onConflict: 'teacher_id',
        }
      );

      if (error) throw error;

      toast.success('Payment details saved');
      setQrCodeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchTeacherData();
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



  // Teacher Dashboard View
  return (
    <DashboardLayout role={role}>
      <div className="space-y-8">
        
        <PaymentsHeroTile monthName={monthName} currentYear={currentYear} />

        <PaymentsHighLevelStats loading={loading} allStudents={allStudents} payments={payments} />

        <div className="grid xl:grid-cols-3 gap-6 md:gap-8">
          <PaymentsList
            loading={loading}
            filteredStudents={filteredStudents}
            tuitions={tuitions}
            studentFees={studentFees}
            payments={payments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tuitionFilter={tuitionFilter}
            setTuitionFilter={setTuitionFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            handleApprovePayment={handleApprovePayment}
            handleRejectPayment={handleRejectPayment}
            handleMarkPaid={handleMarkPaid}
            handleEditFee={handleEditFee}
          />

          <div className="xl:col-span-1 lg:order-2 order-1 space-y-6">
            <PaymentsTeacherConfig
              upiId={upiId}
              setUpiId={setUpiId}
              qrCodeUrl={qrCodeUrl}
              qrCodeFile={qrCodeFile}
              setQrCodeFile={setQrCodeFile}
              isEditingPaymentDetails={isEditingPaymentDetails}
              setIsEditingPaymentDetails={setIsEditingPaymentDetails}
              savingPaymentDetails={savingPaymentDetails}
              handleSaveTeacherPaymentDetails={handleSaveTeacherPaymentDetails}
              handleDeleteQrCode={handleDeleteQrCode}
              fileInputRef={fileInputRef}
              fetchTeacherData={fetchTeacherData}
            />
          </div>
        </div>

        <EditFeeModal
          editingStudent={editingStudent}
          setEditingStudent={setEditingStudent}
          feeAmount={feeAmount}
          setFeeAmount={setFeeAmount}
          dueDay={dueDay}
          setDueDay={setDueDay}
          handleSaveFee={handleSaveFee}
        />
      </div>
    </DashboardLayout>
  );
}

export default TeacherPaymentsView;
