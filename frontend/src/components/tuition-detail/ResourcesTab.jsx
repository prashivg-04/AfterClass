import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
};

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function ResourcesTab({ tuitionId, isTeacher }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmResource, setDeleteConfirmResource] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch resources on mount
  useEffect(() => {
    fetchResources();
  }, [tuitionId]);

  const fetchResources = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('tuition_id', tuitionId)
      .is('class_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to load resources: ${error.message}`);
    } else {
      // Fetch user names separately
      const userIds = [...new Set(data?.map(r => r.uploaded_by).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const resourcesWithProfiles = data.map(r => ({
          ...r,
          uploaded_by_profile: profileMap.get(r.uploaded_by)
        }));
        setResources(resourcesWithProfiles);
      } else {
        setResources(data || []);
      }
    }
    setLoading(false);
  };

  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_TYPES[file.type]) {
      toast.error(`Invalid file type. Only PDF and image files (JPG, PNG) are allowed.`);
      return false;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      toast.error(`Invalid file extension. Only PDF and image files (JPG, PNG) are allowed.`);
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    if (!validateFile(file)) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        setUploading(false);
        return;
      }

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `tuition/${tuitionId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast.error(`Failed to upload file: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          file_name: file.name,
          file_path: filePath,
          uploaded_by: user.id,
          tuition_id: tuitionId,
        });

      if (dbError) {
        // Try to delete the uploaded file if DB insert fails
        await supabase.storage.from('resources').remove([filePath]);
        toast.error('Failed to save resource metadata');
        setUploading(false);
        return;
      }

      toast.success('Resource uploaded successfully');
      fetchResources();
    } catch (error) {
      toast.error('Failed to upload resource');
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (resource) => {
    setDeleteConfirmResource(resource);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmResource) return;
    
    const resource = deleteConfirmResource;
    setDeletingId(resource.id);
    setDeleteConfirmResource(null); // Close modal immediately

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resources')
        .remove([resource.file_path]);

      if (storageError) {
        // Continue to delete from DB anyway
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (dbError) {
        toast.error('Failed to delete resource');
        setDeletingId(null);
        return;
      }

      toast.success('Resource deleted');
      setResources(resources.filter(r => r.id !== resource.id));
    } catch (error) {
      toast.error('Failed to delete resource');
    }

    setDeletingId(null);
  };

  const canDelete = (resource) => {
    // Teachers can delete any resource
    if (isTeacher) return true;
    // Students can only delete their own uploads
    return currentUser && resource.uploaded_by === currentUser.id;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="w-12 h-12 bg-linear-to-br from-red-50 to-red-100/50 text-red-600 rounded-xl border border-red-200/60 shadow-inner flex flex-col items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-linear-to-br from-blue-50 to-blue-100/50 text-blue-600 rounded-xl border border-blue-200/60 shadow-inner flex flex-col items-center justify-center shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  };

  const openFileUrl = (resource) => {
    const { data } = supabase.storage.from('resources').getPublicUrl(resource.file_path);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-6 sm:p-8 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 hidden sm:flex">
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Study Resources</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Access and manage tuition materials</p>
            </div>
          </div>

          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-sm font-bold tracking-wide rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload File
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-blue-50/50 border border-blue-100 rounded-full flex items-center justify-center mb-5 shadow-sm animate-in zoom-in duration-300">
                <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">No resources uploaded yet</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Study materials, notes, and other learning resources will appear here once uploaded.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getFileIcon(resource.file_name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-slate-900 truncate mb-1">
                        {resource.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(resource.created_at)}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {resource.uploaded_by_profile?.full_name || 'Teacher'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4 shrink-0 transition-opacity">
                    <button
                      onClick={() => openFileUrl(resource)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      title="Download resource"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden sm:inline">Download</span>
                    </button>
                    {canDelete(resource) && (
                      <button
                        onClick={() => handleDeleteClick(resource)}
                        disabled={deletingId === resource.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                        title="Delete resource"
                      >
                        {deletingId === resource.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File type hint */}
      <p className="text-center text-xs text-slate-400">
        Allowed file types: PDF, JPG, PNG (max 10MB)
      </p>

      {/* Delete Confirmation Modal */}
      {deleteConfirmResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Resource</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteConfirmResource.file_name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmResource(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourcesTab;