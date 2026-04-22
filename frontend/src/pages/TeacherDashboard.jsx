import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';

import TeacherHeroTile from '../components/dashboard/teacher/TeacherHeroTile';
import HighLevelStats from '../components/dashboard/teacher/HighLevelStats';
import TuitionsList from '../components/dashboard/teacher/TuitionsList';
import RecentActivitySidebar from '../components/dashboard/teacher/RecentActivitySidebar';
import CreateTuitionModal from '../components/dashboard/teacher/CreateTuitionModal';
import DeleteTuitionModal from '../components/dashboard/teacher/DeleteTuitionModal';

function TeacherDashboard() {
  const [tuitions, setTuitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0,
    pendingFees: 0,
    totalQuizzes: 0,
    recentActivity: [],
    studentsByTuition: {},
  });

  // Delete tuition state
  const [deletingTuition, setDeletingTuition] = useState(null);

  // Fetch current user and their tuitions
  useEffect(() => {
    const getUserAndTuitions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('tuition_spaces')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      setTuitions(data || []);

      // Fetch analytics data
      await fetchAnalytics(user.id, data || []);
    };

    getUserAndTuitions();
  }, []);

  const fetchAnalytics = async (teacherId, tuitionsList) => {
    setAnalyticsLoading(true);
    try {
      if (tuitionsList.length === 0) {
        setAnalyticsLoading(false);
        return;
      }

      const tuitionIds = tuitionsList.map(t => t.id);

      // 1. Get total students across all tuitions
      const { data: membersData, error: membersError } = await supabase
        .from('tuition_members')
        .select('user_id, tuition_id')
        .in('tuition_id', tuitionIds)
        .eq('role_in_tuition', 'student');

      if (membersError) throw membersError;

      const totalStudents = membersData?.length || 0;

      // Count students per tuition
      const studentsByTuition = {};
      membersData?.forEach(m => {
        studentsByTuition[m.tuition_id] = (studentsByTuition[m.tuition_id] || 0) + 1;
      });

      // 2. Get total classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .in('tuition_id', tuitionIds);

      if (classesError) throw classesError;
      const totalClasses = classesData?.length || 0;

      // 3. Get attendance data for average calculation
      const classIds = classesData?.map(c => c.id) || [];
      let averageAttendance = 0;

      if (classIds.length > 0) {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('class_attendance')
          .select('status')
          .in('class_id', classIds);

        if (attendanceError) throw attendanceError;

        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter(a => a.status === 'present').length;
          averageAttendance = Math.round((presentCount / attendanceData.length) * 100);
        }
      }

      // 4. Get pending fees count for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: feesData, error: feesError } = await supabase
        .from('fees_payments')
        .select('id')
        .in('tuition_id', tuitionIds)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .eq('status', 'unpaid');

      if (feesError) throw feesError;
      const pendingFees = feesData?.length || 0;

      // 5. Get total quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id')
        .in('tuition_id', tuitionIds);

      if (quizzesError) throw quizzesError;
      const totalQuizzes = quizzesData?.length || 0;

      // 6. Get recent activity (quiz attempts, new students, new classes)
      const recentActivity = await fetchRecentActivity(tuitionIds, membersData);

      setAnalytics({
        totalStudents,
        totalClasses,
        averageAttendance,
        pendingFees,
        totalQuizzes,
        recentActivity,
        studentsByTuition,
      });
    } catch (err) {
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchRecentActivity = async (tuitionIds, membersData) => {
    const activities = [];

    try {
      // Get recent quiz attempts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: quizAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, student_id, score, total_questions, created_at, quizzes!inner(title, tuition_id)')
        .in('quizzes.tuition_id', tuitionIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!attemptsError && quizAttempts) {
        // Get student names
        const studentIds = [...new Set(quizAttempts.map(a => a.student_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds);

        const profileMap = {};
        profiles?.forEach(p => profileMap[p.id] = p.full_name);

        quizAttempts.forEach(attempt => {
          activities.push({
            type: 'quiz',
            title: `${profileMap[attempt.student_id] || 'A student'} completed "${attempt.quizzes?.title || 'Quiz'}"`,
            subtitle: `Score: ${attempt.score}/${attempt.total_questions}`,
            time: attempt.created_at,
            icon: 'quiz',
            color: 'blue',
          });
        });
      }

      // Get recent students joined (last 7 days)
      const { data: recentMembers, error: membersError } = await supabase
        .from('tuition_members')
        .select('user_id, tuition_id, created_at, tuition_spaces(name)')
        .in('tuition_id', tuitionIds)
        .eq('role_in_tuition', 'student')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!membersError && recentMembers) {
        const studentIds = [...new Set(recentMembers.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds);

        const profileMap = {};
        profiles?.forEach(p => profileMap[p.id] = p.full_name);

        recentMembers.forEach(member => {
          activities.push({
            type: 'student',
            title: `${profileMap[member.user_id] || 'New student'} joined ${member.tuition_spaces?.name || 'tuition'}`,
            subtitle: 'New enrollment',
            time: member.created_at,
            icon: 'user',
            color: 'emerald',
          });
        });
      }

      // Get recent classes created (last 7 days)
      const { data: recentClasses, error: classesError } = await supabase
        .from('classes')
        .select('id, name, tuition_id, created_at, tuition_spaces(name)')
        .in('tuition_id', tuitionIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!classesError && recentClasses) {
        recentClasses.forEach(cls => {
          activities.push({
            type: 'class',
            title: `New class "${cls.name}" created`,
            subtitle: `in ${cls.tuition_spaces?.name || 'tuition'}`,
            time: cls.created_at,
            icon: 'class',
            color: 'purple',
          });
        });
      }

      // Sort by time and take top 6
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      return activities.slice(0, 6);
    } catch (err) {
      return [];
    }
  };

  return (
    <DashboardLayout role="Teacher">
      <div className="space-y-8">
        <TeacherHeroTile onAddClick={() => setShowModal(true)} />

        <HighLevelStats 
          analytics={analytics} 
          analyticsLoading={analyticsLoading} 
        />

        <div className="grid xl:grid-cols-3 gap-6 md:gap-8">
          <TuitionsList 
            tuitions={tuitions} 
            analytics={analytics} 
            analyticsLoading={analyticsLoading}
            onCreateClick={() => setShowModal(true)}
            onDeleteClick={(tuition, e) => {
              e.stopPropagation();
              setDeletingTuition(tuition);
            }}
          />

          <RecentActivitySidebar 
            recentActivity={analytics.recentActivity} 
            analyticsLoading={analyticsLoading} 
          />
        </div>
      </div>

      <CreateTuitionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
        onSuccess={(newTuition) => setTuitions([newTuition, ...tuitions])}
      />

      <DeleteTuitionModal
        isOpen={!!deletingTuition}
        tuition={deletingTuition}
        onClose={() => setDeletingTuition(null)}
        userId={userId}
        onSuccess={(deletedId) => setTuitions(tuitions.filter(t => t.id !== deletedId))}
      />
    </DashboardLayout>
  );
}

export default TeacherDashboard;
