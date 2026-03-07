import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'JEE', 'NEET'];
const BATCHES = ['Morning', 'Evening'];

function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const [tuitions, setTuitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  // Form state
  const [tuitionName, setTuitionName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [batch, setBatch] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setTuitionName('');
    setSubject('');
    setGrade('');
    setBatch('');
    setDescription('');
    setError('');
  };

  // Fetch current user and their tuitions
  useEffect(() => {
    const getUserAndTuitions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('tuition_spaces')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      setTuitions(data || []);
    };

    getUserAndTuitions();
  }, []);

  const handleCreateTuition = async (e) => {
    e.preventDefault();
    if (!tuitionName.trim() || !userId) return;

    setLoading(true);
    setError('');

    try {
      // Generate a random 6-character join code
      const joinCode = generateJoinCode();

      // 1. Create tuition space
      const { data: tuition, error: tuitionError } = await supabase
        .from('tuition_spaces')
        .insert({
          name: tuitionName,
          created_by: userId,
          join_code: joinCode,
          subject: subject || null,
          grade: grade || null,
          batch: batch || null,
          description: description || null,
        })
        .select()
        .single();

      if (tuitionError) throw tuitionError;

      // 2. Add teacher as member with teacher role
      const { error: memberError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'teacher',
        });

      if (memberError) throw memberError;

      // 3. Update list and clear form
      setTuitions([tuition, ...tuitions]);
      resetForm();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="Teacher">
      <div className="space-y-6">
        {/* Create Tuition Button */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Manage Your Tuitions</h3>
              <p className="text-slate-500 mt-1">Create and manage your tuition batches and students</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Tuition
            </button>
          </div>
        </div>

        {/* Tuition List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Your Tuitions</h3>
          </div>
          <div className="p-6">
            {tuitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
                  <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">No tuitions created yet</h4>
                <p className="text-slate-500 max-w-sm mb-6">
                  Get started by creating your first tuition space to manage students, classes, and resources.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  Create Tuition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tuitions.map((tuition) => (
                  <div
                    key={tuition.id}
                    onClick={() => navigate(`/dashboard/teacher/tuition/${tuition.id}`)}
                    className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                  >
                    {/* Decorative side accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{tuition.name}</h4>
                      <div className="px-2.5 py-1 bg-blue-50/50 text-blue-600 text-xs font-semibold rounded-lg border border-blue-100 shrink-0">
                        Teacher
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {tuition.subject && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {tuition.subject}
                        </span>
                      )}
                      {tuition.grade && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {tuition.grade}
                        </span>
                      )}
                      {tuition.batch && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {tuition.batch}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Code: <span className="font-mono text-slate-700 font-semibold">{tuition.join_code || 'N/A'}</span>
                      </span>

                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">127</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +12% from last month
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Batches</p>
                <p className="text-3xl font-bold text-slate-900">8</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
              Across all subjects
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Quizzes Created</p>
                <p className="text-3xl font-bold text-slate-900">34</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
              15 active this week
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah Johnson completed "Physics Chapter 5"</p>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Score: <span className="text-emerald-600">92%</span></p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">2 hours ago</span>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">New batch "Mathematics Grade 10" created</p>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">23 students enrolled</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tuition Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Create New Tuition</h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateTuition} className="space-y-5">
                {/* Tuition Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tuition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tuitionName}
                    onChange={(e) => setTuitionName(e.target.value)}
                    placeholder="e.g., Math Grade 10 Morning Batch"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Subject & Grade Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="">Select subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="">Select grade</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Batch */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="">Select batch</option>
                    {BATCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any notes about this tuition..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !tuitionName.trim()}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? 'Creating...' : 'Create Tuition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TeacherDashboard;
