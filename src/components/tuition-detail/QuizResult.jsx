import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function QuizResult({ quiz, attempt, questions, onBack }) {
  const [showingReview, setShowingReview] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const score = attempt.score || 0;
  const totalQuestions = attempt.total_questions || questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Show confetti animation for good scores
  useEffect(() => {
    if (percentage >= 60) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentage]);

  // Determine performance level
  const getPerformanceLevel = (pct) => {
    if (pct >= 90) return { label: 'Excellent!', color: 'emerald', icon: '🏆', message: 'Outstanding performance!' };
    if (pct >= 80) return { label: 'Great Job!', color: 'blue', icon: '⭐', message: 'Well done!' };
    if (pct >= 70) return { label: 'Good Effort!', color: 'cyan', icon: '👍', message: 'Keep it up!' };
    if (pct >= 60) return { label: 'Passed!', color: 'amber', icon: '✅', message: 'You passed!' };
    return { label: 'Keep Practicing!', color: 'orange', icon: '📚', message: 'Don\'t give up!' };
  };

  const performance = getPerformanceLevel(percentage);

  // Get answer for a specific question
  const getAnswerForQuestion = (questionId) => {
    return attempt.answers?.find(a => a.question_id === questionId);
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

  // Simple confetti component
  const Confetti = () => {
    if (!showConfetti) return null;
    const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-400'];
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 ${colors[i % colors.length]} rounded`}
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              animation: `fall ${2 + Math.random() * 2}s linear forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  };

  if (showingReview) {
    return (
      <div className="space-y-6">
        <Confetti />
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => setShowingReview(false)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Summary
            </button>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Review Mode
            </span>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
            <p className="text-slate-600 mt-1">Review your answers</p>
          </div>
        </div>

        {/* Review Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => {
            const answer = getAnswerForQuestion(question.id);
            const selectedOptionId = answer?.selected_option_id;
            const isCorrect = answer?.is_correct;

            return (
              <div
                key={question.id}
                className={`bg-white rounded-2xl border-2 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${
                  isCorrect ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <div
                  className={`p-5 sm:p-6 border-b ${
                    isCorrect ? 'bg-linear-to-r from-emerald-50/80 to-emerald-100/30 border-emerald-100' : 'bg-linear-to-r from-red-50/80 to-red-100/30 border-red-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        isCorrect ? 'bg-emerald-100 border border-emerald-200' : 'bg-red-100 border border-red-200'
                      }`}
                    >
                      <span
                        className={`text-base font-bold ${
                          isCorrect ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 pt-1.5">
                      <h4 className="font-bold text-slate-900 leading-relaxed text-lg">
                        {question.question_text}
                      </h4>
                      <div className="flex items-center gap-2 mt-3">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-200 shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Incorrect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedOptionId === option.id;
                      const isCorrectOption = option.is_correct;

                      let optionClass = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isSelected && isCorrect) {
                        optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'bg-red-50 border-red-300 text-red-900';
                      } else if (isCorrectOption) {
                        optionClass = 'bg-emerald-50/50 border-emerald-200 text-emerald-800';
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${optionClass}`}
                        >
                          <div
                            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                              isSelected && isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                : isSelected && !isCorrect
                                ? 'bg-red-600 text-white border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                : isCorrectOption
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <span className="flex-1 text-lg font-medium">{option.option_text}</span>
                          {isSelected && isCorrect && (
                            <svg
                              className="w-6 h-6 text-emerald-600 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isSelected && !isCorrect && (
                            <svg
                              className="w-6 h-6 text-red-600 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {!isSelected && isCorrectOption && (
                            <span className="px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full text-xs text-emerald-700 font-bold tracking-tight shadow-sm">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="sticky bottom-6 z-10">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-lg">
            <button
              onClick={() => setShowingReview(false)}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Back to Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Confetti />
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
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h2>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(attempt.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className={`bg-white rounded-3xl border-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${
        percentage >= 60 ? 'border-emerald-200' : 'border-orange-200'
      }`}>
        <div className={`p-8 sm:p-12 text-center relative ${percentage >= 60 ? 'bg-linear-to-b from-emerald-50/80 to-white' : 'bg-linear-to-b from-orange-50/80 to-white'}`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-4 transform hover:scale-110 transition-transform duration-300 cursor-default inline-block">{performance.icon}</div>

            <h3 className={`text-2xl font-bold mb-2 ${
              percentage >= 60 ? 'text-emerald-700' : 'text-orange-700'
            }`}>
              {performance.label}
            </h3>
            <p className="text-slate-500 mb-8">{performance.message}</p>

            {/* Circular Progress */}
            <div className="w-40 h-40 mx-auto mb-10 relative">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={percentage >= 60 ? '#d1fae5' : '#ffedd5'}
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={percentage >= 60 ? '#10b981' : '#f97316'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.83} 283`}
                  className="transition-all duration-1500 ease-out"
                  style={{ strokeDashoffset: showConfetti ? 0 : 283 }} /* Just to trigger animation if wanted, typically tailwind handles */
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-start">
                  <span className={`text-5xl font-black ${percentage >= 60 ? 'text-emerald-600' : 'text-orange-600'}`}>{percentage}</span>
                  <span className={`text-2xl font-bold mt-1 ${percentage >= 60 ? 'text-emerald-400' : 'text-orange-400'}`}>%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-md mx-auto">
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-emerald-600 font-bold text-2xl mb-1">{score}</div>
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Correct</div>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-rose-600 font-bold text-2xl mb-1">{totalQuestions - score}</div>
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Incorrect</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Badge */}
      <div className={`rounded-2xl border-2 p-5 sm:p-6 flex items-center gap-4 ${
        percentage >= 60
          ? 'bg-linear-to-r from-emerald-50/50 to-white border-emerald-100/50 shadow-sm shadow-emerald-500/5'
          : 'bg-linear-to-r from-amber-50/50 to-white border-amber-100/50 shadow-sm shadow-amber-500/5'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          percentage >= 60 ? 'bg-emerald-100' : 'bg-amber-100'
        }`}>
          <svg className={`w-6 h-6 ${percentage >= 60 ? 'text-emerald-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <h4 className={`text-lg font-bold ${percentage >= 60 ? 'text-emerald-900' : 'text-amber-900'}`}>
            {percentage >= 60 ? 'Quiz Passed!' : 'Keep Learning!'}
          </h4>
          <p className={`text-sm mt-0.5 font-medium ${percentage >= 60 ? 'text-emerald-700/80' : 'text-amber-700/80'}`}>
            {percentage >= 60
              ? `You scored ${percentage}% and successfully completed this quiz.`
              : `You need 60% to pass. You scored ${percentage}%. Review your answers below to improve.`}
          </p>
        </div>
      </div>

      {/* Review Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Review Your Answers</h4>
            <p className="text-sm text-slate-600">See which questions you got right or wrong</p>
          </div>
          <button
            onClick={() => setShowingReview(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
