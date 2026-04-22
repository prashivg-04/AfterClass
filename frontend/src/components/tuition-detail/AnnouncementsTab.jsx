import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { announcementSchema } from '../../schemas/announcement.schema';

function AnnouncementsTab({ tuitionId, isTeacher }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, [tuitionId]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by_profile:profiles(full_name)
      `)
      .eq('tuition_id', tuitionId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load announcements');
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    reset({ title: '', message: '' });
    setEditingAnnouncement(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setValue('title', announcement.title);
    setValue('message', announcement.message);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleCreateOrUpdate = async (data) => {
    setSaving(true);

    if (editingAnnouncement) {
      // Update existing announcement
      const { error } = await supabase
        .from('announcements')
        .update({
          title: data.title.trim(),
          message: data.message.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAnnouncement.id);

      if (error) {
        toast.error('Failed to update announcement');
        setSaving(false);
        return;
      }

      toast.success('Announcement updated');
      fetchAnnouncements();
    } else {
      // Create new announcement
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('announcements')
        .insert({
          tuition_id: tuitionId,
          title: data.title.trim(),
          message: data.message.trim(),
          created_by: user.id,
        });

      if (error) {
        toast.error('Failed to create announcement');
        setSaving(false);
        return;
      }

      toast.success('Announcement created');
      fetchAnnouncements();
    }

    handleCloseModal();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setDeletingId(id);
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete announcement');
    } else {
      toast.success('Announcement deleted');
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
    setDeletingId(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 hidden sm:flex">
            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Announcements</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {isTeacher
                ? "Share important updates with your students"
                : "Important updates from your teacher"}
            </p>
          </div>
        </div>
        {isTeacher && (
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-sm font-bold tracking-wide rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Make Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="w-full">
        {loading ? (
          <div className="p-12 flex items-center justify-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mb-5 border border-blue-100 shadow-sm animate-in zoom-in duration-300">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">No Announcements Yet</h4>
            <p className="text-sm text-slate-500 max-w-sm">
              {isTeacher
                ? "Get started by making your first announcement to share updates with your students."
                : "Any important updates or news about this tuition will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 sm:p-8 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                      {announcement.created_by_profile?.full_name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {announcement.created_by_profile?.full_name || 'Unknown Teacher'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(announcement.created_at)}</span>
                        {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="italic">Edited</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Actions */}
                  {isTeacher && (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(announcement)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit announcement"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        disabled={deletingId === announcement.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete announcement"
                      >
                        {deletingId === announcement.id ? (
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
                    </div>
                  )}
                </div>

                <div className="pl-0">
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    {announcement.title}
                  </h4>
                  <p className="text-base text-slate-700 whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {announcement.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingAnnouncement ? 'Edit Announcement' : 'Make Announcement'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateOrUpdate)} className="bg-slate-50/50 p-6 space-y-6" noValidate>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Announcement Title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g., Exam Schedule Update"
                  className={`w-full px-4 py-3 bg-white border text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm placeholder:text-slate-400 ${errors.title
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.title.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Message</label>
                <textarea
                  {...register('message')}
                  placeholder="Enter the details of your announcement..."
                  rows={5}
                  className={`w-full px-4 py-3 bg-white border text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm resize-none placeholder:text-slate-400 ${errors.message
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  aria-invalid={errors.message ? "true" : "false"}
                />
                {errors.message && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errors.message.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  {saving
                    ? (editingAnnouncement ? 'Updating...' : 'Posting...')
                    : (editingAnnouncement ? 'Update' : 'Make')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsTab;