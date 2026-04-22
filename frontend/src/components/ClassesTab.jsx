import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { classSchema } from '../schemas/class.schema';

const TOPIC_OPTIONS = ['Algebra', 'Trigonometry', 'Probability', 'Geometry', 'Statistics'];

function ClassesTab({ classes, setClasses, tuitionId, isTeacher }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      className: '',
      topics: [],
      classDate: new Date().toISOString().split('T')[0],
      summary: '',
    },
  });

  const selectedTopics = watch('topics') || [];

  const handleTopicToggle = (topic) => {
    const currentTopics = selectedTopics;
    if (currentTopics.includes(topic)) {
      setValue('topics', currentTopics.filter(t => t !== topic), { shouldValidate: true });
    } else {
      setValue('topics', [...currentTopics, topic], { shouldValidate: true });
    }
  };

  const removeTopic = (topicToRemove) => {
    setValue('topics', selectedTopics.filter(t => t !== topicToRemove), { shouldValidate: true });
  };

  const resetForm = () => {
    reset({
      className: '',
      topics: [],
      classDate: new Date().toISOString().split('T')[0],
      summary: '',
    });
    setIsTopicDropdownOpen(false);
  };

  const handleCreateClass = async (data) => {
    setSaving(true);
    const { data: classData, error } = await supabase
      .from('classes')
      .insert({
        tuition_id: tuitionId,
        name: data.className.trim(),
        topics: data.topics,
        class_date: data.classDate || null,
        summary: data.summary?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create class');
      setSaving(false);
      return;
    }

    if (classData) {
      setClasses([classData, ...classes]);
      resetForm();
      setShowModal(false);
      toast.success('Class created successfully');
      navigate(`class/${classData.id}`);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Classes Header with Create Button - Teacher Only */}
      {isTeacher && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 hidden sm:flex">
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classes</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Manage scheduled classes & lessons</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-sm font-bold tracking-wide rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Class
          </button>
        </div>
      )}

      {/* Classes List */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {!isTeacher && (
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classes</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">View your upcoming and past classes</p>
            </div>
          </div>
        )}
        {classes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-base font-medium text-slate-900 mb-1">No classes yet</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {isTeacher
                ? "Get started by creating your first class to track topics and attendance."
                : "No classes have been scheduled for this tuition yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classes.map(cls => (
              <div
                key={cls.id}
                onClick={() => navigate(`class/${cls.id}`)}
                className="group p-6 cursor-pointer hover:bg-slate-50/80 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{cls.name}</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cls.topics && cls.topics.map(topic => (
                      <span
                        key={topic}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100/50"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal - Teacher Only */}
      {isTeacher && showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Create New Class</h3>
              <button
                onClick={() => { resetForm(); setShowModal(false); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateClass)} className="p-6 space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Title</label>
                <input
                  type="text"
                  {...register('className')}
                  placeholder="e.g., Chapter 1: Introduction to Algebra"
                  className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm placeholder:text-slate-400 ${errors.className
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  aria-invalid={errors.className ? "true" : "false"}
                />
                {errors.className && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.className.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Topics Covered</label>

                {/* Selected Topics Pills */}
                {selectedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTopics.map(topic => (
                      <span
                        key={topic}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200/60 shadow-sm animate-in zoom-in duration-200"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200/50 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <span>{selectedTopics.length === 0 ? "Select topics..." : "Add more topics..."}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTopicDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isTopicDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                      {TOPIC_OPTIONS.filter(t => !selectedTopics.includes(t)).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">All topics added</div>
                      ) : (
                        TOPIC_OPTIONS.filter(t => !selectedTopics.includes(t)).map(topic => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => handleTopicToggle(topic)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between group"
                          >
                            {topic}
                            <span className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs font-semibold">Add</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.topics && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.topics.message}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Class</label>
                  <input
                    type="date"
                    {...register('classDate')}
                    className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${errors.classDate
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    aria-invalid={errors.classDate ? "true" : "false"}
                  />
                  {errors.classDate && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errors.classDate.message}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Summary (Optional)</label>
                <textarea
                  {...register('summary')}
                  placeholder="What will be covered in this class?"
                  rows={3}
                  className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm resize-none placeholder:text-slate-400 ${errors.summary
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  aria-invalid={errors.summary ? "true" : "false"}
                />
                {errors.summary && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.summary.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowModal(false); }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin -ml-1 mr-2 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {saving ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassesTab;
