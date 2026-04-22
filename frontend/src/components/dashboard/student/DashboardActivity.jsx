import { useNavigate } from 'react-router-dom';

export default function DashboardActivity({ analytics, analyticsLoading }) {
  const navigate = useNavigate();

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Pending Quizzes */}
      <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Pending Quizzes</h3>
          </div>
          <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-xl border border-orange-200/60">
            {analytics.upcomingQuizzes?.length || 0} Open
          </span>
        </div>
        <div className="divide-y divide-slate-100 flex-1">
          {analyticsLoading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : analytics.upcomingQuizzes?.length === 0 ? (
            <div className="p-10 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-black text-slate-700">All caught up!</p>
              <p className="text-sm mt-1 font-medium">No pending quizzes at the moment.</p>
            </div>
          ) : (
            analytics.upcomingQuizzes?.map((quiz, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{quiz.title}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">in {quiz.tuition_spaces?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/dashboard/student/tuition/${quiz.tuition_spaces?.id}?tab=quizzes`)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shrink-0 shadow-sm"
                >
                  Start
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100 flex-1">
          {analyticsLoading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : analytics.recentActivity?.length === 0 ? (
            <div className="p-10 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-black text-slate-700">No recent activity</p>
              <p className="text-sm mt-1 font-medium">Activity from the last 7 days will appear here</p>
            </div>
          ) : (
            analytics.recentActivity?.map((activity, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-4 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                    activity.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                    activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    activity.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                    'bg-slate-50 border-slate-100 text-slate-600'
                  }`}>
                    {activity.icon === 'quiz' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {activity.icon === 'check' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {activity.icon === 'money' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{activity.title}</p>
                    <p className={`text-xs font-semibold mt-0.5 truncate ${
                      activity.color === 'blue' ? 'text-blue-600' :
                      activity.color === 'emerald' ? 'text-emerald-600' :
                      activity.color === 'amber' ? 'text-amber-600' :
                      'text-slate-400'
                    }`}>{activity.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
                   {formatTimeAgo(activity.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
