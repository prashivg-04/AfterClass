import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function QuizAnalytics({ quiz, questions, onBack }) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [quiz.id, quiz.tuition_id]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setError('User not authenticated');
        return;
      }

      // Get tuition members (students)
      const { data: membersData, error: membersError } = await supabase
        .from('tuition_members')
        .select('user_id')
        .eq('tuition_id', quiz.tuition_id)
        .eq('role_in_tuition', 'student');

      if (membersError) throw membersError;

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);

        // Get student profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = {};
        if (profilesData) {
          profilesData.forEach(p => {
            profileMap[p.id] = p.full_name;
          });
        }

        const studentsWithNames = membersData.map(m => ({
          id: m.user_id,
          full_name: profileMap[m.user_id] || 'Unknown Student'
        }));

        setStudents(studentsWithNames);

        // Fetch attempts for this quiz
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            answers (
              *,
              question:question_id (
                question_text,
                options (*)
              ),
              selected_option:selected_option_id (*)
            )
          `)
          .eq('quiz_id', quiz.id)
          .in('student_id', userIds);

        if (attemptsError) throw attemptsError;
        setAttempts(attemptsData || []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load. Please try again later.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptForStudent = (studentId) => {
    return attempts.find(a => a.student_id === studentId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate class statistics
  const attemptedCount = attempts.length;
  const totalStudents = students.length;
  const notAttemptedCount = totalStudents - attemptedCount;
  const averageScore = attemptedCount > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.score / a.total_questions * 100), 0) / attemptedCount)
    : 0;
  const passCount = attempts.filter(a => (a.score / a.total_questions * 100) >= 60).length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="text-blue-600 hover:underline font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Quiz
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium text-xs border border-indigo-200 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h2>
          <p className="text-slate-600">Student Performance Overview</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <div className="text-sm text-slate-500">Total Students</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{attemptedCount}</div>
          <div className="text-sm text-slate-500">Attempted</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-amber-600">{notAttemptedCount}</div>
          <div className="text-sm text-slate-500">Pending</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{averageScore}%</div>
          <div className="text-sm text-slate-500">Avg Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Completion Rate</h3>
          <span className="text-sm font-medium text-slate-600">
            {Math.round((attemptedCount / totalStudents) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${totalStudents > 0 ? (attemptedCount / totalStudents * 100) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
          <span>{attemptedCount} completed</span>
          <span>{notAttemptedCount} remaining</span>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Pass Rate (60%+)</h3>
          <span className="text-sm font-medium text-slate-600">
            {attemptedCount > 0 ? Math.round((passCount / attemptedCount) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${attemptedCount > 0 ? (passCount / attemptedCount * 100) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
          <span>{passCount} passed</span>
          <span>{attemptedCount - passCount} failed</span>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Student Results</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {students.length} students
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No students enrolled in this tuition.
            </div>
          ) : (
            students.map((student) => {
              const attempt = getAttemptForStudent(student.id);
              const hasAttempted = !!attempt;
              const percentage = hasAttempted
                ? Math.round((attempt.score / attempt.total_questions) * 100)
                : 0;
              const passed = percentage >= 60;

              return (
                <div
                  key={student.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        hasAttempted
                          ? passed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{student.full_name}</h4>
                        {hasAttempted ? (
                          <p className="text-sm text-slate-500">
                            Submitted {formatDate(attempt.created_at)}
                          </p>
                        ) : (
                          <p className="text-sm text-amber-600">Not attempted yet</p>
                        )}
                      </div>
                    </div>

                    {hasAttempted ? (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          passed ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {percentage}%
                        </div>
                        <div className="text-sm text-slate-500">
                          {attempt.score}/{attempt.total_questions} correct
                        </div>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-sm font-medium rounded-full border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>

                  {hasAttempted && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedStudent(attempt)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentAttemptModal
          attempt={selectedStudent}
          studentName={students.find(s => s.id === selectedStudent.student_id)?.full_name}
          questions={questions}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

// Modal to show individual student attempt details
function StudentAttemptModal({ attempt, studentName, questions, onClose }) {
  const getAnswerForQuestion = (questionId) => {
    return attempt.answers?.find(a => a.question_id === questionId);
  };

  const score = attempt.score || 0;
  const total = attempt.total_questions || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{studentName}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Quiz Attempt Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Score Summary */}
          <div className={`rounded-2xl p-6 mb-6 ${
            percentage >= 60
              ? 'bg-emerald-50 border-2 border-emerald-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Final Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${
                    percentage >= 60 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {percentage}%
                  </span>
                  <span className="text-slate-500">
                    ({score}/{total} correct)
                  </span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                percentage >= 60 ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {percentage >= 60 ? (
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Questions Review */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 mb-4">Answer Breakdown</h4>
            {questions.map((question, index) => {
              const answer = getAnswerForQuestion(question.id);
              const isCorrect = answer?.is_correct;
              const selectedOptionId = answer?.selected_option_id;

              return (
                <div
                  key={question.id}
                  className={`border-2 rounded-xl p-4 ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {index + 1}
                    </div>
                    <h5 className="font-medium text-slate-900">{question.question_text}</h5>
                    {isCorrect ? (
                      <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        Correct
                      </span>
                    ) : (
                      <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        Wrong
                      </span>
                    )}
                  </div>

                  <div className="ml-10 space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isSelected = selectedOptionId === option.id;
                      const isCorrectOption = option.is_correct;

                      if (!isSelected && !isCorrectOption) return null;

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 text-sm ${
                            isSelected && isCorrect
                              ? 'text-emerald-700'
                              : isSelected && !isCorrect
                              ? 'text-red-700'
                              : 'text-emerald-600'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + optIndex)}.</span>
                          <span>{option.option_text}</span>
                          {isSelected && (
                            <span className="ml-auto text-xs">
                              {isCorrect ? '(Selected ✓)' : '(Selected ✗)'}
                            </span>
                          )}
                          {!isSelected && isCorrectOption && (
                            <span className="ml-auto text-xs">(Correct)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
