import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { doubtSchema, replySchema } from '../../schemas/doubt.schema';

export function ClassDoubtsTab({ classId, isTeacher }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doubtToDelete, setDoubtToDelete] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const {
    register: registerDoubt,
    handleSubmit: handleDoubtSubmit,
    reset: resetDoubt,
    formState: { errors: doubtErrors },
  } = useForm({
    resolver: zodResolver(doubtSchema),
    defaultValues: {
      question: '',
    },
  });

  const {
    register: registerReply,
    handleSubmit: handleReplySubmit,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: {
      teacher_reply: '',
    },
  });

  useEffect(() => {
    fetchDoubts();
  }, [classId]);

  const fetchDoubts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data, error } = await supabase
      .from('doubts')
      .select(`
        *,
        student_profile:profiles(full_name)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doubts:', error);
      toast.error('Failed to load doubts');
    } else {
      setDoubts(data || []);
    }
    setLoading(false);
  };

  const handleAskDoubt = async (data) => {
    if (!currentUser) return;

    setSaving(true);
    const { error } = await supabase
      .from('doubts')
      .insert({
        class_id: classId,
        student_id: currentUser.id,
        question: data.question.trim(),
      });

    if (error) {
      toast.error('Failed to post your question');
      setSaving(false);
      return;
    }

    toast.success('Question posted successfully');
    resetDoubt({ question: '' });
    fetchDoubts();
    setSaving(false);
  };

  const handleDeleteDoubt = async () => {
    if (!doubtToDelete) return;

    setDeletingId(doubtToDelete.id);

    const { error } = await supabase
      .from('doubts')
      .delete()
      .eq('id', doubtToDelete.id);

    if (error) {
      toast.error('Failed to delete question');
    } else {
      toast.success('Question deleted');
      setDoubts(doubts.filter(d => d.id !== doubtToDelete.id));
    }

    setShowDeleteModal(false);
    setDoubtToDelete(null);
    setDeletingId(null);
  };

  const openDeleteModal = (doubt) => {
    setDoubtToDelete(doubt);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDoubtToDelete(null);
  };

  const handleReply = async (data) => {
    if (!replyingTo) return;

    setSaving(true);
    const { error } = await supabase
      .from('doubts')
      .update({
        teacher_reply: data.teacher_reply.trim(),
        answered_at: new Date().toISOString(),
      })
      .eq('id', replyingTo.id);

    if (error) {
      toast.error('Failed to post reply');
      setSaving(false);
      return;
    }

    toast.success('Reply posted successfully');
    resetReply({ teacher_reply: '' });
    setReplyingTo(null);
    fetchDoubts();
    setSaving(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Student: Ask a doubt */}
      {!isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Ask a Doubt</h3>
          </div>

          <div className="p-6">
            <form onSubmit={handleDoubtSubmit(handleAskDoubt)} className="space-y-4">
              <div>
                <textarea
                  {...registerDoubt('question')}
                  placeholder="What's your question about this class?"
                  rows={4}
                  className={`w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm resize-none placeholder:text-slate-400 ${doubtErrors.question
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  aria-invalid={doubtErrors.question ? "true" : "false"}
                />
                {doubtErrors.question && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{doubtErrors.question.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400 font-medium">Keep it concise and clear</div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && (
                    <svg className="animate-spin -ml-1 mr-2 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher: Reply form */}
      {isTeacher && replyingTo && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Reply to Question</h3>
            </div>
            <button
              onClick={() => { setReplyingTo(null); resetReply({ teacher_reply: '' }); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 bg-blue-50/50 border-b border-blue-100">
            <p className="text-sm text-slate-600 italic">"{replyingTo.question}"</p>
            <p className="text-xs text-slate-500 mt-2">
              - {replyingTo.student_profile?.full_name || 'Student'}
            </p>
          </div>

          <form onSubmit={handleReplySubmit(handleReply)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Your Reply</label>
              <textarea
                {...registerReply('teacher_reply')}
                placeholder="Write your answer here..."
                rows={4}
                className={`w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-sm resize-none placeholder:text-slate-400 ${replyErrors.teacher_reply
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                aria-invalid={replyErrors.teacher_reply ? "true" : "false"}
              />
              {replyErrors.teacher_reply && (
                <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{replyErrors.teacher_reply.message}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setReplyingTo(null); resetReply({ teacher_reply: '' }); }}
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
                Post Reply
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doubts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">
            {isTeacher ? 'Student Doubts' : 'My Questions'}
          </h3>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : doubts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">No doubts yet</h4>
            <p className="text-sm text-slate-500 max-w-sm">
              {isTeacher
                ? "Students haven't posted any questions for this class yet."
                : "You haven't asked any questions for this class yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doubts.map((doubt) => (
              <div key={doubt.id} className="p-6">
                {/* Question */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100 shrink-0">
                      {doubt.student_profile?.full_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {doubt.student_profile?.full_name || 'Student'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(doubt.created_at)}</p>
                    </div>
                  </div>

                  {/* Delete button - only student who created the doubt */}
                  {!isTeacher && doubt.student_id === currentUser?.id && (
                    <button
                      onClick={() => openDeleteModal(doubt)}
                      disabled={deletingId === doubt.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete question"
                    >
                      {deletingId === doubt.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                <div className="pl-0 mb-4">
                  <p className="text-base text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {doubt.question}
                  </p>
                </div>

                {/* Teacher Reply */}
                {doubt.teacher_reply && (
                  <div className="ml-4 pl-4 border-l-4 border-blue-200 bg-blue-50/50 rounded-r-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                        T
                      </div>
                      <span className="text-xs font-semibold text-blue-800">Teacher's Reply</span>
                      {doubt.answered_at && (
                        <span className="text-xs text-blue-500">• {formatDate(doubt.answered_at)}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {doubt.teacher_reply}
                    </p>
                  </div>
                )}

                {/* Teacher: Reply button if not yet answered */}
                {isTeacher && !doubt.teacher_reply && !replyingTo && (
                  <button
                    onClick={() => setReplyingTo(doubt)}
                    className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                )}

                {/* Student: Show answered status */}
                {!isTeacher && doubt.teacher_reply && (
                  <div className="mt-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Answered
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Question?</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete this doubt? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={closeDeleteModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoubt}
                disabled={deletingId}
                className="px-5 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {deletingId && (
                  <svg className="animate-spin -ml-1 mr-2 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassDoubtsTab;