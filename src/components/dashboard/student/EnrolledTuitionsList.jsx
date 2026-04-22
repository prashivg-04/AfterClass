import { useNavigate } from 'react-router-dom';

export default function EnrolledTuitionsList({ joinedTuitions, onOpenJoinModal }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Enrolled Tuitions</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{joinedTuitions.length} active {joinedTuitions.length === 1 ? 'tuition' : 'tuitions'}</p>
          </div>
        </div>
        <button
          onClick={onOpenJoinModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Join
        </button>
      </div>
      <div className="p-6 lg:p-8">
        {joinedTuitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Not enrolled yet</h4>
            <p className="text-slate-500 max-w-sm mb-6 font-medium">
              You haven't joined any tuitions. Ask your teacher for a join code to get started.
            </p>
            <button
              onClick={onOpenJoinModal}
              className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              Join Tuition
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {joinedTuitions.map((tuition) => (
              <div
                key={tuition.id}
                onClick={() => navigate(`/dashboard/student/tuition/${tuition.id}`)}
                className="group bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[260px]"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

                <div className="flex justify-between items-start mb-auto relative z-10">
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight tracking-tight mb-2">{tuition.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {tuition.subject && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.subject}</span>}
                      {tuition.grade && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.grade}</span>}
                      {tuition.batch && <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tuition.batch}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end relative z-10 w-full mt-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Teacher</p>
                    <p className="text-lg font-black text-slate-900 truncate max-w-[140px]">{tuition.teacher?.full_name || 'Unknown'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
