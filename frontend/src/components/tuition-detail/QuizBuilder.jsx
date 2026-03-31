import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function QuizBuilder({ tuitionId, onQuizCreated, onCancel }) {
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const addQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id) => {
    if (questions.length === 1) {
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
    // Clear validation errors for removed question
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const updateQuestionText = (id, text) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, questionText: text } : q
      )
    );
    // Clear validation error when user types
    if (validationErrors[id]?.question) {
      setValidationErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], question: null },
      }));
    }
  };

  const updateOption = (questionId, optionIndex, text) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = text;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
    // Clear validation error when user types
    if (validationErrors[questionId]?.options) {
      setValidationErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], options: null },
      }));
    }
  };

  const updateCorrectAnswer = (questionId, optionIndex) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: optionIndex } : q
      )
    );
  };

  const validateQuiz = () => {
    const errors = {};
    let hasError = false;

    if (!quizTitle.trim()) {
      setError('Quiz title is required');
      hasError = true;
    }

    questions.forEach((q) => {
      const qErrors = {};

      // Check question text
      if (!q.questionText.trim()) {
        qErrors.question = 'Question text is required';
        hasError = true;
      }

      // Check for empty options
      const emptyOptions = q.options.some((opt) => !opt.trim());
      if (emptyOptions) {
        qErrors.options = 'All options must have text';
        hasError = true;
      }

      // Check for duplicate options (case-insensitive, trimmed)
      const trimmedOptions = q.options.map((opt) => opt.trim().toLowerCase());
      const uniqueOptions = new Set(trimmedOptions);
      if (uniqueOptions.size !== trimmedOptions.length) {
        qErrors.duplicates = 'All options must be unique';
        hasError = true;
      }

      if (Object.keys(qErrors).length > 0) {
        errors[q.id] = qErrors;
      }
    });

    setValidationErrors(errors);
    return !hasError;
  };

  const handleCreateQuiz = async () => {
    // Validation
    if (!validateQuiz()) {
      setError('Please fix the errors above');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // 1. Insert quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizTitle.trim(),
          description: quizDescription.trim() || null,
          tuition_id: tuitionId,
          created_by: user.id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // 2. Insert questions and options
      for (const question of questions) {
        // Insert question
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizData.id,
            question_text: question.questionText.trim(),
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Insert options for this question
        const optionsToInsert = question.options.map((opt, idx) => ({
          question_id: questionData.id,
          option_text: opt.trim(),
          is_correct: idx === question.correctAnswer,
        }));

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Reset form
      setQuizTitle('');
      setQuizDescription('');
      setQuestions([
        {
          id: 1,
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
        },
      ]);
      setValidationErrors({});

      // Notify parent
      if (onQuizCreated) {
        onQuizCreated(quizData);
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err.message || 'Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getQuestionStatus = (question) => {
    const trimmedOptions = question.options.map((opt) => opt.trim().toLowerCase());
    const uniqueOptions = new Set(trimmedOptions);

    if (!question.questionText.trim()) return 'error';
    if (question.options.some((opt) => !opt.trim())) return 'error';
    if (uniqueOptions.size !== trimmedOptions.length) return 'error';
    return 'valid';
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8 relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-blue-500 to-indigo-500"></div>
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Create New Quiz</h3>
              <p className="text-sm text-slate-500 mt-0.5">Configure questions and answers for your students</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-slate-50/30">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Quiz Title */}
          <div className="space-y-2">
            <label htmlFor="quizTitle" className="block text-sm font-bold text-slate-700">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="quizTitle"
              value={quizTitle}
              onChange={(e) => {
                setQuizTitle(e.target.value);
                if (error && e.target.value.trim()) setError(null);
              }}
              placeholder="e.g. Midterm Physics Assessment"
              disabled={saving}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Quiz Description */}
          <div className="space-y-2">
            <label htmlFor="quizDescription" className="block text-sm font-bold text-slate-700">
              Description <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </label>
            <textarea
              id="quizDescription"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="What will this quiz cover?"
              rows={3}
              disabled={saving}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h4 className="text-xl font-bold text-slate-900">Questions</h4>
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold shadow-inner">
            {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
          </div>
        </div>

        {questions.map((question, index) => {
          const status = getQuestionStatus(question);
            const qErrors = validationErrors[question.id] || {};

            return (
              <div
                key={question.id}
                className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all duration-300 ${
                  status === 'valid' ? 'border-slate-200' : 'border-red-300'
                }`}
              >
                <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
                  status === 'valid' ? 'bg-slate-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                      status === 'valid' ? 'bg-white text-blue-600 border border-blue-100' : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className={`font-bold block ${
                        status === 'valid' ? 'text-slate-800' : 'text-red-800'
                      }`}>Question {index + 1}</span>
                      {status === 'valid' && (
                        <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(question.id)}
                      disabled={saving}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="Remove Question"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                {/* Question Text */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Question Content <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => updateQuestionText(question.id, e.target.value)}
                    placeholder="Enter the question here..."
                    rows={2}
                    disabled={saving}
                    className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-inner disabled:bg-slate-50 disabled:text-slate-500 ${
                      qErrors.question ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                    }`}
                  />
                  {qErrors.question && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {qErrors.question}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">
                      Answer Options
                    </label>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                      Select Correct Answer
                    </span>
                  </div>

                  {qErrors.options && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mb-2">
                       <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {qErrors.options}
                    </p>
                  )}
                  {qErrors.duplicates && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mb-2">
                       <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {qErrors.duplicates}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((option, optionIndex) => {
                      const trimmedValue = option.trim().toLowerCase();
                      const duplicateIndices = question.options
                        .map((o, i) => ({ val: o.trim().toLowerCase(), idx: i }))
                        .filter((o) => o.val && o.val === trimmedValue)
                        .map((o) => o.idx);
                      const isDuplicate = trimmedValue && duplicateIndices.length > 1;
                      const isCorrect = question.correctAnswer === optionIndex;

                      return (
                        <div 
                          key={optionIndex} 
                          className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 ${
                            isCorrect 
                              ? 'border-emerald-500 bg-emerald-50/40 shadow-sm shadow-emerald-500/10' 
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer pl-2">
                            <div className="relative flex items-center justify-center shrink-0">
                              <input
                                type="radio"
                                name={`correct-answer-${question.id}`}
                                checked={isCorrect}
                                onChange={() => updateCorrectAnswer(question.id, optionIndex)}
                                disabled={saving}
                                className="sr-only" /* Hide default radio, use custom */
                              />
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white group-hover:border-emerald-400'
                              }`}>
                                {isCorrect && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                          </label>
                          <div className="flex-1 flex gap-2 w-full mt-2 sm:mt-0">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              disabled={saving}
                              className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:bg-slate-50 disabled:text-slate-500 w-full ${
                                isDuplicate ? 'border-red-300 bg-red-50' : isCorrect ? 'border-emerald-200 bg-white' : 'border-slate-200'
                              }`}
                            />
                            {isDuplicate && (
                              <div className="shrink-0 flex items-center pr-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          disabled={saving}
          className="w-full py-5 border-2 border-dashed border-slate-300/80 rounded-3xl text-slate-600 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="bg-white p-1 rounded-full shadow-sm group-hover:shadow-md transition-shadow">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Add Another Question
        </button>
      </div>

      {/* Create Quiz Action Footer */}
      <div className="sticky bottom-6 z-10 pt-4">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-10 px-4 bg-slate-100/80 rounded-xl flex items-center gap-2 font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${questions.filter(q => getQuestionStatus(q) === 'valid').length === questions.length ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {questions.filter(q => getQuestionStatus(q) === 'valid').length} / {questions.length} Ready
            </div>
          </div>
          <button
            onClick={handleCreateQuiz}
            disabled={saving || questions.filter(q => getQuestionStatus(q) === 'valid').length !== questions.length}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 disabled:shadow-none"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Quiz...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Publish Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
