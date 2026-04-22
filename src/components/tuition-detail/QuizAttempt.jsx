import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function QuizAttempt({ quiz, questions, onBack, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedOptions).length;
  const progress = ((answeredCount / totalQuestions) * 100).toFixed(0);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle browser back/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (answeredCount > 0 && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answeredCount, submitting]);

  const handleSelectOption = (questionId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleExitClick = () => {
    if (answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate score
      let correctCount = 0;
      const answersToInsert = [];

      for (const question of questions) {
        const selectedOptionId = selectedOptions[question.id];
        if (selectedOptionId) {
          const selectedOption = question.options.find(
            (opt) => opt.id === selectedOptionId
          );
          const isCorrect = selectedOption?.is_correct || false;

          if (isCorrect) {
            correctCount++;
          }

          answersToInsert.push({
            question_id: question.id,
            selected_option_id: selectedOptionId,
            is_correct: isCorrect,
          });
        }
      }

      // 1. Create quiz attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          student_id: user.id,
          score: correctCount,
          total_questions: totalQuestions,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // 2. Insert answers
      if (answersToInsert.length > 0) {
        const answersWithAttemptId = answersToInsert.map((ans) => ({
          ...ans,
          attempt_id: attemptData.id,
        }));

        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersWithAttemptId);

        if (answersError) throw answersError;
      }

      // 3. Fetch complete attempt data with answers for the result view
      const { data: completeAttempt, error: fetchError } = await supabase
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
        .eq('id', attemptData.id)
        .single();

      if (fetchError) throw fetchError;

      // Notify parent
      if (onComplete) {
        onComplete(completeAttempt);
      }
    } catch (err) {
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const getQuestionStatus = (index) => {
    const questionId = questions[index]?.id;
    if (selectedOptions[questionId]) {
      return 'answered';
    }
    return 'unanswered';
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Exit Confirmation Dialog
  if (showExitConfirm) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowExitConfirm(false)} />
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Exit Quiz?
          </h4>
          <p className="text-slate-500 text-center mb-8 leading-relaxed">
            Your progress will be lost. You answered <span className="font-bold text-slate-900">{answeredCount}</span> out of <span className="font-bold text-slate-900">{totalQuestions}</span> questions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors"
            >
              Continue Quiz
            </button>
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-lg"
            >
              Exit Without Saving
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmSubmit) {
    const unansweredCount = totalQuestions - answeredCount;

    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowConfirmSubmit(false)} />
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-[0.98] fade-in duration-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            {unansweredCount === 0 ? (
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h4 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Submit Quiz?
          </h4>
          <p className="text-slate-500 text-center mb-6 leading-relaxed">
            {unansweredCount === 0 
              ? "You've answered all questions. Are you ready to submit and see your results?"
              : `You still have ${unansweredCount} unanswered question(s).`}
          </p>

          <div className="flex justify-center gap-6 mb-8 text-center bg-slate-50 rounded-2xl p-4">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{answeredCount}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Answered</div>
            </div>
            {unansweredCount > 0 && (
              <div>
                <div className="text-2xl font-bold text-amber-600">{unansweredCount}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Left</div>
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Time Spent</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting
                </>
              ) : (
                "Yes, Submit"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="p-5 border-b border-slate-100 bg-linear-to-r from-blue-50/40 to-indigo-50/40 flex items-center justify-between">
          <button
            onClick={handleExitClick}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Quiz
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(elapsedTime)}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">{quiz.title}</h2>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">
                <span className="font-bold text-slate-900">{answeredCount}</span> of{' '}
                <span className="font-bold text-slate-900">{totalQuestions}</span> answered
              </span>
              <span className="font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 border border-slate-200 inset-shadow-sm rounded-full overflow-hidden p-0.5 flex">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                  progress === 100
                    ? 'bg-linear-to-r from-emerald-400 to-emerald-500'
                    : 'bg-linear-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-slate-900 mr-2 uppercase tracking-wider">Navigate</span>
          {questions.map((q, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => jumpToQuestion(index)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110 shadow-sm z-10'
                    : status === 'answered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={status === 'answered' ? 'Answered' : 'Not answered'}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-5 mt-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded-sm"></div>
            <span>Not answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>Current</span>
          </div>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div key={currentQuestionIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                <span className="text-base font-bold text-blue-600">{currentQuestionIndex + 1}</span>
              </div>
              <h3 className="font-bold text-slate-900 leading-relaxed text-xl sm:text-2xl pt-1">
                {currentQuestion.question_text}
              </h3>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white max-w-4xl">
            <div className="space-y-4">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = selectedOptions[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                    className={`group w-full flex items-center gap-5 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-blue-600 bg-linear-to-r from-blue-50/50 to-indigo-50/50 shadow-xs shadow-blue-500/10'
                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold border-2 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'bg-white border-slate-200 text-slate-500 group-hover:border-blue-300 group-hover:text-blue-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <span className={`flex-1 text-base sm:text-lg transition-colors ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700 group-hover:text-slate-900 font-medium'}`}>
                      {option.option_text}
                    </span>
                    {isSelected && (
                      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center animate-in zoom-in slide-in-from-left-2 duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
