function AcademicYearHeatmap({ data }) {
  // Get academic year range
  const getAcademicYearRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let startYear;
    if (currentMonth >= 2) {
      startYear = currentYear;
    } else {
      startYear = currentYear - 1;
    }

    const startDate = new Date(startYear, 2, 1);
    const endDate = new Date(today);

    return { startDate, endDate };
  };

  const { startDate, endDate } = getAcademicYearRange();

  const dataMap = {};
  if (data) {
    data.forEach(item => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      dataMap[dateStr] = item;
    });
  }

  const getWeeks = () => {
    const weeks = [];
    let currentDate = new Date(startDate);
    let currentWeek = [];

    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      currentWeek.push(dataMap[dateStr] || null);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const getMonthLabels = () => {
    const labels = [];
    const weeks = getWeeks();
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValid = week.find(d => d !== null);
      if (firstValid) {
        const date = new Date(firstValid.date);
        if (date.getMonth() !== currentMonth) {
          currentMonth = date.getMonth();
          labels.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex
          });
        }
      }
    });

    return labels;
  };

  const weeks = getWeeks();
  const monthLabels = getMonthLabels();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCellColor = (item) => {
    if (!item) return 'bg-slate-100';
    if (item.count !== undefined) {
      if (item.count === 0) return 'bg-slate-200';
      if (item.count === 1) return 'bg-emerald-300';
      if (item.count === 2) return 'bg-emerald-500';
      return 'bg-emerald-700';
    }
    if (item.status === 'present') return 'bg-green-500';
    if (item.status === 'absent') return 'bg-orange-500';
    return 'bg-slate-300';
  };

  const getTooltip = (item) => {
    if (!item) return '';
    if (item.tooltip) return item.tooltip;
    if (item.count !== undefined) {
      return `${item.date ? new Date(item.date).toLocaleDateString() : ''}: ${item.count} class${item.count !== 1 ? 'es' : ''} attended`;
    }
    return `${item.date ? new Date(item.date).toLocaleDateString() : ''}: ${item.status || 'No class'}`;
  };

  return (
    <div className="w-full">
      {/* Day labels on left */}
      <div className="flex">
        <div className="flex flex-col gap-1 mr-2">
          {daysOfWeek.map((day, i) => (
            <div
              key={day}
              className="h-3 flex items-center text-xs text-slate-400 w-6"
            >
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Main grid - overflow-x-auto with inline-flex */}
        <div className="overflow-x-auto flex-1">
          <div className="inline-flex gap-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-y-1">
                {week.map((item, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm cursor-pointer hover:scale-125 ${getCellColor(item)}`}
                    title={getTooltip(item)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month labels below */}
      <div className="flex mt-1">
        <div className="w-8 mr-2"></div>
        <div className="overflow-x-auto flex-1">
          <div className="inline-flex gap-x-1">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-slate-500"
                style={{ width: '12px' }}
              >
                {label.month}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcademicYearHeatmap;
