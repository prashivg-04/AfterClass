import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';
import {
  ClassDetailTabs,
  ClassOverviewTab,
  ClassAttendanceTab,
  ClassResourcesTab,
  ClassDoubtsTab,
  ClassQuizTab,
  AttendanceModal,
} from '../components/class-detail';

function ClassDetail({ role = 'Teacher' }) {
  const { tuitionId, classId } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [lockedAttendance, setLockedAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isTeacher = role === 'Teacher';

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      setCls(classData);

      // Fetch students in this tuition
      const { data: membersData } = await supabase
        .from('tuition_members')
        .select('user_id')
        .eq('tuition_id', tuitionId)
        .eq('role_in_tuition', 'student');

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);

        // Get student profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = {};
        if (profilesData) {
          profilesData.forEach(p => {
            profileMap[p.id] = p.full_name;
          });
        }

        const studentsWithNames = membersData.map(m => ({
          id: m.user_id,
          full_name: profileMap[m.user_id] || 'Unknown'
        }));

        setStudents(studentsWithNames);

        // Fetch existing attendance
        const { data: attendanceData } = await supabase
          .from('class_attendance')
          .select('*')
          .eq('class_id', classId);

        if (attendanceData) {
          const attMap = {};
          const lockedMap = {};
          attendanceData.forEach(a => {
            attMap[a.student_id] = a.status;
            lockedMap[a.student_id] = a.locked || false;
          });
          setAttendance(attMap);
          setLockedAttendance(lockedMap);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [tuitionId, classId]);

  // Check if all students have attendance marked (for teacher)
  const hasAttendanceSubmitted = isTeacher && students.length > 0 && students.every(s => lockedAttendance[s.id]);

  // Get current student's attendance (for student view)
  const myAttendance = !isTeacher ? attendance[currentUser?.id] : null;

  // Calculate attendance summary
  const presentCount = (students || []).filter(s => attendance[s.id] === 'present').length;
  const totalCount = (students || []).length;
  const attendanceSummary = totalCount > 0 ? `${presentCount} / ${totalCount} present` : null;

  const openAttendanceModal = () => {
    // Initialize pending attendance with existing locked values
    const initialPending = {};
    students.forEach(s => {
      if (lockedAttendance[s.id]) {
        initialPending[s.id] = attendance[s.id];
      }
    });
    setPendingAttendance(initialPending);
    setShowAttendanceModal(true);
  };

  const handlePendingAttendance = (studentId, status) => {
    setPendingAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    setSaving(true);

    // Prepare attendance records for all students
    const attendanceRecords = students.map(student => ({
      class_id: classId,
      student_id: student.id,
      status: pendingAttendance[student.id] || 'absent',
      locked: true
    }));

    const { error } = await supabase
      .from('class_attendance')
      .upsert(attendanceRecords, {
        onConflict: 'class_id,student_id'
      });

    if (!error) {
      // Update local state
      const newAttendance = {};
      const newLocked = {};
      students.forEach(s => {
        newAttendance[s.id] = pendingAttendance[s.id] || 'absent';
        newLocked[s.id] = true;
      });
      setAttendance(newAttendance);
      setLockedAttendance(newLocked);
      setShowAttendanceModal(false);
    }
    setSaving(false);
  };

  const handleBack = () => {
    navigate(`/dashboard/${role.toLowerCase()}/tuition/${tuitionId}`);
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ClassOverviewTab
            cls={cls}
            attendanceSummary={attendanceSummary}
            hasAttendanceSubmitted={hasAttendanceSubmitted}
            isTeacher={isTeacher}
          />
        );
      case 'attendance':
        return (
          <ClassAttendanceTab
            isTeacher={isTeacher}
            students={students}
            attendance={isTeacher ? attendance : myAttendance}
            hasAttendanceSubmitted={hasAttendanceSubmitted}
            onMarkAttendance={openAttendanceModal}
          />
        );
      case 'resources':
        return <ClassResourcesTab isTeacher={isTeacher} tuitionId={tuitionId} classId={classId} />;
      case 'doubts':
        return <ClassDoubtsTab classId={classId} isTeacher={isTeacher} />;
      case 'quiz':
        return <ClassQuizTab />;
      default:
        return (
          <ClassOverviewTab
            cls={cls}
            attendanceSummary={attendanceSummary}
            hasAttendanceSubmitted={hasAttendanceSubmitted}
            isTeacher={isTeacher}
          />
        );
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

  if (!cls) {
    return (
      <DashboardLayout role={role}>
        <div className="text-center py-12">
          <p className="text-slate-600">Class not found.</p>
          <button onClick={handleBack} className="mt-4 text-blue-600 hover:underline">
            Back to Classes
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
              onClick={handleBack}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-colors self-start border border-slate-200"
              aria-label="Back to classes"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{cls.name}</h1>

                {cls.class_date && (
                  <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100/50 self-start sm:self-auto">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(cls.class_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {cls.topics && cls.topics.map(topic => (
                  <span key={topic} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200/60 shadow-sm">
                    {topic}
                  </span>
                ))}
                {(!cls.topics || cls.topics.length === 0) && (
                  <span className="text-sm text-slate-500 italic">No topics specifically tagged</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ClassDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {renderTabContent()}

        {/* Attendance Modal */}
        <AttendanceModal
          isOpen={showAttendanceModal}
          students={students}
          pendingAttendance={pendingAttendance}
          onSelectStatus={handlePendingAttendance}
          onCancel={() => setShowAttendanceModal(false)}
          onSubmit={submitAttendance}
          isSaving={saving}
        />
      </div>
    </DashboardLayout>
  );
}

export default ClassDetail;
