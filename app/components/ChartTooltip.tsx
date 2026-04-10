"use client";

import type { TooltipPayloadEntry } from "recharts/types/state/tooltipSlice";

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[];
  label?: string | number;
  unit?: string;
}

export default function ChartTooltip({ active, payload, label, unit = "" }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs relative z-50">
      <p className="text-gray-500 mb-1">{String(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-700">{entry.name}</span>
          <span className="ml-auto font-medium text-gray-900">
            {Number(entry.value).toLocaleString()}{unit}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-gray-100">
          <span className="text-gray-600 font-medium">合計</span>
          <span className="ml-auto font-bold text-gray-900">
            {total.toLocaleString()}{unit}
          </span>
        </div>
      )}
    </div>
  );
}
