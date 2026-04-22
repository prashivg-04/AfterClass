function AttendanceHeatmap({ data }) {
  const getCellColor = (item) => {
    if (!item) return 'bg-slate-100';
    if (item.count !== undefined) {
      if (item.count === 0) return 'bg-slate-100';
      if (item.count === 1) return 'bg-emerald-400';
      if (item.count === 2) return 'bg-emerald-600';
      return 'bg-emerald-800';
    }
    if (item.status === 'present') return 'bg-green-500';
    if (item.status === 'absent') return 'bg-orange-500';
    return 'bg-slate-200';
  };

  const getTooltip = (item) => {
    if (!item) return '';
    if (item.tooltip) return item.tooltip;
    if (item.count !== undefined) {
      return `${item.date ? new Date(item.date).toLocaleDateString() : ''}: ${item.count} class${item.count !== 1 ? 'es' : ''} attended`;
    }
    return `${item.date ? new Date(item.date).toLocaleDateString() : ''}: ${item.status || 'No record'}`;
  };

  // Build fixed 52 weeks with today on right
  const getWeeks = () => {
    if (!data) return { weeks: [], monthBreaks: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of date string to data
    const dataMap = {};
    data.forEach(item => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      dataMap[dateStr] = item;
    });

    // Calculate start date: go back 52 weeks from today, then back to Sunday
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (51 * 7) - endDate.getDay()); // 52 weeks minus days to reach Sunday

    const weeks = [];
    const monthBreaks = [];
    let currentDate = new Date(startDate);
    let currentMonth = -1;

    while (currentDate <= today) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (currentDate > today) {
          // Future dates - don't show
          week.push(null);
        } else {
          const dateStr = currentDate.toISOString().split('T')[0];
          const item = dataMap[dateStr];

          // Track month changes for labels
          if (currentDate.getMonth() !== currentMonth) {
            currentMonth = currentDate.getMonth();
            monthBreaks.push({
              month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: weeks.length
            });
          }

          week.push(item || null);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthBreaks };
  };

  const { weeks, monthBreaks } = getWeeks();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (weeks.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-4">
        No attendance data to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max">
        {/* Days of week labels */}
        <div className="flex flex-col gap-1 mr-3">
          {daysOfWeek.map((day) => (
            <div key={day} className="h-5 flex items-center text-xs text-slate-400 w-8">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks columns */}
        <div className="flex flex-col">
          {/* Month labels with breaks */}
          <div className="flex h-5 mb-1 items-end">
            {monthBreaks.map((mb, i) => (
              <div key={i} className="flex items-end">
                {i > 0 && <div className="w-px h-4 bg-slate-300 mr-4"></div>}
                <span className="text-xs text-slate-500 whitespace-nowrap">{mb.month}</span>
              </div>
            ))}
          </div>

          {/* Grid - scroll to right by default to show today */}
          <div className="flex gap-1" ref={(el) => el?.scrollTo({ left: el?.scrollWidth, behavior: 'smooth' })}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((item, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-5 h-5 rounded-sm cursor-pointer transition-transform hover:scale-125 ${getCellColor(item)}`}
                    title={getTooltip(item)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceHeatmap;
