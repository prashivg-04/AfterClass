import Rolling365Heatmap from '../../components/Rolling365Heatmap';

export default function OverviewTab({
  tuition,
  isTeacher,
  attendanceData,
  tuitionCreatedDate,
  studentJoinedDate,
  studentKpiData,
  kpiLoading
}) {
  return (
    <div className="space-y-6">
      {/* Tuition Info Card */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isTeacher ? 'Tuition Details' : 'About This Tuition'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tuition.subject && (
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</p>
              <p className="text-lg font-bold text-slate-900">{tuition.subject}</p>
            </div>
          )}
          {tuition.grade && (
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Grade</p>
              <p className="text-lg font-bold text-slate-900">{tuition.grade}</p>
            </div>
          )}
          {tuition.batch && (
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Batch</p>
              <p className="text-lg font-bold text-slate-900">{tuition.batch}</p>
            </div>
          )}
          {isTeacher && (
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Join Code</p>
              <p className="font-mono text-lg font-extrabold text-slate-900 tracking-wider">
                {tuition.join_code || 'N/A'}
              </p>
            </div>
          )}
          {tuition.description && (
            <div className="md:col-span-2 lg:col-span-3 bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-slate-700 leading-relaxed font-medium">{tuition.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Student: Your Progress Section */}
      {!isTeacher && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Attendance */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              {/* Background gradient blobs */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-colors duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-green-400/10 rounded-full blur-xl group-hover:bg-green-400/20 transition-colors duration-500"></div>
              
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attendance</p>
                  <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {kpiLoading ? (
                      <span className="inline-block w-20 h-10 bg-slate-200 rounded-lg animate-pulse"></span>
                    ) : (
                      `${studentKpiData.attendancePercentage}%`
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 bg-linear-to-br from-emerald-100 to-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center justify-center relative z-10 text-emerald-600 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-100/50 w-fit backdrop-blur-sm">
                {kpiLoading ? (
                  <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {studentKpiData.classesAttended}/{studentKpiData.classesConducted} classes
                  </>
                )}
              </div>
            </div>

            {/* Quizzes Attempted */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
              {/* Background gradient blobs */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl group-hover:bg-amber-400/30 transition-colors duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-400/10 rounded-full blur-xl group-hover:bg-orange-400/20 transition-colors duration-500"></div>

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quizzes</p>
                  <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {kpiLoading ? (
                      <span className="inline-block w-16 h-10 bg-slate-200 rounded-lg animate-pulse"></span>
                    ) : (
                      `${studentKpiData.quizzesAttempted}/${studentKpiData.totalQuizzes}`
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 bg-linear-to-br from-amber-100 to-amber-50 rounded-2xl border border-amber-100/50 flex items-center justify-center relative z-10 text-amber-600 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-100/50 w-fit backdrop-blur-sm">
                {kpiLoading ? (
                  <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quizzes attempted
                  </>
                )}
              </div>
            </div>

            {/* Average Quiz Score */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
              {/* Background gradient blobs */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-colors duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-400/10 rounded-full blur-xl group-hover:bg-purple-400/20 transition-colors duration-500"></div>

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Avg. Marks</p>
                  <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {kpiLoading ? (
                      <span className="inline-block w-16 h-10 bg-slate-200 rounded-lg animate-pulse"></span>
                    ) : (
                      `${studentKpiData.averageQuizScore}%`
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 bg-linear-to-br from-indigo-100 to-indigo-50 rounded-2xl border border-indigo-100/50 flex items-center justify-center relative z-10 text-indigo-600 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100/50 w-fit backdrop-blur-sm">
                {kpiLoading ? (
                  <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Average quiz score
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Heatmap */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Attendance Record</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Rolling 365-day history</p>
              </div>
            </div>
            <div className="p-6 sm:p-8 overflow-x-auto">
              <Rolling365Heatmap
                intensityMap={attendanceData}
                tuitionCreatedAt={tuitionCreatedDate}
                studentJoinedAt={studentJoinedDate}
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8 pt-6 border-t border-slate-100 text-[13px] font-bold text-slate-500 tracking-wide uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-[#10b981] shadow-sm"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-[#f87171] shadow-sm"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-[#f1f5f9] shadow-sm border border-slate-200/60"></div>
                  <span>No class</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative w-3.5 h-3.5 rounded-[4px] bg-[#f1f5f9] border border-slate-200/60 overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-0 h-0 border-t-[6px] border-r-[6px] border-t-[#3b82f6] border-r-transparent"></div>
                  </div>
                  <span>Tuition created</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-3.5 h-3.5 rounded-[4px] bg-[#f1f5f9] border border-slate-200/60 overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#a855f7] border-l-transparent"></div>
                  </div>
                  <span>You joined</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
