import { useState, useRef, useLayoutEffect } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'resources', label: 'Resources' },
  { id: 'doubts', label: 'Doubts' },
];

export function ClassDetailTabs({ activeTab, onTabChange }) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef([]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeIndex = TABS.findIndex(t => t.id === activeTab);
      const activeElement = tabsRef.current[activeIndex];
      if (activeElement) {
        setIndicatorStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
    };

    updateIndicator();
    // Allow paint to finish (fonts, layout shifts)
    const timeout = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timeout);
  }, [activeTab]);

  return (
    <div className="border-b border-slate-200 bg-white/40 px-4 sm:px-6 rounded-t-2xl flex overflow-x-auto scrollbar-hide">
      <nav className="flex gap-6 sm:gap-8 min-w-max relative pb-0 w-full">
        {/* Animated Background Underline */}
        <div
          className="absolute bottom-0 h-[3px] bg-blue-600 rounded-t-md transition-all duration-300 ease-in-out will-change-[left,width]"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={el => tabsRef.current[index] = el}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative whitespace-nowrap py-4 px-1 font-semibold text-sm transition-colors outline-none
                ${isActive
                  ? 'text-blue-700'
                  : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ClassDetailTabs;
