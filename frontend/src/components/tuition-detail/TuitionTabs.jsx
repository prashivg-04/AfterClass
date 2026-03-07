export default function TuitionTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              pb-4 text-sm font-medium transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
