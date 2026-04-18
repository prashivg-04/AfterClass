import React from 'react';
import { useNavigate } from 'react-router-dom';

function TuitionsList({ tuitions, analytics, analyticsLoading, onCreateClick, onDeleteClick }) {
  const navigate = useNavigate();

  return (
    <div className="xl:col-span-2 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Your Tuitions</h3>
      </div>
      {tuitions.length === 0 ? (
        <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-indigo-50/50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">No tuitions active</h4>
          <p className="text-slate-500 max-w-sm mb-6 text-lg">
            Create your first tuition batch to begin managing students.
          </p>
          <button
            onClick={onCreateClick}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            Create Tuition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {tuitions.map((tuition) => (
            <div
              key={tuition.id}
              onClick={() => navigate(`/dashboard/teacher/tuition/${tuition.id}`)}
              className="group bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[280px]"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="flex justify-between items-start mb-auto relative z-10">
                <div>
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight tracking-tight mb-2">{tuition.name}</h4>
                  <div className="flex flex-wrap gap-2">
                     {tuition.subject && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.subject}</span>}
                     {tuition.grade && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.grade}</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end relative z-10 w-full mt-6">
                 <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Enrolled</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-900">
                         {analytics.studentsByTuition[tuition.id] || 0}
                      </span>
                      <span className="text-slate-500 font-medium">Students</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <button
                     onClick={(e) => onDeleteClick(tuition, e)}
                     className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors shadow-sm border border-slate-100"
                     title="Delete Tuition"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                   <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                     <svg className="w-5 h-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                     </svg>
                   </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Quick Insight Cards */}
      {tuitions.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-3xl p-6 border border-blue-400 shadow-lg relative overflow-hidden text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm font-medium text-blue-100">Total Quizzes</p>
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {analyticsLoading ? '-' : analytics.totalQuizzes}
              </p>
            </div>
          </div>

          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 border border-emerald-400 shadow-lg relative overflow-hidden text-white md:col-span-2">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-100">Quick Insight</p>
                </div>
                <p className="text-xl md:text-2xl font-bold tracking-tight">
                  {analyticsLoading ? 'Loading...' : (
                      <>
                        Your largest tuition has{' '}
                        <span className="text-emerald-200 font-black">
                          {Math.max(...Object.values(analytics.studentsByTuition).filter(Boolean), 0)}
                        </span>{' '}
                        students.
                      </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TuitionsList;
