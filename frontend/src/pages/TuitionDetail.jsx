import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ClassesTab from '../components/ClassesTab';
import Rolling365Heatmap from '../components/Rolling365Heatmap';
import { supabase } from '../lib/supabase';

// Normalize date to local YYYY-MM-DD (strip time, use local timezone)
function normalizeToLocalDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  // Create date in local timezone by using the date components
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
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const [tuitionCreatedDate, setTuitionCreatedDate] = useState(null);
  const [studentJoinedDate, setStudentJoinedDate] = useState(null);

  const isTeacher = role === 'Teacher';

  const tabs = isTeacher
    ? [
      { id: 'overview', label: 'Overview' },
      { id: 'students', label: 'Students' },
      { id: 'classes', label: 'Classes' },
      { id: 'topics', label: 'Topics' },
      { id: 'quizzes', label: 'Quizzes' },
    ]
    : [
      { id: 'overview', label: 'Overview' },
      { id: 'classes', label: 'Classes' },
      { id: 'topics', label: 'Topics' },
      { id: 'quizzes', label: 'Quizzes' },
    ];

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
        const { data: membersData, error: membersError } = await supabase
          .from('tuition_members')
          .select('user_id, created_at')
          .eq('tuition_id', tuitionId)
          .eq('role_in_tuition', 'student');

        console.log('Members query:', { membersData, membersError });

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

        // Validate: student join date cannot be before tuition created date
        if (studentJoined && tuitionCreated && studentJoined < tuitionCreated) {
          console.error('Error: student_join_date cannot be before tuition_created_date', {
            studentJoined,
            tuitionCreated
          });
        }

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-600 mb-1">{isTeacher ? 'Total Students' : 'Enrolled'}</p>
                <p className="text-3xl font-bold text-slate-900">0</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-600 mb-1">Topics</p>
                <p className="text-3xl font-bold text-slate-900">0</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-600 mb-1">Quizzes</p>
                <p className="text-3xl font-bold text-slate-900">0</p>
              </div>
            </div>

            {/* Attendance Heatmap for Students */}
            {!isTeacher && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance</h3>
                <Rolling365Heatmap
                  intensityMap={attendanceData}
                  tuitionCreatedAt={tuitionCreatedDate}
                  studentJoinedAt={studentJoinedDate}
                />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-[#10b981]"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-[#f87171]"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-[#e2e8f0]"></div>
                    <span>No record</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="relative w-3 h-3 rounded-[2px] bg-[#e2e8f0] overflow-hidden">
                      <div className="absolute top-0 left-0 w-0 h-0 border-t-[5px] border-r-[5px] border-t-blue-500 border-r-transparent"></div>
                    </div>
                    <span>Tuition created</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-3 h-3 rounded-[2px] bg-[#e2e8f0] overflow-hidden">
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-purple-500 border-l-transparent"></div>
                    </div>
                    <span>Student joined</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'students':
        if (!isTeacher) return null;
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Students</h3>
            </div>
            {students.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No students enrolled yet.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((student) => (
                    <tr key={student.user_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {currentUser && student.user_id !== currentUser.id && (
                          <button
                            onClick={() => handleRemoveClick(student)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
      case 'topics':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Topics</h3>
            </div>
            <div className="p-6 text-center text-slate-500">
              No topics yet.
            </div>
          </div>
        );
      case 'quizzes':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Quizzes</h3>
            </div>
            <div className="p-6 text-center text-slate-500">
              No quizzes yet.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{tuition.name}</h1>
              <p className="text-sm text-slate-500">
                Created {tuitionCreatedDate}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Join Code</p>
            <p className="font-mono text-lg font-semibold bg-slate-100 px-3 py-1 rounded">
              {tuition.join_code || 'N/A'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  pb-4 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Remove Confirmation Modal */}
        {showRemoveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Remove Student
              </h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to remove {removingStudent?.full_name} from this tuition?
              </p>
              {removeError && (
                <p className="text-red-600 text-sm mb-4">{removeError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelRemove}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={removingStudent === null}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TuitionDetail;
