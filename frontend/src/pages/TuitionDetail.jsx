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
  StudentDetailsModal,
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
      } else {
        setAttendanceData({});
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
        console.error('Failed to copy join code: ', err);
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
          />
        );
      case 'resources':
        return <ResourcesTab />;
      case 'announcements':
        return <AnnouncementsTab />;
      case 'discussion':
        return <DiscussionTab />;
      case 'quizzes':
        return <QuizzesTab />;
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
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70 pointer-events-none"></div>

          <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
            <button
              onClick={() => navigate(`/dashboard/${role.toLowerCase()}`)}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors self-start border border-slate-200"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100/50 rounded-xl flex items-center justify-center border border-blue-200/50 shadow-sm shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{tuition.name}</h1>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100/50 self-start sm:self-auto shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created {formatDate(tuition.created_at)}</span>
                </div>
              </div>

              {tuition.description && (
                <p className="text-slate-600 mb-5 leading-relaxed sm:ml-15">{tuition.description}</p>
              )}

              <div className="flex flex-wrap gap-2 sm:ml-15 mb-6">
                {tuition.subject && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                    {tuition.subject}
                  </span>
                )}
                {tuition.grade && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
                    {tuition.grade}
                  </span>
                )}
                {tuition.batch && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    {tuition.batch}
                  </span>
                )}
              </div>
            </div>

            {/* Teacher Share Code / Student Teacher Info */}
            {isTeacher ? (
              <div className="shrink-0 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 shadow-sm sm:mt-0 max-w-xs w-full sm:w-64">
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider text-center">Invite Students</p>
                <div className="flex items-center gap-2 w-full mb-1">
                  <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 font-mono tracking-wider font-bold shadow-inner flex-1 text-center text-lg">
                    {tuition.join_code}
                  </div>
                  <button
                    onClick={copyJoinCode}
                    className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all shadow-sm group"
                    title="Copy Join Code"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center w-full leading-tight text-balance">Share this code to allow students to join.</p>
              </div>
            ) : (
              tuition.teacher && (
                <div className="flex items-center gap-3 bg-slate-50/80 p-3 lg:p-4 rounded-xl border border-slate-200/60 shadow-sm shrink-0 sm:mt-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {tuition.teacher.full_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Teacher</p>
                    <p className="text-sm font-semibold text-slate-800">{tuition.teacher.full_name}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Tabs - Modern Premium Style */}
        <div className="border-b border-slate-200 mt-6 px-4 sm:px-6 flex overflow-x-auto scrollbar-hide">
          <nav className="flex gap-6 sm:gap-8 min-w-max relative pb-0 w-full" aria-label="Tabs">
            {/* Animated Background Underline */}
            <div
              className="absolute bottom-0 h-[3px] bg-blue-600 rounded-t-md transition-all duration-300 ease-in-out will-change-[left,width]"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={el => tabsRef.current[index] = el}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative whitespace-nowrap py-4 px-1 font-semibold text-sm transition-colors duration-200 select-none outline-none
                  ${activeTab === tab.id
                    ? 'text-blue-700'
                    : 'text-slate-500 hover:text-slate-900'
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

        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      </div>
    </DashboardLayout>
  );
}

export default TuitionDetail;
