import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utilities/errorHandler';

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
      console.log('[DEBUG] Current user ID:', user?.id);
      if (!user) return;

      // Step 1: Get all tuitions where user is a teacher (via created_by OR via tuition_members)
      console.log('[DEBUG] Fetching tuitions for user:', user.id);

      // Get tuitions created by user
      const { data: createdTuitions, error: createdError } = await supabase
        .from('tuition_spaces')
        .select('id, name, subject, grade')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdError) {
        console.log('[DEBUG] Error fetching created tuitions:', createdError);
        throw createdError;
      }
      console.log('[DEBUG] Tuitions created by user:', createdTuitions?.length || 0, createdTuitions);

      // Get tuitions where user is a member with teacher role
      const { data: memberTuitions, error: memberError } = await supabase
        .from('tuition_members')
        .select('tuition_id')
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'teacher');

      if (memberError) {
        console.log('[DEBUG] Error fetching member tuitions:', memberError);
        throw memberError;
      }
      console.log('[DEBUG] Tuitions where user is teacher member:', memberTuitions?.length || 0, memberTuitions);

      // Combine all tuition IDs
      const tuitionIdsFromCreated = createdTuitions?.map((t) => t.id) || [];
      const tuitionIdsFromMember = memberTuitions?.map((m) => m.tuition_id) || [];
      const allTuitionIds = [...new Set([...tuitionIdsFromCreated, ...tuitionIdsFromMember])];

      console.log('[DEBUG] All tuition IDs:', allTuitionIds);

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

      console.log('[DEBUG] Combined tuitions:', allTuitionsData?.length || 0, allTuitionsData);
      setTuitions(allTuitionsData);

      // Step 2: Fetch all students across all tuitions
      if (allTuitionIds.length > 0) {
        console.log('[DEBUG] Fetching students for tuition IDs:', allTuitionIds);

        const { data: membersData, error: membersError } = await supabase
          .from('tuition_members')
          .select('user_id, tuition_id, created_at')
          .in('tuition_id', allTuitionIds)
          .eq('role_in_tuition', 'student');

        if (membersError) {
          console.log('[DEBUG] Error fetching members:', membersError);
          throw membersError;
        }

        console.log('[DEBUG] tuition_members query result:', membersData?.length || 0, membersData);

        if (membersData && membersData.length > 0) {
          const userIds = [...new Set(membersData.map((m) => m.user_id))];
          console.log('[DEBUG] Unique student user IDs:', userIds);

          // Get profiles for all students
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (profilesError) {
            console.log('[DEBUG] Error fetching profiles:', profilesError);
            throw profilesError;
          }

          console.log('[DEBUG] Profiles fetched:', profilesData?.length || 0, profilesData);

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

          console.log('[DEBUG] Final students list:', studentsList?.length || 0, studentsList);
          setAllStudents(studentsList);
          // Initialize filtered students with all students
          setFilteredStudents(studentsList);

          // Step 3: Fetch all student fees (will be empty if none set, that's ok)
          console.log('[DEBUG] Fetching student_fees for tuition IDs:', allTuitionIds);
          const { data: feesData, error: feesError } = await supabase
            .from('student_fees')
            .select('student_id, tuition_id, fee_amount, due_day')
            .in('tuition_id', allTuitionIds);

          if (feesError) {
            console.log('[DEBUG] Error fetching fees:', feesError);
            throw feesError;
          }

          console.log('[DEBUG] student_fees result:', feesData?.length || 0, feesData);

          const feesMap = {};
          feesData?.forEach((f) => {
            const key = `${f.tuition_id}-${f.student_id}`;
            feesMap[key] = f;
          });
          setStudentFees(feesMap);

          // Step 4: Fetch all payment records for current month (will be empty if none, that's ok)
          console.log('[DEBUG] Fetching fees_payments for month:', currentMonth, 'year:', currentYear);
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('fees_payments')
            .select('*')
            .in('tuition_id', allTuitionIds)
            .eq('month', currentMonth)
            .eq('year', currentYear);

          if (paymentsError) {
            console.log('[DEBUG] Error fetching payments:', paymentsError);
            throw paymentsError;
          }

          console.log('[DEBUG] fees_payments result:', paymentsData?.length || 0, paymentsData);

          const paymentMap = {};
          paymentsData?.forEach((p) => {
            const key = `${p.tuition_id}-${p.student_id}`;
            paymentMap[key] = p;
          });
          setPayments(paymentMap);
        } else {
          console.log('[DEBUG] No students found in tuition_members');
          setAllStudents([]);
        }
      } else {
        console.log('[DEBUG] No tuition IDs found, skipping student fetch');
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
      console.log('[DEBUG] Error in fetchTeacherData:', err);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Fee Management</h1>
          <p className="text-slate-600">
            Manage fees and track payments across all your tuitions - {monthName} {currentYear}
          </p>
        </div>

        {/* Teacher Payment Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Your Payment Details</h3>
            </div>
            {!isEditingPaymentDetails && (
              <button 
                onClick={() => setIsEditingPaymentDetails(true)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-2 border border-slate-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                Edit Details
              </button>
            )}
          </div>
          
          <p className="text-sm text-slate-500 mb-6">
            Students will see these details across all your tuitions to make payments.
          </p>
          
          {!isEditingPaymentDetails ? (
            <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              {/* View Mode: UPI ID */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">UPI ID</p>
                {upiId ? (
                  <p className="font-bold text-slate-900 text-lg">{upiId}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">Not set</p>
                )}
              </div>
              
              {/* View Mode: QR Code Preview */}
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My QR Code</p>
                 {qrCodeUrl ? (
                   <div className="border border-slate-200 rounded-lg p-2 bg-white inline-block shadow-sm">
                     <img src={qrCodeUrl} alt="My QR Code" className="w-32 h-32 object-contain rounded" />
                   </div>
                 ) : (
                   <p className="text-sm text-slate-500 italic">No QR code uploaded</p>
                 )}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-blue-100 ring-4 ring-blue-50/50">
              {/* Edit Mode: Form */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g., yourname@upi"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">QR Code Image</label>
                
                {qrCodeUrl && !qrCodeFile && (
                  <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2">Currently Active QR:</p>
                    <div className="flex items-center gap-4">
                      <div className="border border-slate-200 rounded-lg p-1 bg-white shadow-sm">
                        <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 object-contain rounded" />
                      </div>
                      <button 
                        onClick={handleDeleteQrCode}
                        className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium border border-transparent hover:border-red-100 transition-colors"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setQrCodeFile(file);
                    }}
                    ref={fileInputRef}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-slate-100 pt-5">
                <button
                  onClick={() => {
                    setIsEditingPaymentDetails(false);
                    setQrCodeFile(null);
                    fetchTeacherData(); // Reset form to state in DB
                  }}
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                     await handleSaveTeacherPaymentDetails();
                     setIsEditingPaymentDetails(false);
                  }}
                  disabled={savingPaymentDetails}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingPaymentDetails ? 'Saving...' : 'Save & Lock Details'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="flex-1 w-full md:max-w-md relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Search Student</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or tuition..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm font-medium placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="min-w-[180px] flex-1 sm:flex-none">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter by Tuition</label>
              <select
                value={tuitionFilter}
                onChange={(e) => setTuitionFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm appearance-none font-semibold text-slate-700"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
              >
                <option value="all">All Tuitions</option>
                {tuitions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="min-w-[160px] flex-1 sm:flex-none">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm appearance-none font-semibold text-slate-700"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">
                  All Students ({filteredStudents.length})
                </h3>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {allStudents.length === 0
                ? 'No students enrolled in any tuition'
                : 'No students match the selected filters'}
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
                  <div key={key} className="p-5 hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* 1. Profile Section */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-blue-700 shadow-sm shrink-0 border border-white">
                          {student.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-base truncate">{student.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500">
                             <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                             <span className="truncate">
                               {student.tuition_name}
                               {student.subject && ` • ${student.subject}`}
                               {student.grade && ` • ${student.grade}`}
                             </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Middle Stats */}
                      <div className="flex items-center gap-6 md:gap-12 justify-between lg:justify-end border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fee Amount</span>
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-900 text-lg">₹{feeAmount}</span>
                           </div>
                        </div>

                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</span>
                           <span className="font-semibold text-slate-700 text-sm mt-0.5">
                             {dueDay}{dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'} of month
                           </span>
                        </div>
                        
                        {/* Desktop Status Badge */}
                        <div className="hidden lg:flex flex-col items-end min-w-[120px]">
                            {getStatusBadge(status)}
                            {payment?.paid_on && status === 'paid' && (
                              <span className="text-[11px] text-slate-400 mt-1.5 font-medium">
                                {formatDate(payment.paid_on)}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* 3. Mobile Status & Actions */}
                      <div className="flex flex-col lg:items-end gap-3 lg:min-w-[180px]">
                        {/* Mobile Status Badge */}
                        <div className="flex lg:hidden items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                          <div className="flex flex-col items-end">
                            {getStatusBadge(status)}
                            {payment?.paid_on && status === 'paid' && (
                              <span className="text-[11px] text-slate-400 mt-1 font-medium">
                                {formatDate(payment.paid_on)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRejectPayment(student)}
                                className="flex-1 lg:flex-none px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprovePayment(student)}
                                className="flex-1 lg:flex-none px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                            </>
                          )}

                          {status === 'unpaid' && (
                            <button
                              onClick={() => handleMarkPaid(student)}
                              className="flex-1 lg:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              Mark as Paid
                            </button>
                          )}

                          <button
                            onClick={() => handleEditFee(student)}
                            className="flex-1 lg:flex-none p-2 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                            title="Edit Fee Settings"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                             <span className="lg:hidden text-xs font-bold">Edit Fee</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && allStudents.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{allStudents.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Pending Approvals</p>
              <p className="text-2xl font-bold text-amber-600">
                {allStudents.filter((s) => {
                  const key = `${s.tuition_id}-${s.user_id}`;
                  return payments[key]?.status === 'pending';
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Paid This Month</p>
              <p className="text-2xl font-bold text-emerald-600">
                {allStudents.filter((s) => {
                  const key = `${s.tuition_id}-${s.user_id}`;
                  return payments[key]?.status === 'paid';
                }).length}
              </p>
            </div>
          </div>
        )}

        {/* Edit Fee Modal */}
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Edit Fee for {editingStudent.full_name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{editingStudent.tuition_name}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Day of Month
                  </label>
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
    </DashboardLayout>
  );
}

export default TeacherPaymentsView;
