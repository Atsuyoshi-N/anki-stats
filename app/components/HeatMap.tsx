"use client";

import type { DeckData } from "@/types/anki";

interface Props {
  decks: DeckData[];
}

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getColor(count: number, max: number): string {
  if (count === 0) return "#f0f0f0";
  const ratio = count / max;
  if (ratio < 0.25) return "#bbf7d0";
  if (ratio < 0.5) return "#4ade80";
  if (ratio < 0.75) return "#16a34a";
  return "#166534";
}

function buildGrid() {
  const today = new Date();
  const days: { date: string; weekday: number }[] = [];

  // Go back to the Sunday 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  const cur = new Date(start);
  while (cur <= today) {
    days.push({
      date: cur.toISOString().split("T")[0],
      weekday: cur.getDay(),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function HeatMap({ decks }: Props) {
  // Aggregate total reviews per day across all decks
  const totalByDate: Record<string, number> = {};
  for (const deck of decks) {
    for (const d of deck.dailyStats) {
      totalByDate[d.date] = (totalByDate[d.date] ?? 0) + d.reviews;
    }
  }

  const maxReviews = Math.max(...Object.values(totalByDate), 1);
  const days = buildGrid();

  // Group into weeks (columns)
  const weeks: { date: string; weekday: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Month labels: find first day of each month in weeks
  const monthLabels: { colIndex: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0].date);
    if (firstDay.getMonth() !== lastMonth) {
      lastMonth = firstDay.getMonth();
      monthLabels.push({
        colIndex: wi,
        label: `${firstDay.getMonth() + 1}月`,
      });
    }
  });

  const CELL = 14;
  const GAP = 2;
  const LABEL_HEIGHT = 20;
  const SIDE_LABEL_WIDTH = 24;

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">学習ヒートマップ</h2>
      <p className="text-xs text-gray-400 mb-4">過去1年間の日別学習枚数</p>

      <div className="overflow-x-auto">
        <svg
          width={SIDE_LABEL_WIDTH + weeks.length * (CELL + GAP)}
          height={LABEL_HEIGHT + 7 * (CELL + GAP)}
        >
          {/* Month labels */}
          {monthLabels.map(({ colIndex, label }) => (
            <text
              key={label + colIndex}
              x={SIDE_LABEL_WIDTH + colIndex * (CELL + GAP)}
              y={12}
              fontSize={10}
              fill="#6b7280"
            >
              {label}
            </text>
          ))}

          {/* Weekday labels */}
          {[1, 3, 5].map((wd) => (
            <text
              key={wd}
              x={0}
              y={LABEL_HEIGHT + wd * (CELL + GAP) + CELL - 2}
              fontSize={10}
              fill="#6b7280"
            >
              {WEEK_DAYS[wd]}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day) => {
              const count = totalByDate[day.date] ?? 0;
              return (
                <rect
                  key={day.date}
                  x={SIDE_LABEL_WIDTH + wi * (CELL + GAP)}
                  y={LABEL_HEIGHT + day.weekday * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={getColor(count, maxReviews)}
                >
                  <title>{`${day.date}: ${count} 枚`}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs text-gray-400 mr-1">少</span>
        {["#f0f0f0", "#bbf7d0", "#4ade80", "#16a34a", "#166534"].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-xs text-gray-400 ml-1">多</span>
      </div>
    </section>
  );
}
