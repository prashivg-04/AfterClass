import { useState } from 'react';

function Rolling365Heatmap({ intensityMap, tuitionCreatedAt, studentJoinedAt, mode = 'status' }) {
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    dateStr: '',
    intensity: 0,
  });

  // Determine if this is count-based mode (dashboard) or status-based mode (tuition detail)
  const isCountMode = mode === 'count';

  // Color mapping based on mode
  const getCellColor = (item) => {
    if (!item) return 'transparent'; // Completely invisible placeholder slots

    if (isCountMode) {
      // Dashboard count-based: 0 → slate-200, 1 → emerald-300, 2 → emerald-500, 3+ → emerald-700
      if (item.intensity === 0) return '#e2e8f0'; // slate-200
      if (item.intensity === 1) return '#6ee7b7'; // emerald-300
      if (item.intensity === 2) return '#10b981'; // emerald-500
      return '#047857'; // emerald-700 for 3+
    } else {
      // Tuition status-based: 0 → no record, 1 → absent, 2+ → present
      if (item.intensity === 0) return '#e2e8f0'; // slate-200 for 0
      if (item.intensity === 1) return '#f87171'; // red-400 for 1 (absent)
      return '#10b981'; // emerald-500 for 2+ (present)
    }
  };

  // Get tooltip text based on mode
  const getTooltipText = (intensity) => {
    if (isCountMode) {
      // Count-based: "0 classes attended", "1 class attended", "2 classes attended", etc.
      if (intensity === 0) return '0 classes attended';
      if (intensity === 1) return '1 class attended';
      return `${intensity} classes attended`;
    } else {
      // Status-based: "Absent", "Present", "No record"
      if (intensity === 0) return 'No record';
      if (intensity === 1) return 'Absent';
      return 'Present';
    }
  };

  // Generate 365 days ending today
  const get365Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    const formatLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    return days;
  };

  const days = get365Days();

  // Group days by month and year specifically
  const getMonthBlocks = () => {
    const blocks = [];
    let currentBlock = null;

    days.forEach((date) => {
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const blockId = `${year}-${monthIndex}`;

      if (!currentBlock || currentBlock.id !== blockId) {
        currentBlock = {
          id: blockId,
          monthIndex,
          year,
          weeks: [],
          totalDays: 0,
        };
        blocks.push(currentBlock);
      }

      // Track how many active days from this month are in the rolling window
      currentBlock.totalDays++;

      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6

      let currentWeek = currentBlock.weeks[currentBlock.weeks.length - 1];

      // Start a new week array when we don't have one or if it's a Monday
      if (!currentWeek || adjustedDay === 0) {
        currentWeek = new Array(7).fill(null);
        currentBlock.weeks.push(currentWeek);
      }

      // Use local date construction to avoid UTC shift
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const intensity = intensityMap?.[dateStr] ?? 0;

      currentWeek[adjustedDay] = { date, dateStr, intensity };
    });

    return blocks;
  };

  const allBlocks = getMonthBlocks();

  // Logic to prevent duplicate labels on rolling window ends.
  const blocksMap = new Map();
  allBlocks.forEach((block) => {
    const key = block.monthIndex; // just the month integer (0-11)
    if (blocksMap.has(key)) {
      const existing = blocksMap.get(key);
      if (block.totalDays > existing.totalDays) {
        existing.hideLabel = true;
      } else {
        block.hideLabel = true;
      }
    } else {
      blocksMap.set(key, block);
    }
  });

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Viewport-aware tooltip positioning logic
  const handleMouseEnter = (e, item) => {
    if (!item) return;

    // Check viewport constraints to avoid overflow right
    const xPos = e.clientX;
    const isNearRightEdge = window.innerWidth - xPos < 150;

    // YYYY-MM-DD from Props are already normalized parent, compare directly
    const specialEvents = [];
    if (tuitionCreatedAt && item.dateStr === tuitionCreatedAt) specialEvents.push('Tuition created');
    if (studentJoinedAt && item.dateStr === studentJoinedAt) specialEvents.push('Student joined');

    // Use the mode-specific tooltip text function
    const tooltipText = getTooltipText(item.intensity);

    // Format tooltip date from normalized YYYY-MM-DD to display format
    const tooltipDate = (() => {
      if (!item.dateStr) return '';
      const [year, month, day] = item.dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    })();

    setTooltip({
      visible: true,
      x: isNearRightEdge ? xPos - 140 : xPos + 10, // Shift left if too close to right edge
      y: e.clientY - 35, // Position slightly above the cursor
      dateStr: tooltipDate,
      tooltipText,
      specialEvents
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const cellSize = 12;
  const cellGap = 4;
  const monthGap = 16;

  // Check if marker dates fall within rolling 365-day window
  const isWithinRollingWindow = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Parse YYYY-MM-DD as local date to avoid timezone shifting
    const [year, month, day] = dateStr.split('-').map(Number);
    const checkDate = new Date(year, month - 1, day);
    return checkDate >= startDate && checkDate <= today;
  };

  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-hide relative">
      <div className="flex w-max" style={{ gap: `${monthGap}px` }}>
        {allBlocks.map((block) => (
          <div key={block.id} className="flex flex-col">
            {/* Heatmap block logic */}
            <div className="flex" style={{ gap: `${cellGap}px` }}>
              {block.weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  className="flex flex-col"
                  style={{ gap: `${cellGap}px` }}
                >
                  {week.map((item, dIdx) => {
                    if (!item) {
                      return (
                        <div
                          key={dIdx}
                          style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                        />
                      );
                    }

                    // Props are already normalized YYYY-MM-DD, compare directly
                    // Only show marker if within rolling 365-day window
                    const isTuitionCreated = tuitionCreatedAt && item.dateStr === tuitionCreatedAt && isWithinRollingWindow(item.dateStr);
                    const isStudentJoined = studentJoinedAt && item.dateStr === studentJoinedAt && isWithinRollingWindow(item.dateStr);

                    return (
                      <div
                        key={dIdx}
                        className="relative rounded-[2px] overflow-hidden" // overflow-hidden keeps corner accents clean against cell rounding
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          backgroundColor: getCellColor(item),
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, item)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {isTuitionCreated && (
                          <div className="absolute top-0 left-0 w-0 h-0 border-t-[5px] border-r-[5px] border-t-blue-500 border-r-transparent pointer-events-none" />
                        )}
                        {isStudentJoined && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-purple-500 border-l-transparent pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Associated Month Label */}
            <div className="relative mt-2 h-[16px] w-full">
              {!block.hideLabel && (
                <div className="absolute inset-0 text-[13px] text-slate-500 text-center whitespace-nowrap">
                  {monthLabels[block.monthIndex]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Global Instant Tooltip matching strict visual design guidelines */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none rounded px-3 py-2 text-xs text-white bg-slate-800 shadow-md animate-in fade-in duration-100 flex flex-col items-center gap-1"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <span className="font-medium text-slate-300">{tooltip.dateStr}</span>
          <span>{tooltip.tooltipText}</span>
          {tooltip.specialEvents && tooltip.specialEvents.map((event, idx) => (
            <span key={idx} className={event.includes('Tuition') ? 'text-blue-300' : 'text-purple-300'}>
              {event}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Rolling365Heatmap;
