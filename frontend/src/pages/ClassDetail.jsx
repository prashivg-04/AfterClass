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
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      setCls(classData);

      const { data: membersData } = await supabase
        .from('tuition_members')
        .select('user_id')
        .eq('tuition_id', tuitionId)
        .eq('role_in_tuition', 'student');

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);

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

  const hasAttendanceSubmitted = isTeacher && students.length > 0 && students.every(s => lockedAttendance[s.id]);
  const myAttendance = !isTeacher ? attendance[currentUser?.id] : null;
  const presentCount = (students || []).filter(s => attendance[s.id] === 'present').length;
  const totalCount = (students || []).length;
  const attendanceSummary = totalCount > 0 ? `${presentCount} / ${totalCount} present` : null;

  const openAttendanceModal = () => {
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
    const attendanceRecords = students.map(student => ({
      class_id: classId,
      student_id: student.id,
      status: pendingAttendance[student.id] || 'absent',
      locked: true
    }));

    const { error } = await supabase
      .from('class_attendance')
      .upsert(attendanceRecords, { onConflict: 'class_id,student_id' });

    if (!error) {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ClassOverviewTab
            cls={cls}
            attendanceSummary={attendanceSummary}
            hasAttendanceSubmitted={hasAttendanceSubmitted}
            isTeacher={isTeacher}
            presentCount={presentCount}
            totalCount={totalCount}
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
      default:
        return (
          <ClassOverviewTab
            cls={cls}
            attendanceSummary={attendanceSummary}
            hasAttendanceSubmitted={hasAttendanceSubmitted}
            isTeacher={isTeacher}
            presentCount={presentCount}
            totalCount={totalCount}
          />
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!cls) {
    return (
      <DashboardLayout role={role}>
        <div className="bg-white rounded-4xl p-16 text-center border border-slate-200/80 shadow-sm">
          <p className="text-slate-600 font-medium mb-4">Class not found.</p>
          <button onClick={handleBack} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors">
            Back to Classes
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 lg:space-y-8">

        {/* ── Dark Hero Header ── */}
        <div className="bg-slate-900 rounded-4xl p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <button
                onClick={handleBack}
                className="shrink-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-colors border border-white/15 backdrop-blur-sm"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-2">Class Session</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{cls.name}</h1>
              </div>
              {cls.class_date && (
                <div className="shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/15 text-sm font-bold text-white/90">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(cls.class_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Topics */}
            <div className="flex flex-wrap gap-2">
              {cls.topics && cls.topics.length > 0 ? (
                cls.topics.map(topic => (
                  <span key={topic} className="px-3 py-1 bg-white/10 text-white/80 text-xs font-bold rounded-xl border border-white/15 backdrop-blur-sm">
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic">No topics tagged</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <ClassDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ── Tab Content ── */}
        {renderTabContent()}

        {/* ── Attendance Modal ── */}
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
