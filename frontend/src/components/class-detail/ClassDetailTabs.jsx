const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'resources', label: 'Resources' },
  { id: 'doubts', label: 'Doubts' },
  { id: 'quiz', label: 'Quiz' },
];

export function ClassDetailTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl overflow-x-auto hide-scrollbar">
      <nav className="flex gap-2 min-w-max">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-all outline-none
                ${isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-lg'
                }
              `}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ClassDetailTabs;
