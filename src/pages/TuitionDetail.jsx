import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ClassesTab from '../components/ClassesTab';
import { supabase } from '../lib/supabase';

import {
  TuitionHeader,
  TuitionTabs,
  OverviewTab,
  StudentsTab,
  ResourcesTab,
  AnnouncementsTab,
  DiscussionTab,
  QuizzesTab,
  StudentDetailsDrawer,
  RemoveStudentModal
} from '../components/tuition-detail';

// Normalize date to local YYYY-MM-DD (strip time, use local timezone)
function normalizeToLocalDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function TuitionDetail({ role = 'Teacher' }) {
  const { tuitionId } = useParams();
  const navigate = useNavigate();
  const [tuition, setTuition] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [removingStudent, setRemovingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const [tuitionCreatedDate, setTuitionCreatedDate] = useState(null);
  const [studentJoinedDate, setStudentJoinedDate] = useState(null);
  const [copied, setCopied] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [studentKpiData, setStudentKpiData] = useState({
    attendancePercentage: 0,
    classesAttended: 0,
    classesConducted: 0,
    quizzesAttempted: 0,
    totalQuizzes: 0,
    averageQuizScore: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(true);
  const tabsRef = useRef([]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isTeacher = role === 'Teacher';

  const tabs = isTeacher
    ? [
      { id: 'overview', label: 'Overview' },
      { id: 'students', label: 'Students' },
      { id: 'classes', label: 'Classes' },
      { id: 'resources', label: 'Resources' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'discussion', label: 'Discussion' },
      { id: 'quizzes', label: 'Quizzes' },
    ]
    : [
      { id: 'overview', label: 'Overview' },
      { id: 'classes', label: 'Classes' },
      { id: 'resources', label: 'Resources' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'discussion', label: 'Discussion' },
      { id: 'quizzes', label: 'Quizzes' },
    ];

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabs.findIndex(t => t.id === activeTab);
      const activeElement = tabsRef.current[activeIndex];
      if (activeElement) {
        setIndicatorStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
    };

    updateIndicator();
    const timeout = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timeout);
  }, [activeTab, tabs.length, loading]);

  useEffect(() => {
    const fetchTuition = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data } = await supabase
        .from('tuition_spaces')
        .select('*')
        .eq('id', tuitionId)
        .single();

      setTuition(data);

      // Normalize tuition created date to local YYYY-MM-DD
      const tuitionCreated = normalizeToLocalDate(data?.created_at);
      setTuitionCreatedDate(tuitionCreated);

      if (isTeacher) {
        // First get all student members
        const { data: membersData } = await supabase
          .from('tuition_members')
          .select('user_id, created_at')
          .eq('tuition_id', tuitionId)
          .eq('role_in_tuition', 'student');

        if (membersData && membersData.length > 0) {
          // Then get profile names for each student
          const userIds = membersData.map(m => m.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          // Map profiles to members
          const profileMap = {};
          if (profilesData) {
            profilesData.forEach(p => {
              profileMap[p.id] = p.full_name;
            });
          }

          setStudents(membersData.map(m => ({
            user_id: m.user_id,
            full_name: profileMap[m.user_id] || 'Unknown',
            created_at: m.created_at
          })));
        } else {
          setStudents([]);
        }
      }

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('tuition_id', tuitionId)
        .order('created_at', { ascending: false });

      setClasses(classesData || []);

      // Fetch attendance for student view
      if (!isTeacher && user) {
        // Get student's actual join date from tuition_members table
        const { data: memberData } = await supabase
          .from('tuition_members')
          .select('created_at')
          .eq('tuition_id', tuitionId)
          .eq('user_id', user.id)
          .eq('role_in_tuition', 'student')
          .single();

        // Normalize student join date to local YYYY-MM-DD
        const studentJoined = normalizeToLocalDate(memberData?.created_at);
        setStudentJoinedDate(studentJoined);

        const classIds = classesData?.map(c => c.id) || [];

        const attendanceMap = {};
        if (classIds.length > 0) {
          const { data: attendanceRecords } = await supabase
            .from('class_attendance')
            .select('class_id, status')
            .eq('student_id', user.id)
            .in('class_id', classIds);

          if (attendanceRecords) {
            attendanceRecords.forEach(a => {
              attendanceMap[a.class_id] = a.status;
            });
          }
        }

        // Build intensity map for rolling 365 days using normalized dates
        const intensityMap = {};
        (classesData || []).forEach(cls => {
          const dateStr = normalizeToLocalDate(cls.created_at);
          const status = attendanceMap[cls.id];
          // 0 = no class, 1 = absent, 2 = present
          if (status === 'present') {
            intensityMap[dateStr] = 2;
          } else if (status === 'absent') {
            intensityMap[dateStr] = 1;
          } else {
            intensityMap[dateStr] = 0;
          }
        });

        setAttendanceData(intensityMap);

        // Calculate KPI data for student
        setKpiLoading(true);
        try {
          // Count classes with attendance records
          const classesConducted = classIds.length;
          const classesAttended = Object.values(attendanceMap).filter(s => s === 'present').length;
          const classesAbsent = Object.values(attendanceMap).filter(s => s === 'absent').length;
          const totalMarked = classesAttended + classesAbsent;

          const attendancePercentage = totalMarked > 0
            ? Math.round((classesAttended / totalMarked) * 100)
            : 0;

          // Fetch all quizzes for this tuition
          const { data: quizzesData, error: quizzesError } = await supabase
            .from('quizzes')
            .select('id')
            .eq('tuition_id', tuitionId);

          if (quizzesError) throw quizzesError;

          const totalQuizzes = quizzesData?.length || 0;
          const quizIds = quizzesData?.map(q => q.id) || [];

          // Fetch quiz attempts for this student in these quizzes
          let quizzesAttempted = 0;
          let totalScore = 0;
          let totalQuestions = 0;

          if (quizIds.length > 0) {
            const { data: quizAttemptsData, error: quizError } = await supabase
              .from('quiz_attempts')
              .select('score, total_questions')
              .eq('student_id', user.id)
              .in('quiz_id', quizIds);

            if (quizError) throw quizError;

            quizzesAttempted = quizAttemptsData?.length || 0;

            // Calculate average score percentage
            if (quizAttemptsData && quizAttemptsData.length > 0) {
              quizAttemptsData.forEach(attempt => {
                totalScore += attempt.score || 0;
                totalQuestions += attempt.total_questions || 0;
              });
            }
          }

          const averageQuizScore = quizzesAttempted > 0 && totalQuestions > 0
            ? Math.round((totalScore / totalQuestions) * 100)
            : 0;

          setStudentKpiData({
            attendancePercentage,
            classesAttended,
            classesConducted,
            quizzesAttempted,
            totalQuizzes,
            averageQuizScore,
          });
        } catch (error) {
          setStudentKpiData({
            attendancePercentage: 0,
            classesAttended: 0,
            classesConducted: classIds.length,
            quizzesAttempted: 0,
            totalQuizzes: 0,
            averageQuizScore: 0,
          });
        } finally {
          setKpiLoading(false);
        }
      } else {
        setAttendanceData({});
        setKpiLoading(false);
      }

      setLoading(false);
    };

    fetchTuition();
  }, [tuitionId, isTeacher]);

  const handleBack = () => {
    navigate(`/dashboard/${role.toLowerCase()}`);
  };

  const handleRemoveClick = (student) => {
    setRemovingStudent(student);
    setShowRemoveModal(true);
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!removingStudent) return;

    setRemoveError(null);

    const { error } = await supabase
      .from('tuition_members')
      .delete()
      .eq('tuition_id', tuitionId)
      .eq('user_id', removingStudent.user_id)
      .eq('role_in_tuition', 'student');

    if (error) {
      setRemoveError('Failed to remove student. Please try again.');
      setRemovingStudent(null);
      setShowRemoveModal(false);
      return;
    }

    // Optimistically remove student from local state
    setStudents(students.filter(s => s.user_id !== removingStudent.user_id));
    setRemovingStudent(null);
    setShowRemoveModal(false);
  };

  const handleCancelRemove = () => {
    setRemovingStudent(null);
    setShowRemoveModal(false);
    setRemoveError(null);
  };

  const copyJoinCode = () => {
    if (tuition?.join_code) {
      navigator.clipboard.writeText(tuition.join_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      }).catch(err => {
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            tuition={tuition}
            isTeacher={isTeacher}
            attendanceData={attendanceData}
            tuitionCreatedDate={tuitionCreatedDate}
            studentJoinedDate={studentJoinedDate}
            studentKpiData={studentKpiData}
            kpiLoading={kpiLoading}
          />
        );
      case 'students':
        if (!isTeacher) return null;
        return (
          <StudentsTab
            students={students}
            currentUser={currentUser}
            onStudentClick={setSelectedStudent}
            onRemoveClick={handleRemoveClick}
          />
        );
      case 'classes':
        return (
          <ClassesTab
            classes={classes}
            setClasses={setClasses}
            tuitionId={tuitionId}
            isTeacher={isTeacher}
            subject={tuition?.subject}
          />
        );
      case 'resources':
        return <ResourcesTab tuitionId={tuitionId} isTeacher={isTeacher} />;
      case 'announcements':
        return <AnnouncementsTab tuitionId={tuitionId} isTeacher={isTeacher} />;
      case 'discussion':
        return <DiscussionTab tuitionId={tuitionId} isTeacher={isTeacher} />;
      case 'quizzes':
        return <QuizzesTab tuitionId={tuitionId} isTeacher={isTeacher} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tuition) {
    return (
      <DashboardLayout role={role}>
        <div className="text-center py-12">
          <p className="text-slate-600">Tuition not found.</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        {/* Premium Dark Hero Section */}
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          {/* Ambient Glowing Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -mt-20 -mr-20"></div>
          <div className="absolute -bottom-10 left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-6">
            <button
              onClick={() => navigate(`/dashboard/${role.toLowerCase()}`)}
              className="shrink-0 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl transition-all border border-white/10 shadow-sm self-start group"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner shrink-0 relative overflow-hidden">
                     <div className="absolute inset-0 bg-linear-to-br from-indigo-400/20 to-transparent"></div>
                    <svg className="w-7 h-7 text-indigo-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{tuition.name}</h1>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 bg-white/5 text-slate-300 rounded-xl border border-white/10 self-start sm:self-auto shrink-0 shadow-sm backdrop-blur-md">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created {formatDate(tuition.created_at)}</span>
                </div>
              </div>

              {tuition.description && (
                <p className="text-slate-400 mb-6 leading-relaxed sm:ml-[4.5rem] font-medium max-w-3xl">{tuition.description}</p>
              )}

              <div className="flex flex-wrap gap-2.5 sm:ml-[4.5rem] mb-6">
                {tuition.subject && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/5 border border-white/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                    {tuition.subject}
                  </span>
                )}
                {tuition.grade && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/5 border border-white/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    {tuition.grade}
                  </span>
                )}
                {tuition.batch && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/5 border border-white/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                    {tuition.batch}
                  </span>
                )}
              </div>
            </div>

            {/* Teacher Share Code / Student Teacher Info */}
            {isTeacher ? (
              <div className="shrink-0 bg-white/5 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/10 shadow-2xl sm:mt-0 max-w-xs w-full sm:w-72">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest text-center">Invite Students</p>
                <div className="flex items-center gap-2 w-full mb-2">
                  <div className="bg-slate-900 border border-white/10 px-4 py-3 rounded-xl text-white font-mono tracking-widest font-bold shadow-inner flex-1 text-center text-xl">
                    {tuition.join_code}
                  </div>
                  <button
                    onClick={copyJoinCode}
                    className="p-3.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] group"
                    title="Copy Join Code"
                  >
                    {copied ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center w-full leading-relaxed font-medium">Share this code to allow your students to join.</p>
              </div>
            ) : (
              tuition.teacher && (
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 lg:p-5 rounded-[1.5rem] border border-white/10 shadow-2xl shrink-0 sm:mt-0 max-w-xs w-full sm:w-64">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-inner border border-indigo-400/50">
                    {tuition.teacher.full_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Instructed By</p>
                    <p className="text-base font-bold text-white tracking-wide">{tuition.teacher.full_name}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Tabs - Thick Modern Premium Style */}
        <div className="mt-2 px-2 sm:px-4 flex overflow-x-auto scrollbar-hide bg-white rounded-2xl shadow-sm border border-slate-200">
          <nav className="flex min-w-max relative w-full" aria-label="Tabs">
            {/* Animated Underline/Pill Indicator */}
            <div
              className="absolute bottom-0 h-1 bg-slate-900 rounded-t-lg transition-all duration-300 ease-spring will-change-[left,width]"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={el => tabsRef.current[index] = el}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative whitespace-nowrap py-5 px-6 font-bold text-sm transition-all duration-200 select-none outline-none tracking-wide
                  ${activeTab === tab.id
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {renderTabContent()}

        <RemoveStudentModal
          student={removingStudent}
          error={removeError}
          onCancel={handleCancelRemove}
          onConfirm={handleConfirmRemove}
        />

        <StudentDetailsDrawer
          student={selectedStudent}
          tuitionId={tuitionId}
          onClose={() => setSelectedStudent(null)}
        />
      </div>
    </DashboardLayout>
  );
}

export default TuitionDetail;
