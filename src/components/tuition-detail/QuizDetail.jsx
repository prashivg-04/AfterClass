import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import QuizAttempt from './QuizAttempt';
import QuizResult from './QuizResult';
import QuizAnalytics from './QuizAnalytics';

export default function QuizDetail({ quiz, onBack, isTeacher = false }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingAttempt, setExistingAttempt] = useState(null);
  const [showAttempt, setShowAttempt] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch questions with their options
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            options (
              id,
              option_text,
              is_correct
            )
          `)
          .eq('quiz_id', quiz.id)
          .order('id', { ascending: true });

        if (questionsError) throw questionsError;

        // Sort options for each question
        const sortedQuestions = (questionsData || []).map(q => ({
          ...q,
          options: q.options?.sort((a, b) => a.id.localeCompare(b.id)) || []
        }));

        setQuestions(sortedQuestions);

        // If student, check for existing attempt
        if (!isTeacher && user) {
          const { data: attemptData, error: attemptError } = await supabase
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
            .eq('student_id', user.id)
            .single();

          if (attemptError && attemptError.code !== 'PGRST116') {
            throw attemptError;
          }

          if (attemptData) {
            setExistingAttempt(attemptData);
          }
        }
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [quiz.id, isTeacher]);

  const handleAttemptComplete = (attemptData) => {
    setExistingAttempt(attemptData);
    setShowAttempt(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show QuizAnalytics for teachers
  if (showAnalytics && isTeacher) {
    return (
      <QuizAnalytics
        quiz={quiz}
        questions={questions}
        onBack={() => setShowAnalytics(false)}
      />
    );
  }

  // Show QuizAttempt component for students who want to attempt
  if (showAttempt && !isTeacher && !existingAttempt) {
    return (
      <QuizAttempt
        quiz={quiz}
        questions={questions}
        onBack={() => setShowAttempt(false)}
        onComplete={handleAttemptComplete}
      />
    );
  }

  // Show QuizResult if student has already attempted
  if (existingAttempt && !isTeacher) {
    return (
      <QuizResult
        quiz={quiz}
        attempt={existingAttempt}
        questions={questions}
        onBack={onBack}
      />
    );
  }

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
            Back to Quizzes
          </button>
          {isTeacher ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium text-xs border border-slate-200 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Teacher View
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium text-xs border border-blue-100 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Student View
            </span>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-slate-600 mb-4">{quiz.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {formatDate(quiz.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {questions.length} questions
            </span>
          </div>
        </div>
      </div>

      {/* Teacher Analytics Button */}
      {isTeacher && (
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl"></div>
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">View Student Performance</h3>
              <p className="text-indigo-100 max-w-md text-sm leading-relaxed">
                See who has attempted the quiz, their scores, and detailed analytics for your class.
              </p>
            </div>
            <button
              onClick={() => setShowAnalytics(true)}
              className="px-8 py-3.5 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 shrink-0 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </button>
          </div>
        </div>
      )}

      {/* Start Attempt Button for Students */}
      {!isTeacher && (
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl"></div>
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to test your knowledge?</h3>
              <p className="text-blue-100 max-w-md text-sm leading-relaxed">
                You can attempt this quiz once. Make sure you have a stable connection and are prepared before starting!
              </p>
            </div>
            <button
              onClick={() => setShowAttempt(true)}
              className="px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 shrink-0 flex items-center gap-2"
            >
              Start Quiz Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Questions Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">
          {isTeacher ? 'Questions Preview' : 'Questions Preview'}
        </h3>
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-100 transition-all duration-300"
          >
            <div className="p-5 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-lg leading-relaxed pt-1">
                  {question.question_text}
                </h4>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                      isTeacher && option.is_correct
                        ? 'bg-emerald-50/50 border-emerald-200 inset-shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border shadow-xs ${
                      isTeacher && option.is_correct
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <span className={`flex-1 ${
                      isTeacher && option.is_correct
                        ? 'text-emerald-900 font-medium'
                        : 'text-slate-700'
                    }`}>
                      {option.option_text}
                    </span>
                    {isTeacher && option.is_correct && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
