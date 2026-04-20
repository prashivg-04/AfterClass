import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Rolling365Heatmap from '../components/Rolling365Heatmap';
import { supabase } from '../lib/supabase';
import { joinSchema } from '../schemas/join.schema';
import { handleError } from '../utilities/errorHandler';

function StudentDashboard() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userId, setUserId] = useState(null);
  const [joinedTuitions, setJoinedTuitions] = useState([]);
  const [globalAttendance, setGlobalAttendance] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    attendancePercentage: 0,
    classesAttended: 0,
    quizzesAttempted: 0,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    upcomingQuizzes: [],
    recentQuizResults: [],
    pendingFees: 0,
    totalFeesDue: 0,
    averageQuizScore: 0,
    recentActivity: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      joinCode: '',
    },
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch joined tuitions
      const { data } = await supabase
        .from('tuition_members')
        .select(`
          tuition_id,
          role_in_tuition,
          tuition_spaces (id, name, subject, grade, batch, created_at)
        `)
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'student');

      if (data) {
        const tuitions = data.map(m => m.tuition_spaces).filter(Boolean);
        setJoinedTuitions(tuitions);

        // Get attendance data if student has joined tuitions
        let dayCount = {};
        if (tuitions.length > 0) {
          const tuitionIds = tuitions.map(t => t.id);

          // Get all classes from joined tuitions
          const { data: classesData } = await supabase
            .from('classes')
            .select('id, tuition_id, created_at')
            .in('tuition_id', tuitionIds);

          if (classesData && classesData.length > 0) {
            const classIds = classesData.map(c => c.id);

            // Get attendance records for current user
            const { data: attendanceData } = await supabase
              .from('class_attendance')
              .select('class_id, status')
              .eq('student_id', user.id)
              .eq('status', 'present')
              .in('class_id', classIds);

            // Map class_id to date
            const classDateMap = {};
            classesData.forEach(c => {
              classDateMap[c.id] = c.created_at;
            });

            // Count present per day
            if (attendanceData) {
              attendanceData.forEach(a => {
                const date = new Date(classDateMap[a.class_id]).toISOString().split('T')[0];
                dayCount[date] = (dayCount[date] || 0) + 1;
              });
            }
          }
        }

        // Set intensity map for rolling 365-day heatmap
        setGlobalAttendance(dayCount);

        // Fetch KPI data for the student
        await fetchKpiData(user.id, tuitions);

        // Fetch analytics data
        await fetchAnalytics(user.id, tuitions);
      }
    };

    init();
  }, []);

  // Fetch KPI data: Attendance %, Classes Attended, Quizzes Attempted
  const fetchKpiData = async (studentId, tuitions) => {
    setKpiLoading(true);

    try {
      const tuitionIds = tuitions.map(t => t.id);

      // Default values if no tuitions
      if (tuitionIds.length === 0) {
        setKpiData({
          attendancePercentage: 0,
          classesAttended: 0,
          quizzesAttempted: 0,
        });
        setKpiLoading(false);
        return;
      }

      // Fetch all classes from joined tuitions
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, tuition_id')
        .in('tuition_id', tuitionIds);

      if (classesError) throw classesError;

      const classIds = classesData?.map(c => c.id) || [];

      // Fetch attendance records for the student
      let classesAttended = 0;
      let totalClassesWithAttendance = 0;

      if (classIds.length > 0) {
        // Get all attendance records for this student in these classes
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('class_attendance')
          .select('class_id, status')
          .eq('student_id', studentId)
          .in('class_id', classIds);

        if (attendanceError) throw attendanceError;

        // Count present and total records
        if (attendanceData) {
          classesAttended = attendanceData.filter(a => a.status === 'present').length;
          totalClassesWithAttendance = attendanceData.length;
        }
      }

      // Calculate attendance percentage
      const attendancePercentage = totalClassesWithAttendance > 0
        ? Math.round((classesAttended / totalClassesWithAttendance) * 100)
        : 0;

      // Fetch quizzes attempted by the student
      const { data: quizAttemptsData, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('student_id', studentId);

      if (quizError) throw quizError;

      const quizzesAttempted = quizAttemptsData?.length || 0;

      setKpiData({
        attendancePercentage,
        classesAttended,
        quizzesAttempted,
      });
    } catch (error) {
      console.error('KPI data fetch error:', error);
      handleError(error, 'Failed to load dashboard statistics');
      // Set fallback values
      setKpiData({
        attendancePercentage: '--',
        classesAttended: '--',
        quizzesAttempted: '--',
      });
    } finally {
      setKpiLoading(false);
    }
  };

  const fetchAnalytics = async (studentId, tuitions) => {
    setAnalyticsLoading(true);
    try {
      if (tuitions.length === 0) {
        setAnalyticsLoading(false);
        return;
      }

      const tuitionIds = tuitions.map(t => t.id);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // 1. Fetch upcoming quizzes (not attempted yet)
      const { data: upcomingQuizzes, error: upcomingError } = await supabase
        .from('quizzes')
        .select('id, title, description, created_at, tuition_spaces(name)')
        .in('tuition_id', tuitionIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (upcomingError) throw upcomingError;

      // Filter out quizzes already attempted
      const { data: attemptedQuizIds } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('student_id', studentId);

      const attemptedIds = attemptedQuizIds?.map(a => a.quiz_id) || [];
      const filteredUpcoming = upcomingQuizzes?.filter(q => !attemptedIds.includes(q.id)) || [];

      // 2. Fetch recent quiz results
      const { data: recentAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, score, total_questions, created_at, quizzes!inner(title, tuition_id)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (attemptsError) throw attemptsError;

      // Calculate average score
      let averageQuizScore = 0;
      if (recentAttempts && recentAttempts.length > 0) {
        const totalPercentage = recentAttempts.reduce((sum, attempt) => {
          return sum + (attempt.score / attempt.total_questions * 100);
        }, 0);
        averageQuizScore = Math.round(totalPercentage / recentAttempts.length);
      }

      // 3. Fetch fee status
      const { data: feesData, error: feesError } = await supabase
        .from('fees_payments')
        .select('status, month, year')
        .eq('student_id', studentId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (feesError) throw feesError;

      const pendingFees = feesData?.filter(f => f.status === 'unpaid').length || 0;

      // Get total fee amount due
      const { data: feeSettings } = await supabase
        .from('student_fees')
        .select('fee_amount')
        .eq('student_id', studentId)
        .in('tuition_id', tuitionIds);

      const totalFeesDue = feeSettings?.reduce((sum, f) => sum + (parseFloat(f.fee_amount) || 0), 0) || 0;

      // 4. Fetch recent activity
      const recentActivity = await fetchStudentActivity(studentId, tuitionIds);

      setAnalytics({
        upcomingQuizzes: filteredUpcoming,
        recentQuizResults: recentAttempts || [],
        pendingFees,
        totalFeesDue,
        averageQuizScore,
        recentActivity,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchStudentActivity = async (studentId, tuitionIds) => {
    const activities = [];

    try {
      // Get recent quiz attempts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('id, score, total_questions, created_at, quizzes!inner(title)')
        .eq('student_id', studentId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      quizAttempts?.forEach(attempt => {
        activities.push({
          type: 'quiz',
          title: `Completed "${attempt.quizzes?.title || 'Quiz'}"`,
          subtitle: `Score: ${attempt.score}/${attempt.total_questions} (${Math.round(attempt.score / attempt.total_questions * 100)}%)`,
          time: attempt.created_at,
          icon: 'quiz',
          color: 'blue',
        });
      });

      // Get recent attendance
      const { data: recentAttendance } = await supabase
        .from('class_attendance')
        .select('status, created_at, classes!inner(name)')
        .eq('student_id', studentId)
        .eq('status', 'present')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      recentAttendance?.forEach(attendance => {
        activities.push({
          type: 'attendance',
          title: `Marked present in "${attendance.classes?.name || 'Class'}"`,
          subtitle: 'Attendance recorded',
          time: attendance.created_at,
          icon: 'check',
          color: 'emerald',
        });
      });

      // Get recent fee payments
      const { data: recentPayments } = await supabase
        .from('fees_payments')
        .select('status, paid_on, month, year')
        .eq('student_id', studentId)
        .eq('status', 'paid')
        .order('paid_on', { ascending: false })
        .limit(3);

      recentPayments?.forEach(payment => {
        activities.push({
          type: 'payment',
          title: `Fee payment confirmed`,
          subtitle: `For ${new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'long' })} ${payment.year}`,
          time: payment.paid_on,
          icon: 'money',
          color: 'amber',
        });
      });

      // Sort by time and take top 6
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      return activities.slice(0, 6);
    } catch (err) {
      console.error('Error fetching student activity:', err);
      return [];
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleJoinTuition = async (data) => {
    // Get authenticated user directly
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userId = user.id;

    setLoading(true);

    try {
      // Check if tuition exists by join_code
      const joinCodeValue = data.joinCode.trim().toUpperCase();

      const { data: tuition } = await supabase
        .from('tuition_spaces')
        .select('id, name, monthly_fee, due_day')
        .eq('join_code', joinCodeValue)
        .maybeSingle();

      if (!tuition) {
        toast.error('Invalid join code');
        return;
      }

      // Check if already a member
      const { data: existingMembers } = await supabase
        .from('tuition_members')
        .select('id')
        .eq('tuition_id', tuition.id)
        .eq('user_id', userId);

      if (existingMembers && existingMembers.length > 0) {
        toast.error('You are already a member of this tuition');
        return;
      }

      // Join the tuition
      const { error: joinError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'student',
        });

      if (joinError) {
        // Check for duplicate key error (already a member)
        if (joinError.code === '23505' || joinError.message?.includes('duplicate')) {
          toast.error('You are already a member of this tuition');
          return;
        }
        throw joinError;
      }

      // Create student_fees record with default tuition fee
      const { error: feeError } = await supabase
        .from('student_fees')
        .insert({
          tuition_id: tuition.id,
          student_id: userId,
          fee_amount: tuition.monthly_fee || 0,
          due_day: tuition.due_day || 1,
        });

      if (feeError) {
        console.error('Error creating student fee record:', feeError);
        // Don't throw here - the join succeeded, fee can be set later
      }

      // Refresh tuitions list
      const { data: tuitionsData } = await supabase
        .from('tuition_members')
        .select('tuition_spaces (id, name, created_at)')
        .eq('user_id', userId)
        .eq('role_in_tuition', 'student');

      if (tuitionsData) {
        setJoinedTuitions(tuitionsData.map(m => m.tuition_spaces).filter(Boolean));
      }

      toast.success('Joined tuition successfully');
      reset();
      setShowJoinModal(false);
    } catch (err) {
      console.error('Join tuition error:', err);
      toast.error('Failed to join tuition');
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  return (
    <DashboardLayout role="Student">
      <div className="space-y-6 lg:space-y-8">

        {/* ── Dark Hero Tile ── */}
        <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">Student Command Center</p>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Your Learning Hub.</h1>
              <p className="text-slate-400 text-base max-w-lg">Track your attendance, quizzes, and tuitions all in one place.</p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="shrink-0 flex items-center gap-2.5 px-6 py-3.5 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 border border-white/80"
            >
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Join Tuition
            </button>
          </div>
        </div>

        {/* ── KPI Stats Bento Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Attendance % */}
          <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Attendance</p>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : `${kpiData.attendancePercentage}%`}
            </p>
          </div>

          {/* Classes Attended */}
          <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Classes</p>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : kpiData.classesAttended}
            </p>
          </div>

          {/* Quizzes Attempted */}
          <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Quizzes</p>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {kpiLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : kpiData.quizzesAttempted}
            </p>
          </div>

          {/* Avg Quiz Score */}
          <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-2">Avg Score</p>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {analyticsLoading ? <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" /> : `${analytics.averageQuizScore}%`}
            </p>
          </div>
        </div>

        {/* ── Attendance Heatmap Bento Card ── */}
        <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Attendance Overview</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Rolling 365-day attendance heatmap</p>
            </div>
          </div>
          <div className="p-6 lg:p-8 overflow-x-auto">
            <Rolling365Heatmap intensityMap={globalAttendance} mode="count" />
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                <span className="font-semibold">2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-800"></div>
                <span className="font-semibold">3+</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Enrolled Tuitions Bento Card ── */}
        <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Enrolled Tuitions</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{joinedTuitions.length} active {joinedTuitions.length === 1 ? 'tuition' : 'tuitions'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Join
            </button>
          </div>
          <div className="p-6 lg:p-8">
            {joinedTuitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Not enrolled yet</h4>
                <p className="text-slate-500 max-w-sm mb-6 font-medium">
                  You haven't joined any tuitions. Ask your teacher for a join code to get started.
                </p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  Join Tuition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {joinedTuitions.map((tuition) => (
                  <div
                    key={tuition.id}
                    onClick={() => navigate(`/dashboard/student/tuition/${tuition.id}`)}
                    className="group bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[260px]"
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="flex justify-between items-start mb-auto relative z-10">
                      <div>
                        <h4 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight tracking-tight mb-2">{tuition.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          {tuition.subject && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.subject}</span>}
                          {tuition.grade && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.grade}</span>}
                          {tuition.batch && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.batch}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end relative z-10 w-full mt-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Teacher</p>
                        <p className="text-lg font-black text-slate-900 truncate max-w-[140px]">{tuition.teacher?.full_name || 'Unknown'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Progress Banner ── */}
        <div className="bg-white rounded-4xl p-6 lg:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Progress Overview</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {analyticsLoading ? 'Loading...' : (
                    joinedTuitions.length > 0 ? (
                      kpiData.attendancePercentage >= 80 ? (
                        <>Great job! 🎉 Your attendance is excellent</>
                      ) : kpiData.attendancePercentage >= 60 ? (
                        <>Good progress! Keep it up 👍</>
                      ) : (
                        <>Attendance needs attention 📚</>
                      )
                    ) : 'Join a tuition to start learning'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/student/payments')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              View Fees
            </button>
          </div>
          {/* Pending fees pill */}
          {!analyticsLoading && analytics.pendingFees > 0 && (
            <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl w-fit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {analytics.pendingFees} pending fee{analytics.pendingFees > 1 ? 's' : ''} this month
            </div>
          )}
        </div>

        {/* ── Analytics Bottom Row ── */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Pending Quizzes */}
          <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Pending Quizzes</h3>
              </div>
              <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-xl border border-orange-200/60">
                {analytics.upcomingQuizzes?.length || 0} Open
              </span>
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {analyticsLoading ? (
                <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : analytics.upcomingQuizzes?.length === 0 ? (
                <div className="p-10 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                  <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-black text-slate-700">All caught up!</p>
                  <p className="text-sm mt-1 font-medium">No pending quizzes at the moment.</p>
                </div>
              ) : (
                analytics.upcomingQuizzes.map((quiz, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate">{quiz.title}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">in {quiz.tuition_spaces?.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/dashboard/student/tuition/${quiz.tuition_spaces?.id}?tab=quizzes`)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shrink-0 shadow-sm"
                    >
                      Start
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {analyticsLoading ? (
                <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : analytics.recentActivity?.length === 0 ? (
                <div className="p-10 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                  <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-black text-slate-700">No recent activity</p>
                  <p className="text-sm mt-1 font-medium">Activity from the last 7 days will appear here</p>
                </div>
              ) : (
                analytics.recentActivity?.map((activity, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                        activity.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        activity.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                        'bg-slate-50 border-slate-100 text-slate-600'
                      }`}>
                        {activity.icon === 'quiz' && (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {activity.icon === 'check' && (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {activity.icon === 'money' && (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate">{activity.title}</p>
                        <p className={`text-xs font-semibold mt-0.5 truncate ${
                          activity.color === 'blue' ? 'text-blue-600' :
                          activity.color === 'emerald' ? 'text-emerald-600' :
                          activity.color === 'amber' ? 'text-amber-600' :
                          'text-slate-400'
                        }`}>{activity.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
                       {formatTimeAgo(activity.time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Join Tuition Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-4xl max-w-md w-full shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Join a Tuition</h2>
                  <p className="text-xs font-semibold text-slate-400">Enter the code from your teacher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowJoinModal(false); reset(); }}
                className="relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-8">
              <form onSubmit={handleSubmit(handleJoinTuition)} className="space-y-5" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                    Join Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('joinCode')}
                    value={watch('joinCode') || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 6);
                      setValue('joinCode', value, { shouldValidate: true });
                    }}
                    placeholder="e.g. MATH10"
                    maxLength={6}
                    className={`w-full px-5 py-4 bg-slate-50 border text-slate-900 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-200 uppercase placeholder:normal-case font-mono tracking-widest font-black text-xl text-center ${errors.joinCode
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-300'
                      }`}
                    aria-invalid={errors.joinCode ? "true" : "false"}
                  />
                  {errors.joinCode && (
                    <p className="mt-2 text-sm text-red-500 font-bold animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.joinCode.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-semibold mt-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A 6-character code like 'MATH10' or 'A1B2C3'
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowJoinModal(false); reset(); }}
                    className="px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-7 py-3 text-sm font-black text-white bg-indigo-600 shadow-sm rounded-2xl hover:bg-indigo-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      'Join Tuition'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
