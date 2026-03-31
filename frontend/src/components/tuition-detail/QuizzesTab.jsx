import { useState, useEffect } from 'react';
import QuizBuilder from './QuizBuilder';
import QuizDetail from './QuizDetail';
import { supabase } from '../../lib/supabase';

export default function QuizzesTab({ tuitionId, isTeacher = false }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch quizzes
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('tuition_id', tuitionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);

      // If student, fetch their attempts
      if (!isTeacher && user && data) {
        const quizIds = data.map(q => q.id);
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', user.id)
          .in('quiz_id', quizIds);

        if (!attemptsError && attemptsData) {
          const attemptsMap = {};
          attemptsData.forEach(attempt => {
            attemptsMap[attempt.quiz_id] = attempt;
          });
          setAttempts(attemptsMap);
        }
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tuitionId) {
      fetchQuizzes();
    }
  }, [tuitionId]);

  const handleQuizCreated = () => {
    setShowBuilder(false);
    fetchQuizzes();
  };

  const handleViewQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleBackToList = () => {
    setSelectedQuiz(null);
    setShowBuilder(false);
    fetchQuizzes(); // Refresh attempts
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAttemptStatus = (quizId) => {
    const attempt = attempts[quizId];
    if (!attempt) return { status: 'pending', label: 'Not Started', color: 'slate' };
    const percentage = attempt.total_questions > 0
      ? Math.round((attempt.score / attempt.total_questions) * 100)
      : 0;
    return {
      status: 'completed',
      label: `${percentage}%`,
      color: percentage >= 60 ? 'emerald' : 'amber',
      score: attempt.score,
      total: attempt.total_questions,
      percentage
    };
  };

  // View: Quiz Detail
  if (selectedQuiz) {
    return (
      <QuizDetail
        quiz={selectedQuiz}
        onBack={handleBackToList}
        isTeacher={isTeacher}
      />
    );
  }

  // View: Quiz Builder
  if (showBuilder) {
    return (
      <div className="space-y-4">
        <QuizBuilder
          tuitionId={tuitionId}
          onQuizCreated={handleQuizCreated}
          onCancel={() => setShowBuilder(false)}
        />
      </div>
    );
  }

  // View: Quiz List
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">Quizzes</h3>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Quiz
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : quizzes.length === 0 ? (
          // Empty State
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-blue-200/50 rounded-full blur-2xl group-hover:bg-blue-300/50 transition-colors duration-500"></div>
              <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-slate-100 rotate-3 group-hover:-rotate-3 transition-transform duration-500">
                <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-transparent rounded-3xl pointer-events-none"></div>
                <svg className="w-10 h-10 text-blue-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2 mt-4">No Quizzes Yet</h4>
            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
              {isTeacher
                ? "Create your first quiz to test your students' knowledge. You can add multiple choice questions and track their progress."
                : "When quizzes are assigned, they will appear here. Get ready to test your knowledge!"}
            </p>
            {isTeacher && (
              <button
                onClick={() => setShowBuilder(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Quiz
              </button>
            )}
          </div>
        ) : (
          // Quiz List
          <div className="grid gap-3 p-4">
            {quizzes.map((quiz) => {
              const attemptStatus = !isTeacher ? getAttemptStatus(quiz.id) : null;

              return (
                <div
                  key={quiz.id}
                  onClick={() => handleViewQuiz(quiz)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {quiz.title}
                        </h4>
                        {!isTeacher && attemptStatus && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            attemptStatus.status === 'completed'
                              ? attemptStatus.percentage >= 60
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {attemptStatus.status === 'completed' ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                </svg>
                                {attemptStatus.label}
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {attemptStatus.label}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created {formatDate(quiz.created_at)}
                        </span>
                        {!isTeacher && attemptStatus?.status === 'completed' && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            {attemptStatus.score}/{attemptStatus.total} correct
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="p-2 w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                        <svg className="w-5 h-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats for Students */}
      {!isTeacher && !loading && quizzes.length > 0 && (
        <div className="p-6 border-t border-slate-100 bg-linear-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-600 font-medium">
              Your Quiz Progress
            </span>
            {Object.keys(attempts).length === quizzes.length && quizzes.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-xs border border-emerald-200 shadow-sm shadow-emerald-100">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All Caught Up!
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                {Object.keys(attempts).length} / {quizzes.length} completed
              </span>
            )}
          </div>
          {/* Progress Bar */}
          <div className="h-2.5 bg-slate-100 border border-slate-200 inset-shadow-sm rounded-full overflow-hidden p-0.5 flex">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                quizzes.length > 0 && Object.keys(attempts).length === quizzes.length
                  ? 'bg-linear-to-r from-emerald-400 to-emerald-500'
                  : 'bg-linear-to-r from-blue-500 to-indigo-500'
              }`}
              style={{
                width: `${quizzes.length > 0 ? (Object.keys(attempts).length / quizzes.length * 100) : 0}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
