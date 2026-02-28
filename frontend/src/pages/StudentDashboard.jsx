import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { supabase } from '../lib/supabase';

function StudentDashboard() {
  const navigate = useNavigate();
  const [tuitionId, setTuitionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userId, setUserId] = useState(null);
  const [joinedTuitions, setJoinedTuitions] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch joined tuitions
      const { data } = await supabase
        .from('tuition_members')
        .select(`
          tuition_id,
          role_in_tuition,
          tuition_spaces (id, name, created_at)
        `)
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'student');

      if (data) {
        const tuitions = data.map(m => m.tuition_spaces).filter(Boolean);
        setJoinedTuitions(tuitions);
      }
    };

    init();
  }, []);

  const handleJoinTuition = async (e) => {
    e.preventDefault();
    if (!tuitionId.trim() || !userId) return;

    setLoading(true);
    setMessage('');

    try {
      // Check if tuition exists by join_code
      const { data: tuition, error: tuitionError } = await supabase
        .from('tuition_spaces')
        .select('id, name')
        .eq('join_code', tuitionId.trim().toUpperCase())
        .single();

      if (tuitionError || !tuition) {
        setMessage('Tuition not found. Please check the code.');
        setMessageType('error');
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('tuition_members')
        .select('id')
        .eq('tuition_id', tuition.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMember) {
        setMessage('You are already a member of this tuition.');
        setMessageType('error');
        return;
      }

      // Join the tuition
      const { error: joinError } = await supabase
        .from('tuition_members')
        .insert({
          user_id: userId,
          tuition_id: tuition.id,
          role_in_tuition: 'student',
        });

      if (joinError) throw joinError;

      // Refresh tuitions list
      const { data } = await supabase
        .from('tuition_members')
        .select('tuition_spaces (id, name, created_at)')
        .eq('user_id', userId)
        .eq('role_in_tuition', 'student');

      if (data) {
        setJoinedTuitions(data.map(m => m.tuition_spaces).filter(Boolean));
      }

      setMessage(`Successfully joined "${tuition.name}"!`);
      setMessageType('success');
      setTuitionId('');
    } catch (err) {
      setMessage(err.message || 'Failed to join tuition.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="Student">
      <div className="space-y-6">
        {/* Join Tuition Form */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Join a Tuition</h3>
          <form onSubmit={handleJoinTuition} className="flex gap-3">
            <input
              type="text"
              value={tuitionId}
              onChange={(e) => setTuitionId(e.target.value)}
              placeholder="Enter join code..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !tuitionId.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </form>
          {message && (
            <p className={`text-sm mt-2 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Joined Tuitions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Your Tuitions</h3>
          </div>
          {joinedTuitions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No tuitions joined yet. Enter a join code above to join.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {joinedTuitions.map((tuition) => (
                <div
                  key={tuition.id}
                  onClick={() => navigate(`/dashboard/student/tuition/${tuition.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-900">{tuition.name}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                    Student
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
                <p className="text-sm text-slate-600 mb-1">Assigned Quizzes</p>
                <p className="text-3xl font-bold text-slate-900">12</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-3">5 pending completion</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed Quizzes</p>
                <p className="text-3xl font-bold text-slate-900">7</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3">58% completion rate</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-slate-900">85%</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">+7% improvement</p>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Tasks</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-slate-900">Physics Chapter 7 Quiz</p>
                  <p className="text-sm text-slate-600">Due in 2 days - 15 questions</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors">
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;