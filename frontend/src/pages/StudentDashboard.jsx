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
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Your Tuitions</h3>
              <p className="text-slate-500 mt-1">Join and access your enrolled tuition batches</p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Join Tuition
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Attendance Overview</h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <Rolling365Heatmap intensityMap={globalAttendance} mode="count" />
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                <span>1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                <span>2</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-800"></div>
                <span>3+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Enrolled Tuitions</h3>
          </div>
          <div className="p-6">
            {joinedTuitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
                  <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Not enrolled yet</h4>
                <p className="text-slate-500 max-w-sm mb-6">
                  You haven't joined any tuitions. Ask your teacher for a join code to get started.
                </p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  Join Tuition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joinedTuitions.map((tuition) => (
                  <div
                    key={tuition.id}
                    onClick={() => navigate(`/dashboard/student/tuition/${tuition.id}`)}
                    className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{tuition.name}</h4>
                      <div className="px-2.5 py-1 bg-indigo-50/50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100 shrink-0">
                        Student
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {tuition.subject && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/50">
                          {tuition.subject}
                        </span>
                      )}
                      {tuition.grade && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100/50">
                          {tuition.grade}
                        </span>
                      )}
                      {tuition.batch && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                          {tuition.batch}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Teacher: <span className="text-slate-700">{tuition.teacher?.full_name || 'Unknown'}</span></span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Row 1 */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 border border-indigo-400 shadow-lg relative overflow-hidden text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-indigo-100">Average Score</p>
              </div>
              <p className="text-4xl font-bold">
                {analyticsLoading ? '-' : `${analytics.averageQuizScore}%`}
              </p>
              <p className="text-sm text-indigo-100 mt-2">Across all quizzes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Pending Fees</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analyticsLoading ? (
                    <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    analytics.pendingFees
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
              This month
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors md:col-span-2">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm font-medium text-slate-500">Progress Overview</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
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
              <button
                onClick={() => navigate('/dashboard/student/payments')}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium transition-colors"
              >
                View Fees
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Quizzes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">Pending Quizzes</h3>
              </div>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                {analytics.upcomingQuizzes?.length || 0} Open
              </span>
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {analyticsLoading ? (
                <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : analytics.upcomingQuizzes?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 h-full flex flex-col justify-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm mt-1">No pending quizzes at the moment.</p>
                </div>
              ) : (
                analytics.upcomingQuizzes.map((quiz, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{quiz.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">in {quiz.tuition_spaces?.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/dashboard/student/tuition/${quiz.tuition_spaces?.id}?tab=quizzes`)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shrink-0 shadow-sm"
                    >
                      Start
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              </div>
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {analyticsLoading ? (
                <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : analytics.recentActivity?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 h-full flex flex-col justify-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No recent activity</p>
                  <p className="text-sm mt-1">Activity from the last 7 days will appear here</p>
                </div>
              ) : (
                analytics.recentActivity?.map((activity, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${
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
                        <p className="font-semibold text-slate-900 text-sm truncate">{activity.title}</p>
                        <p className={`text-xs font-medium mt-0.5 truncate ${
                          activity.color === 'blue' ? 'text-blue-600' :
                          activity.color === 'emerald' ? 'text-emerald-600' :
                          activity.color === 'amber' ? 'text-amber-600' :
                          'text-slate-500'
                        }`}>{activity.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
                       {formatTimeAgo(activity.time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Tuition Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Join a Tuition</h2>
              <button
                type="button"
                onClick={() => { setShowJoinModal(false); reset(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(handleJoinTuition)} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                    placeholder="Enter the code provided by your teacher"
                    maxLength={6}
                    className={`w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 uppercase placeholder:normal-case font-mono tracking-wider font-semibold ${errors.joinCode
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400'
                      }`}
                    aria-invalid={errors.joinCode ? "true" : "false"}
                  />
                  {errors.joinCode && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.joinCode.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A 6 character code like 'MATH10' or 'A1B2C3'.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowJoinModal(false); reset(); }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
