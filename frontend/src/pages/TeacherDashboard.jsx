import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';
import { tuitionSchema } from '../schemas/tuition.schema';
import { handleError } from '../utilities/errorHandler';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'JEE', 'NEET'];
const BATCHES = ['Morning', 'Evening'];

function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const [tuitions, setTuitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Delete tuition states
  const [deletingTuition, setDeletingTuition] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tuitionSchema),
    defaultValues: {
      tuitionName: '',
      subject: '',
      grade: '',
      batch: '',
      monthlyFee: '',
      description: '',
    },
  });

  const resetForm = () => {
    reset({
      tuitionName: '',
      subject: '',
      grade: '',
      batch: '',
      monthlyFee: '',
      description: '',
    });
  };

  const handleDeleteTuition = async () => {
    if (!deletingTuition || !userId) return;

    setIsDeleting(true);
    try {
      // Delete tuition - cascade will handle related records
      const { error } = await supabase
        .from('tuition_spaces')
        .delete()
        .eq('id', deletingTuition.id)
        .eq('created_by', userId);

      if (error) throw error;

      // Update local state
      setTuitions(tuitions.filter(t => t.id !== deletingTuition.id));
      toast.success('Tuition deleted successfully');
      setDeletingTuition(null);
      setDeleteStep(1);
      setDeleteConfirmText('');
    } catch (err) {
      handleError(err, 'Failed to delete tuition');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (tuition, e) => {
    e.stopPropagation(); // Prevent card click navigation
    setDeletingTuition(tuition);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setDeletingTuition(null);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const canProceedToStep2 = () => {
    return deleteConfirmText.toUpperCase() === deletingTuition?.name?.toUpperCase();
  };

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
      console.error('Error fetching analytics:', err);
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
      console.error('Error fetching recent activity:', err);
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

  const handleCreateTuition = async (data) => {
    if (!userId) return;

    setLoading(true);

    try {
      // Generate a random 6-character join code
      const joinCode = generateJoinCode();

      // 1. Create tuition space
      const { data: tuition, error: tuitionError } = await supabase
        .from('tuition_spaces')
        .insert({
          name: data.tuitionName,
          created_by: userId,
          join_code: joinCode,
          subject: data.subject || null,
          grade: data.grade || null,
          batch: data.batch || null,
          description: data.description || null,
          monthly_fee: parseFloat(data.monthlyFee),
        })
        .select()
        .single();

      if (tuitionError) throw tuitionError;

      // 2. Add teacher as member with teacher role
      const { error: memberError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'teacher',
        });

      if (memberError) throw memberError;

      // 3. Update list and clear form
      setTuitions([tuition, ...tuitions]);
      resetForm();
      setShowModal(false);
      toast.success('Tuition created successfully');
    } catch (err) {
      toast.error('Failed to create tuition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="Teacher">
      <div className="space-y-6">
        {/* Create Tuition Button */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Manage Your Tuitions</h3>
              <p className="text-slate-500 mt-1">Create and manage your tuition batches and students</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Tuition
            </button>
          </div>
        </div>

        {/* Tuition List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Your Tuitions</h3>
          </div>
          <div className="p-6">
            {tuitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
                  <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">No tuitions created yet</h4>
                <p className="text-slate-500 max-w-sm mb-6">
                  Get started by creating your first tuition space to manage students, classes, and resources.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  Create Tuition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tuitions.map((tuition) => (
                  <div
                    key={tuition.id}
                    onClick={() => navigate(`/dashboard/teacher/tuition/${tuition.id}`)}
                    className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                  >
                    {/* Decorative side accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{tuition.name}</h4>
                      <div className="px-2.5 py-1 bg-blue-50/50 text-blue-600 text-xs font-semibold rounded-lg border border-blue-100 shrink-0">
                        Teacher
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {tuition.subject && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {tuition.subject}
                        </span>
                      )}
                      {tuition.grade && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {tuition.grade}
                        </span>
                      )}
                      {tuition.batch && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {tuition.batch}
                        </span>
                      )}
                    </div>

                    {/* Student count badge */}
                    {analytics.studentsByTuition[tuition.id] > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-sm font-medium text-slate-600">
                          {analytics.studentsByTuition[tuition.id]} student{analytics.studentsByTuition[tuition.id] !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Code: <span className="font-mono text-slate-700 font-semibold">{tuition.join_code || 'N/A'}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => openDeleteModal(tuition, e)}
                          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 transition-colors"
                          title="Delete Tuition"
                        >
                          <svg className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analyticsLoading ? (
                    <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    analytics.totalStudents
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
              Across {tuitions.length} tuitions
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analyticsLoading ? (
                    <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    analytics.totalClasses
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
              All time
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg. Attendance</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analyticsLoading ? (
                    <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    `${analytics.averageAttendance}%`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className={`mt-4 flex items-center text-xs font-medium px-2.5 py-1 rounded-lg w-fit ${
              analytics.averageAttendance >= 80 ? 'text-emerald-600 bg-emerald-50' :
              analytics.averageAttendance >= 60 ? 'text-amber-600 bg-amber-50' :
              'text-red-600 bg-red-50'
            }`}>
              {analytics.averageAttendance >= 80 ? 'Excellent' :
               analytics.averageAttendance >= 60 ? 'Good' : 'Needs Attention'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
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
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
              This month
            </div>
          </div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 border border-blue-400 shadow-lg relative overflow-hidden text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm font-medium text-blue-100">Total Quizzes</p>
              </div>
              <p className="text-4xl font-bold">
                {analyticsLoading ? '-' : analytics.totalQuizzes}
              </p>
              <p className="text-sm text-blue-100 mt-2">Created across all tuitions</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 border border-emerald-400 shadow-lg relative overflow-hidden text-white md:col-span-2">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-sm font-medium text-emerald-100">Quick Insight</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {analyticsLoading ? 'Loading...' : (
                      tuitions.length > 0 ? (
                        <>
                          Your largest tuition has{' '}
                          <span className="text-emerald-200">
                            {Math.max(...Object.values(analytics.studentsByTuition).filter(Boolean), 0)}
                          </span>{' '}
                          students
                        </>
                      ) : 'Create your first tuition to get started'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/teacher/payments')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
                >
                  View Payments
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {analyticsLoading ? (
              // Loading state
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : analytics.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No recent activity</p>
                <p className="text-sm mt-1">Activity from the last 7 days will appear here</p>
              </div>
            ) : (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${
                      activity.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                      activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                      activity.color === 'purple' ? 'bg-purple-50 border-purple-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      {activity.icon === 'quiz' && (
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {activity.icon === 'user' && (
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      )}
                      {activity.icon === 'class' && (
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{activity.title}</p>
                      <p className={`text-xs font-medium mt-0.5 ${
                        activity.color === 'blue' ? 'text-blue-600' :
                        activity.color === 'emerald' ? 'text-emerald-600' :
                        activity.color === 'purple' ? 'text-purple-600' :
                        'text-slate-500'
                      }`}>{activity.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Tuition Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Create New Tuition</h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(handleCreateTuition)} className="space-y-5" noValidate>
                {/* Tuition Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tuition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('tuitionName')}
                    placeholder="e.g., Math Grade 10 Morning Batch"
                    className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-400 ${errors.tuitionName
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    aria-invalid={errors.tuitionName ? "true" : "false"}
                  />
                  {errors.tuitionName && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.tuitionName.message}
                    </p>
                  )}
                </div>

                {/* Subject & Grade Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                    <select
                      {...register('subject')}
                      className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${errors.subject
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      aria-invalid={errors.subject ? "true" : "false"}
                    >
                      <option value="">Select subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{errors.subject.message}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label>
                    <select
                      {...register('grade')}
                      className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${errors.grade
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      aria-invalid={errors.grade ? "true" : "false"}
                    >
                      <option value="">Select grade</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.grade && (
                      <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{errors.grade.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Batch */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch</label>
                  <select
                    {...register('batch')}
                    className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${errors.batch
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    aria-invalid={errors.batch ? "true" : "false"}
                  >
                    <option value="">Select batch</option>
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.batch && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errors.batch.message}</span>
                    </p>
                  )}
                </div>

                {/* Monthly Fee */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Monthly Fee <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                    <input
                      type="number"
                      {...register('monthlyFee')}
                      placeholder="e.g., 1500"
                      min="1"
                      step="1"
                      className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-400 ${errors.monthlyFee
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      aria-invalid={errors.monthlyFee ? "true" : "false"}
                    />
                  </div>
                  {errors.monthlyFee && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.monthlyFee.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="Add any notes about this tuition..."
                    rows={3}
                    className={`w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none placeholder:text-slate-400 ${errors.description
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    aria-invalid={errors.description ? "true" : "false"}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errors.description.message}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? 'Creating...' : 'Create Tuition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tuition Confirmation Modal */}
      {deletingTuition && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-bold text-slate-900">
                  Delete Tuition - Step {deleteStep} of 3
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Initial Warning */}
              {deleteStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 font-semibold mb-2">
                      You are about to delete:
                    </p>
                    <p className="text-xl font-bold text-slate-900 mb-4">
                      "{deletingTuition.name}"
                    </p>
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>This action cannot be undone. All data including students, classes, quizzes, and payment records will be permanently deleted.</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 font-medium mb-2">Data that will be deleted:</p>
                    <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                      <li>All enrolled students</li>
                      <li>All classes and attendance records</li>
                      <li>All quizzes and attempts</li>
                      <li>All fee payment records</li>
                      <li>All resources and announcements</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(2)}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 shadow-sm rounded-xl hover:bg-red-700 transition-all hover:shadow"
                    >
                      I Understand, Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Type Confirmation */}
              {deleteStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 font-medium mb-3">
                      To confirm deletion, please type the tuition name:
                    </p>
                    <p className="text-lg font-bold text-slate-900 mb-4 font-mono bg-slate-100 px-3 py-2 rounded-lg">
                      {deletingTuition.name}
                    </p>

                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`Type "${deletingTuition.name}" to confirm`}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900"
                      autoFocus
                    />

                    {deleteConfirmText && !canProceedToStep2() && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Text does not match
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteStep(1)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(3)}
                      disabled={!canProceedToStep2()}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 shadow-sm rounded-xl hover:bg-red-700 transition-all hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Confirmation */}
              {deleteStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-lg">Final Confirmation</p>
                        <p className="text-sm text-slate-500">This is your last chance to cancel</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="text-slate-700">
                        You are about to permanently delete <strong className="text-slate-900">"{deletingTuition.name}"</strong> and all its associated data.
                      </p>
                      <p className="text-red-700 font-medium">
                        This action is irreversible.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTuition}
                      disabled={isDeleting}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 shadow-sm rounded-xl hover:bg-red-700 transition-all hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeleting && (
                        <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TeacherDashboard;
