import Rolling365Heatmap from '../../components/Rolling365Heatmap';

export default function OverviewTab({ tuition, isTeacher, attendanceData, tuitionCreatedDate, studentJoinedDate }) {
  return (
    <div className="space-y-6">
      {/* Tuition Info Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isTeacher ? 'Tuition Details' : 'About This Tuition'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tuition.subject && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subject</p>
              <p className="font-semibold text-slate-900">{tuition.subject}</p>
            </div>
          )}
          {tuition.grade && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Grade</p>
              <p className="font-semibold text-slate-900">{tuition.grade}</p>
            </div>
          )}
          {tuition.batch && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Batch</p>
              <p className="font-semibold text-slate-900">{tuition.batch}</p>
            </div>
          )}
          {isTeacher && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Join Code</p>
              <p className="font-mono font-bold text-slate-900 tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm inline-block">
                {tuition.join_code || 'N/A'}
              </p>
            </div>
          )}
          {tuition.description && (
            <div className="md:col-span-2 lg:col-span-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-slate-700 leading-relaxed">{tuition.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Student: Your Progress Section */}
      {!isTeacher && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Attendance</p>
                  <p className="text-3xl font-bold text-slate-900">--%</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Classes Attended</p>
                  <p className="text-3xl font-bold text-slate-900">--</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Quizzes Attempted</p>
                  <p className="text-3xl font-bold text-slate-900">--</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 text-purple-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Heatmap */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Attendance Tracker</h3>
            </div>
            <div className="p-6 overflow-x-auto">
              <Rolling365Heatmap
                intensityMap={attendanceData}
                tuitionCreatedAt={tuitionCreatedDate}
                studentJoinedAt={studentJoinedDate}
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-[2px] bg-[#10b981]"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-[2px] bg-[#f87171]"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-[2px] bg-[#e2e8f0]"></div>
                  <span>No record</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="relative w-3 h-3 rounded-[2px] bg-[#e2e8f0] overflow-hidden">
                    <div className="absolute top-0 left-0 w-0 h-0 border-t-[5px] border-r-[5px] border-t-blue-500 border-r-transparent"></div>
                  </div>
                  <span>Tuition created</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-3 h-3 rounded-[2px] bg-[#e2e8f0] overflow-hidden">
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-purple-500 border-l-transparent"></div>
                  </div>
                  <span>Student joined</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
