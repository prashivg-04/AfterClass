import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Rolling365Heatmap from '../components/Rolling365Heatmap';
import { supabase } from '../lib/supabase';
import { handleError } from '../utilities/errorHandler';

import StudentHero from '../components/dashboard/student/StudentHero';
import StudentKPIs from '../components/dashboard/student/StudentKPIs';
import EnrolledTuitionsList from '../components/dashboard/student/EnrolledTuitionsList';
import StudentProgressBanner from '../components/dashboard/student/StudentProgressBanner';
import DashboardActivity from '../components/dashboard/student/DashboardActivity';
import JoinTuitionModal from '../components/dashboard/student/JoinTuitionModal';

function StudentDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [joinedTuitions, setJoinedTuitions] = useState([]);
  const [globalAttendance, setGlobalAttendance] = useState({});
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    attendancePercentage: 0,
    classesAttended: 0,
    quizzesAttempted: 0,
  });

  const [analytics, setAnalytics] = useState({
    upcomingQuizzes: [],
    recentQuizResults: [],
    pendingFees: 0,
    totalFeesDue: 0,
    averageQuizScore: 0,
    recentActivity: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDataForUser(user.id);
    }
  }, [user?.id]);

  const fetchDataForUser = async (currentUserId) => {
    try {
      // Step 1: Get tuition_members for the student
      const { data, error } = await supabase
        .from('tuition_members')
        .select(`
          tuition_id,
          role_in_tuition,
          tuition_spaces (id, name, subject, grade, batch, created_at, created_by)
        `)
        .eq('user_id', currentUserId)
        .eq('role_in_tuition', 'student');

      if (error) {
        console.error('Error fetching tuition_members:', error);
      }

      if (!data || data.length === 0) {
        setJoinedTuitions([]);
        setKpiLoading(false);
        setAnalyticsLoading(false);
        return;
      }

      let tuitions = data.map(m => m.tuition_spaces).filter(Boolean);
      
      // Set tuitions immediately so the UI renders, then enrich with teacher names
      setJoinedTuitions(tuitions);

      // Step 2: Enrich with teacher names from profiles table
      const teacherIds = [...new Set(tuitions.map(t => t.created_by).filter(Boolean))];
      if (teacherIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        if (profileData && profileData.length > 0) {
          const teacherMap = {};
          profileData.forEach(p => { teacherMap[p.id] = p; });

          const enrichedTuitions = tuitions.map(t => ({
            ...t,
            teacher: teacherMap[t.created_by] || null,
          }));
          setJoinedTuitions(enrichedTuitions);
          tuitions = enrichedTuitions;
        }
      }

      // Step 3: Get attendance data for heatmap
      let dayCount = {};
      if (tuitions.length > 0) {
        const tuitionIds = tuitions.map(t => t.id);

        const { data: classesData } = await supabase
          .from('classes')
          .select('id, tuition_id, created_at')
          .in('tuition_id', tuitionIds);

        if (classesData && classesData.length > 0) {
          const classIds = classesData.map(c => c.id);

          const { data: attendanceData } = await supabase
            .from('class_attendance')
            .select('class_id, status')
            .eq('student_id', currentUserId)
            .eq('status', 'present')
            .in('class_id', classIds);

          const classDateMap = {};
          classesData.forEach(c => {
            classDateMap[c.id] = c.created_at;
          });

          if (attendanceData) {
            attendanceData.forEach(a => {
              const date = new Date(classDateMap[a.class_id]).toISOString().split('T')[0];
              dayCount[date] = (dayCount[date] || 0) + 1;
            });
          }
        }
      }

      setGlobalAttendance(dayCount);
      await fetchKpiData(currentUserId, tuitions);
      await fetchAnalytics(currentUserId, tuitions);
    } catch (err) {
      console.error('fetchDataForUser error:', err);
      setKpiLoading(false);
      setAnalyticsLoading(false);
    }
  };

  const fetchKpiData = async (studentId, tuitions) => {
    setKpiLoading(true);

    try {
      const tuitionIds = tuitions.map(t => t.id);

      if (tuitionIds.length === 0) {
        setKpiData({ attendancePercentage: 0, classesAttended: 0, quizzesAttempted: 0 });
        setKpiLoading(false);
        return;
      }

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, tuition_id')
        .in('tuition_id', tuitionIds);

      if (classesError) throw classesError;

      const classIds = classesData?.map(c => c.id) || [];

      let classesAttended = 0;
      let totalClassesWithAttendance = 0;

      if (classIds.length > 0) {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('class_attendance')
          .select('class_id, status')
          .eq('student_id', studentId)
          .in('class_id', classIds);

        if (attendanceError) throw attendanceError;

        if (attendanceData) {
          classesAttended = attendanceData.filter(a => a.status === 'present').length;
          totalClassesWithAttendance = attendanceData.length;
        }
      }

      const attendancePercentage = totalClassesWithAttendance > 0
        ? Math.round((classesAttended / totalClassesWithAttendance) * 100)
        : 0;

      const { data: quizAttemptsData, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('student_id', studentId);

      if (quizError) throw quizError;

      const quizzesAttempted = quizAttemptsData?.length || 0;

      setKpiData({ attendancePercentage, classesAttended, quizzesAttempted });
    } catch (error) {
      console.error('KPI data fetch error:', error);
      handleError(error, 'Failed to load dashboard statistics');
      setKpiData({ attendancePercentage: '--', classesAttended: '--', quizzesAttempted: '--' });
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

      const { data: upcomingQuizzes, error: upcomingError } = await supabase
        .from('quizzes')
        .select('id, title, description, created_at, tuition_spaces(name, id)')
        .in('tuition_id', tuitionIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (upcomingError) throw upcomingError;

      const { data: attemptedQuizIds } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('student_id', studentId);

      const attemptedIds = attemptedQuizIds?.map(a => a.quiz_id) || [];
      const filteredUpcoming = upcomingQuizzes?.filter(q => !attemptedIds.includes(q.id)) || [];

      const { data: recentAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, score, total_questions, created_at, quizzes!inner(title, tuition_id)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (attemptsError) throw attemptsError;

      let averageQuizScore = 0;
      if (recentAttempts && recentAttempts.length > 0) {
        const totalPercentage = recentAttempts.reduce((sum, attempt) => {
          return sum + (attempt.score / attempt.total_questions * 100);
        }, 0);
        averageQuizScore = Math.round(totalPercentage / recentAttempts.length);
      }

      const { data: feesData, error: feesError } = await supabase
        .from('fees_payments')
        .select('status, month, year')
        .eq('student_id', studentId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (feesError) throw feesError;

      const pendingFees = feesData?.filter(f => f.status === 'unpaid').length || 0;

      const { data: feeSettings } = await supabase
        .from('student_fees')
        .select('fee_amount')
        .eq('student_id', studentId)
        .in('tuition_id', tuitionIds);

      const totalFeesDue = feeSettings?.reduce((sum, f) => sum + (parseFloat(f.fee_amount) || 0), 0) || 0;

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

      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      return activities.slice(0, 6);
    } catch (err) {
      console.error('Error fetching student activity:', err);
      return [];
    }
  };

  const handleJoinSuccess = () => {
    if (user?.id) {
      fetchDataForUser(user.id);
    }
  };

  return (
    <DashboardLayout role="Student">
      <div className="space-y-6 lg:space-y-8">
        
        <StudentHero onOpenJoinModal={() => setShowJoinModal(true)} />

        <StudentKPIs 
          kpiData={kpiData} 
          kpiLoading={kpiLoading} 
          analyticsLoading={analyticsLoading} 
          averageQuizScore={analytics.averageQuizScore} 
        />

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

        <EnrolledTuitionsList 
          joinedTuitions={joinedTuitions} 
          onOpenJoinModal={() => setShowJoinModal(true)} 
        />

        <StudentProgressBanner 
          kpiData={kpiData} 
          analyticsLoading={analyticsLoading} 
          pendingFees={analytics.pendingFees} 
          joinedTuitionsLength={joinedTuitions.length} 
        />

        <DashboardActivity 
          analytics={analytics} 
          analyticsLoading={analyticsLoading} 
        />

      </div>

      <JoinTuitionModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
        onSuccess={handleJoinSuccess} 
      />
    </DashboardLayout>
  );
}

export default StudentDashboard;
