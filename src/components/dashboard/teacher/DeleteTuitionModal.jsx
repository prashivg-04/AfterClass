import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { handleError } from '../../../utilities/errorHandler';

function DeleteTuitionModal({ isOpen, tuition, onClose, userId, onSuccess }) {
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset local state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDeleteStep(1);
      setDeleteConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen || !tuition) return null;

  const canProceedToStep2 = () => {
    return deleteConfirmText.toUpperCase() === tuition?.name?.toUpperCase();
  };

  const handleClose = () => {
    setDeleteStep(1);
    setDeleteConfirmText('');
    onClose();
  };

  const handleDelete = async () => {
    if (!tuition || !userId) return;

    setIsDeleting(true);
    try {
      // Delete tuition - cascade will handle related records
      const { error } = await supabase
        .from('tuition_spaces')
        .delete()
        .eq('id', tuition.id)
        .eq('created_by', userId);

      if (error) throw error;

      toast.success('Tuition deleted successfully');
      onSuccess(tuition.id);
      handleClose();
    } catch (err) {
      handleError(err, 'Failed to delete tuition');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-2xl font-black text-center text-slate-900 mb-2">Delete Tuition Space</h3>
          <p className="text-center text-slate-600 mb-8 font-medium">This action cannot be undone. All classes, members, and data will be permanently removed.</p>

          {deleteStep === 1 ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Please type <span className="font-black text-slate-900 select-all bg-slate-200 px-2 py-0.5 rounded">{tuition?.name}</span> to confirm.
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900 font-medium transition-all"
                  placeholder="Enter tuition name"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-4 text-base font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setDeleteStep(2)}
                  disabled={!canProceedToStep2()}
                  className={`flex-1 px-6 py-4 text-base font-bold text-white rounded-2xl transition-all ${
                    canProceedToStep2()
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
                      : 'bg-red-300 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-red-50 text-red-800 p-5 rounded-2xl text-sm font-bold border border-red-100 flex gap-3">
                <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>You are about to permanently delete <span className="font-black">"{tuition?.name}"</span>. Are you absolutely sure?</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteStep(1)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 text-base font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 text-base font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-lg shadow-red-500/30 active:scale-95 flex justify-center items-center gap-2 disabled:bg-red-400"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Forever'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeleteTuitionModal;
