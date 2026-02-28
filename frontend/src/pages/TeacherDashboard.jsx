import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';

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
  const [tuitionName, setTuitionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

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
        .insert({ name: tuitionName, created_by: userId, join_code: joinCode })
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
      setTuitionName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="Teacher">
      <div className="space-y-6">
        {/* Create Tuition Form */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Tuition</h3>
          <form onSubmit={handleCreateTuition} className="flex gap-3">
            <input
              type="text"
              value={tuitionName}
              onChange={(e) => setTuitionName(e.target.value)}
              placeholder="Enter tuition name..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !tuitionName.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Tuition List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Your Tuitions</h3>
          </div>
          {tuitions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No tuitions created yet. Create your first tuition above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tuitions.map((tuition) => (
                <div
                  key={tuition.id}
                  onClick={() => navigate(`/dashboard/teacher/tuition/${tuition.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-900">{tuition.name}</p>
                    <p className="text-sm text-slate-500">
                      Join Code: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{tuition.join_code || 'N/A'}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    Teacher
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">127</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3">+12% from last month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Batches</p>
                <p className="text-3xl font-bold text-slate-900">8</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">Across all subjects</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Quizzes Created</p>
                <p className="text-3xl font-bold text-slate-900">34</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">15 active this week</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Sarah Johnson completed "Physics Chapter 5"</p>
                  <p className="text-sm text-slate-600">Score: 92%</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">2 hours ago</span>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">New batch "Mathematics Grade 10" created</p>
                  <p className="text-sm text-slate-600">23 students enrolled</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboard;
