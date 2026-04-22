function ClassHeader({ cls, onBack }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{cls.name}</h1>
        <div className="flex flex-wrap gap-2 mt-1">
          {cls.topics && cls.topics.map(topic => (
            <span key={topic} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
              {topic}
            </span>
          ))}
        </div>
        {cls.class_date ? (
          <p className="text-sm text-slate-500 mt-1">
            {new Date(cls.class_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        ) : (
          <p className="text-sm text-slate-400 mt-1">Date not set</p>
        )}
      </div>
    </div>
  );
}

export default ClassHeader;
