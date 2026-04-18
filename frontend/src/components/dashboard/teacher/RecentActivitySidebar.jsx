import React from 'react';

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

function RecentActivitySidebar({ recentActivity, analyticsLoading }) {
  return (
    <div className="xl:col-span-1 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
      </div>
      <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[calc(100%-48px)]">
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto scrollbar-hide py-2">
          {analyticsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full text-slate-400">
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-bold text-slate-600">No recent activity</p>
              <p className="text-sm mt-1">Updates from the last 7 days will show here.</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform ${
                  activity.color === 'blue' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                  activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  activity.color === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                  'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  {activity.icon === 'quiz' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {activity.icon === 'user' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  {activity.icon === 'class' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{activity.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{activity.subtitle}</p>
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mt-2">
                     {formatTimeAgo(activity.time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentActivitySidebar;
