import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function StudentDetailsDrawer({ student, tuitionId, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentStats, setStudentStats] = useState({
    joinedDate: null,
    attendancePercentage: 0,
    classesAttended: 0,
    classesConducted: 0,
    totalClasses: 0,
    quizzesAttempted: 0,
    totalQuizzes: 0,
    averageQuizScore: 0,
    quizScores: [],
    recentAttendance: [],
    upcomingClasses: [],
    resourcesUploaded: 0,
    announcementsViewed: 0,
  });

  // Fee configuration state
  const [feeSettings, setFeeSettings] = useState({
    fee_amount: '',
    due_day: '1',
    hasIndividualFee: false,
    status: 'unpaid',
  });
  const [isEditingFee, setIsEditingFee] = useState(false);

  // Trigger open animation and refetch stats when student changes
  useEffect(() => {
    if (student) {
      setLoading(true);
      fetchStudentStats();
      fetchStudentFeeSettings();
      setTimeout(() => setIsOpen(true), 10);
    }
    return () => setIsOpen(false);
  }, [student, tuitionId]);

  // Fetch individual fee settings for this student
  const fetchStudentFeeSettings = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get Fee settings
      const { data: feeData, error: feeErr } = await supabase
        .from('student_fees')
        .select('fee_amount, due_day')
        .eq('tuition_id', tuitionId)
        .eq('student_id', student.user_id)
        .single();

      // Get Payment status for current month
      const { data: payData, error: payErr } = await supabase
        .from('fees_payments')
        .select('status')
        .eq('tuition_id', tuitionId)
        .eq('student_id', student.user_id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();
        
      const payStatus = payData ? payData.status : 'unpaid';

      if (feeData) {
        setFeeSettings({
          fee_amount: feeData.fee_amount?.toString() || '',
          due_day: feeData.due_day?.toString() || '1',
          hasIndividualFee: true,
          status: payStatus,
        });
      } else {
        // No individual fee set, use tuition defaults
        setFeeSettings({
          fee_amount: '',
          due_day: '1',
          hasIndividualFee: false,
          status: payStatus,
        });
      }
    } catch (err) {
      // No individual fee set
    }
  };

  // Save fee settings for this student
  const handleSaveFeeSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('student_fees')
        .upsert({
          tuition_id: tuitionId,
          student_id: student.user_id,
          fee_amount: parseFloat(feeSettings.fee_amount) || 0,
          due_day: parseInt(feeSettings.due_day) || 1,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tuition_id,student_id'
        });

      if (error) throw error;
      toast.success('Fee settings saved for student');
      setIsEditingFee(false); // Close edit mode
      fetchStudentFeeSettings();
    } catch (err) {
      toast.error('Failed to save fee settings');
    } finally {
      setSaving(false);
    }
  };

  const fetchStudentStats = async () => {
    if (!student || !tuitionId) return;

    setLoading(true);
    try {
      // Get student join date from tuition_members
      const { data: memberData } = await supabase
        .from('tuition_members')
        .select('created_at')
        .eq('tuition_id', tuitionId)
        .eq('user_id', student.user_id)
        .eq('role_in_tuition', 'student')
        .single();

      const joinedDate = memberData?.created_at;

      // Get all classes for this tuition
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('tuition_id', tuitionId);

      const classes = classesData || [];
      const classIds = classes.map(c => c.id) || [];
      const totalClasses = classes.length || 0;

      // Get attendance for this student
      let classesAttended = 0;
      let totalMarked = 0;
      const recentAttendance = [];

      if (classIds.length > 0) {
        const { data: allAttendance } = await supabase
          .from('class_attendance')
          .select('class_id, status')
          .eq('student_id', student.user_id)
          .in('class_id', classIds);

        const attendanceMap = {};
        allAttendance?.forEach(a => {
          attendanceMap[a.class_id] = a.status;
        });

        classes.forEach(cls => {
          const status = attendanceMap[cls.id];
          if (status) {
            totalMarked++;
            if (status === 'present') classesAttended++;

            recentAttendance.push({
              classId: cls.id,
              title: cls.name,
              date: cls.created_at,
              status: status,
            });
          }
        });
      }

      // Attendance percentage based on marked classes only
      const attendancePercentage = totalMarked > 0
        ? Math.round((classesAttended / totalMarked) * 100)
        : 0;

      // Get quiz data
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, title, created_at')
        .eq('tuition_id', tuitionId);

      const totalQuizzes = quizzesData?.length || 0;
      const quizIds = quizzesData?.map(q => q.id) || [];

      let quizzesAttempted = 0;
      let totalScore = 0;
      let totalQuestions = 0;
      const quizScores = [];

      if (quizIds.length > 0) {
        const { data: quizAttemptsData } = await supabase
          .from('quiz_attempts')
          .select('id, quiz_id, score, total_questions, created_at')
          .eq('student_id', student.user_id)
          .in('quiz_id', quizIds)
          .order('created_at', { ascending: false });

        quizzesAttempted = quizAttemptsData?.length || 0;

        if (quizAttemptsData && quizAttemptsData.length > 0) {
          quizAttemptsData.forEach(attempt => {
            totalScore += attempt.score || 0;
            totalQuestions += attempt.total_questions || 0;

            const quiz = quizzesData.find(q => q.id === attempt.quiz_id);
            quizScores.push({
              quizId: attempt.quiz_id,
              title: quiz?.title || 'Unknown Quiz',
              score: attempt.score,
              totalQuestions: attempt.total_questions,
              percentage: Math.round((attempt.score / attempt.total_questions) * 100),
              date: attempt.created_at,
            });
          });
        }
      }

      const averageQuizScore = quizzesAttempted > 0 && totalQuestions > 0
        ? Math.round((totalScore / totalQuestions) * 100)
        : 0;

      // Get resources uploaded by this specific student
      const { count: resourcesUploaded } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('tuition_id', tuitionId)
        .eq('uploaded_by', student.user_id);

      setStudentStats({
        joinedDate,
        attendancePercentage,
        classesAttended,
        classesConducted: totalMarked,
        totalClasses,
        quizzesAttempted,
        totalQuizzes,
        averageQuizScore,
        quizScores: quizScores.slice(0, 5),
        recentAttendance: recentAttendance.slice(0, 5),
        resourcesUploaded: resourcesUploaded || 0,
        announcementsViewed: 0,
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!student) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-slate-700 font-extrabold text-2xl border border-slate-200 shrink-0">
              {student.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{student.full_name}</h2>
              <p className="text-sm text-slate-500">
                {studentStats.joinedDate
                  ? `Joined ${new Date(studentStats.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`
                  : 'Student'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Attendance Card */}
                <div className="bg-blue-50/80 rounded-3xl p-5 sm:p-6 border border-blue-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {studentStats.attendancePercentage}%
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{studentStats.classesAttended}/{studentStats.classesConducted}</p>
                  <p className="text-sm text-slate-500 mt-1">Classes Attended</p>
                </div>

                {/* Quiz Performance Card */}
                <div className="bg-purple-50/80 rounded-3xl p-5 sm:p-6 border border-purple-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-purple-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm ${
                      studentStats.averageQuizScore >= 70 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      studentStats.averageQuizScore >= 40 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {studentStats.averageQuizScore}%
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{studentStats.quizzesAttempted}/{studentStats.totalQuizzes}</p>
                  <p className="text-sm text-slate-500 mt-1">Quizzes Attempted</p>
                </div>

                {/* Resources Card */}
                <div className="bg-emerald-50/80 rounded-3xl p-5 sm:p-6 border border-emerald-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{studentStats.resourcesUploaded}</p>
                  <p className="text-sm text-slate-500 mt-1">Resources Uploaded</p>
                </div>

                {/* Total Classes Card */}
                <div className="bg-amber-50/80 rounded-3xl p-5 sm:p-6 border border-amber-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{studentStats.totalClasses}</p>
                  <p className="text-sm text-slate-500 mt-1">Total Classes</p>
                </div>
              </div>

              {/* Fee Settings Section */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Fee Settings
                    {feeSettings.hasIndividualFee && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Custom</span>
                    )}
                  </h3>
                  
                  {feeSettings.status === 'paid' ? (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Paid</span>
                  ) : feeSettings.status === 'pending' ? (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
                  ) : (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Unpaid</span>
                  )}
                </div>
                <div className="p-4">
                  {!isEditingFee ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Monthly Fee</p>
                          <p className="font-semibold text-slate-900">
                             {feeSettings.fee_amount ? `₹${feeSettings.fee_amount}` : 'Default'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Due Day</p>
                          <p className="font-semibold text-slate-900">
                             {feeSettings.due_day}
                             {[1, 21, 31].includes(Number(feeSettings.due_day)) ? 'st' : [2, 22].includes(Number(feeSettings.due_day)) ? 'nd' : [3, 23].includes(Number(feeSettings.due_day)) ? 'rd' : 'th'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingFee(true)}
                        className="w-full px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-lg hover:bg-slate-100 text-sm transition-colors"
                      >
                        Edit Fee Settings
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveFeeSettings} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Monthly Fee (₹)
                          </label>
                          <input
                            type="number"
                            value={feeSettings.fee_amount}
                            onChange={(e) => setFeeSettings({ ...feeSettings, fee_amount: e.target.value })}
                            placeholder="Leave empty for default"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Due Day
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={feeSettings.due_day}
                            onChange={(e) => setFeeSettings({ ...feeSettings, due_day: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingFee(false)}
                          className="flex-1 px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Performance Breakdown
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Attendance Rate</span>
                      <span className="font-semibold text-slate-900">{studentStats.attendancePercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${studentStats.attendancePercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Quiz Average</span>
                      <span className="font-semibold text-slate-900">{studentStats.averageQuizScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          studentStats.averageQuizScore >= 70 ? 'bg-emerald-500' :
                          studentStats.averageQuizScore >= 40 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${studentStats.averageQuizScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Attendance */}
              {studentStats.recentAttendance.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Attendance
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {studentStats.recentAttendance.map((record, index) => (
                      <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{record.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          record.status === 'present'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Results */}
              {studentStats.quizScores.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Recent Quiz Results
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {studentStats.quizScores.map((quiz, index) => (
                      <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{quiz.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(quiz.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            quiz.percentage >= 70 ? 'text-emerald-600' :
                            quiz.percentage >= 40 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {quiz.percentage}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {quiz.score}/{quiz.totalQuestions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {studentStats.recentAttendance.length === 0 && studentStats.quizScores.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No activity recorded yet</p>
                  <p className="text-sm text-slate-400 mt-1">Attendance and quiz results will appear here</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3.5 text-sm font-bold tracking-wide text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              Close
            </button>
            <button className="flex-1 px-6 py-3.5 text-sm font-bold tracking-wide text-white bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </>
  );
}