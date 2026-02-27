import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';

function ClassDetail({ role = 'Teacher' }) {
  const { tuitionId, classId } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [lockedAttendance, setLockedAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleAttendanceToggle = async (studentId, status) => {
    // Don't allow changes if already locked
    if (lockedAttendance[studentId]) return;

    const currentStatus = attendance[studentId];
    const newStatus = status;

    // Optimistic update
    setAttendance(prev => ({ ...prev, [studentId]: newStatus }));
    setLockedAttendance(prev => ({ ...prev, [studentId]: true }));

    const { error } = await supabase
      .from('class_attendance')
      .upsert({
        class_id: classId,
        student_id: studentId,
        status: newStatus,
        locked: true
      }, {
        onConflict: 'class_id,student_id'
      });

    if (error) {
      // Revert on error
      setAttendance(prev => ({ ...prev, [studentId]: currentStatus }));
      setLockedAttendance(prev => ({ ...prev, [studentId]: false }));
      console.error('Failed to update attendance:', error);
    }
  };

  const handleBack = () => {
    navigate(`/dashboard/${role.toLowerCase()}/tuition/${tuitionId}`);
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

  // For student view, get their attendance status
  const myAttendance = isTeacher ? null : attendance[currentUser?.id];

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cls.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              {cls.topics && cls.topics.map(topic => (
                <span key={topic} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900">Quiz</h3>
          <p className="text-slate-500 mt-1">Coming soon</p>
        </div>

        {/* Attendance Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Attendance</h3>
          </div>

          {isTeacher ? (
            // Teacher View - Full student list with toggle
            students.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No students in this tuition.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map(student => {
                    const isLocked = lockedAttendance[student.id];
                    const currentStatus = attendance[student.id];
                    return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isLocked ? (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            currentStatus === 'present'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {currentStatus === 'present' ? 'Present' : 'Absent'}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAttendanceToggle(student.id, 'present')}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleAttendanceToggle(student.id, 'absent')}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700"
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )
          ) : (
            // Student View - Own attendance status
            <div className="p-6">
              {myAttendance ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Your status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    myAttendance === 'present'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {myAttendance === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ) : (
                <p className="text-slate-500">Attendance not marked yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ClassDetail;
