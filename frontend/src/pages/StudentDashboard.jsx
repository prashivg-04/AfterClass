import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Rolling365Heatmap from '../components/Rolling365Heatmap';
import { supabase } from '../lib/supabase';
import { joinSchema } from '../schemas/join.schema';

function StudentDashboard() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userId, setUserId] = useState(null);
  const [joinedTuitions, setJoinedTuitions] = useState([]);
  const [globalAttendance, setGlobalAttendance] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      joinCode: '',
    },
  });

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
          tuition_spaces (id, name, subject, grade, batch, created_at)
        `)
        .eq('user_id', user.id)
        .eq('role_in_tuition', 'student');

      if (data) {
        const tuitions = data.map(m => m.tuition_spaces).filter(Boolean);
        setJoinedTuitions(tuitions);

        // Get attendance data if student has joined tuitions
        let dayCount = {};
        if (tuitions.length > 0) {
          const tuitionIds = tuitions.map(t => t.id);

          // Get all classes from joined tuitions
          const { data: classesData } = await supabase
            .from('classes')
            .select('id, tuition_id, created_at')
            .in('tuition_id', tuitionIds);

          if (classesData && classesData.length > 0) {
            const classIds = classesData.map(c => c.id);

            // Get attendance records for current user
            const { data: attendanceData } = await supabase
              .from('class_attendance')
              .select('class_id, status')
              .eq('student_id', user.id)
              .eq('status', 'present')
              .in('class_id', classIds);

            // Map class_id to date
            const classDateMap = {};
            classesData.forEach(c => {
              classDateMap[c.id] = c.created_at;
            });

            // Count present per day
            if (attendanceData) {
              attendanceData.forEach(a => {
                const date = new Date(classDateMap[a.class_id]).toISOString().split('T')[0];
                dayCount[date] = (dayCount[date] || 0) + 1;
              });
            }
          }
        }

        // Set intensity map for rolling 365-day heatmap
        setGlobalAttendance(dayCount);
      }
    };

    init();
  }, []);

  const handleJoinTuition = async (data) => {
    // Get authenticated user directly
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userId = user.id;

    setLoading(true);

    try {
      // Check if tuition exists by join_code
      const joinCodeValue = data.joinCode.trim().toUpperCase();

      const { data: tuition } = await supabase
        .from('tuition_spaces')
        .select('id, name')
        .eq('join_code', joinCodeValue)
        .maybeSingle();

      if (!tuition) {
        toast.error('Invalid join code');
        return;
      }

      // Check if already a member
      const { data: existingMembers } = await supabase
        .from('tuition_members')
        .select('id')
        .eq('tuition_id', tuition.id)
        .eq('user_id', userId);

      if (existingMembers && existingMembers.length > 0) {
        toast.error('You are already a member of this tuition');
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

      if (joinError) {
        // Check for duplicate key error (already a member)
        if (joinError.code === '23505' || joinError.message?.includes('duplicate')) {
          toast.error('You are already a member of this tuition');
          return;
        }
        throw joinError;
      }

      // Refresh tuitions list
      const { data: tuitionsData } = await supabase
        .from('tuition_members')
        .select('tuition_spaces (id, name, created_at)')
        .eq('user_id', userId)
        .eq('role_in_tuition', 'student');

      if (tuitionsData) {
        setJoinedTuitions(tuitionsData.map(m => m.tuition_spaces).filter(Boolean));
      }

      toast.success('Joined tuition successfully');
      reset();
      setShowJoinModal(false);
    } catch (err) {
      console.error('Join tuition error:', err);
      toast.error('Failed to join tuition');
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  return (
    <DashboardLayout role="Student">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Your Tuitions</h3>
              <p className="text-slate-500 mt-1">Join and access your enrolled tuition batches</p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Join Tuition
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Attendance Overview</h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <Rolling365Heatmap intensityMap={globalAttendance} mode="count" />
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                <span>1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                <span>2</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-800"></div>
                <span>3+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">Enrolled Tuitions</h3>
          </div>
          <div className="p-6">
            {joinedTuitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
                  <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Not enrolled yet</h4>
                <p className="text-slate-500 max-w-sm mb-6">
                  You haven't joined any tuitions. Ask your teacher for a join code to get started.
                </p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  Join Tuition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joinedTuitions.map((tuition) => (
                  <div
                    key={tuition.id}
                    onClick={() => navigate(`/dashboard/student/tuition/${tuition.id}`)}
                    className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{tuition.name}</h4>
                      <div className="px-2.5 py-1 bg-indigo-50/50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100 shrink-0">
                        Student
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {tuition.subject && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/50">
                          {tuition.subject}
                        </span>
                      )}
                      {tuition.grade && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100/50">
                          {tuition.grade}
                        </span>
                      )}
                      {tuition.batch && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                          {tuition.batch}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Teacher: <span className="text-slate-700">{tuition.teacher?.full_name || 'Unknown'}</span></span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Assigned Quizzes</p>
                <p className="text-3xl font-bold text-slate-900">12</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg w-fit">
              3 due this week
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Completed Quizzes</p>
                <p className="text-3xl font-bold text-slate-900">8</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All graded
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-slate-900">86%</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-amber-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +4% from last month
            </div>
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

      {/* Join Tuition Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Join a Tuition</h2>
              <button
                type="button"
                onClick={() => { setShowJoinModal(false); reset(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(handleJoinTuition)} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Join Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('joinCode')}
                    value={watch('joinCode') || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 6);
                      setValue('joinCode', value, { shouldValidate: true });
                    }}
                    placeholder="Enter the code provided by your teacher"
                    maxLength={6}
                    className={`w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 uppercase placeholder:normal-case font-mono tracking-wider font-semibold ${errors.joinCode
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400'
                      }`}
                    aria-invalid={errors.joinCode ? "true" : "false"}
                  />
                  {errors.joinCode && (
                    <p className="mt-1.5 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.joinCode.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A 6 character code like 'MATH10' or 'A1B2C3'.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowJoinModal(false); reset(); }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      'Join Tuition'
                    )}
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

export default StudentDashboard;
