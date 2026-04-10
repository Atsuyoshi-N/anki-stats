"use client";

import { useState } from "react";
import type { DeckData } from "@/types/anki";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  decks: DeckData[];
}

const DECK_COLORS = [
  "#60a5fa", "#4ade80", "#fb923c", "#f472b6",
  "#a78bfa", "#34d399", "#fbbf24", "#f87171",
];

type Range = "7" | "30" | "all";

function subtractDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function msToMin(ms: number): number {
  return Math.round(ms / 60000);
}

export default function StudyTimeChart({ decks }: Props) {
  const [range, setRange] = useState<Range>("30");

  const cutoff = range === "all" ? "" : subtractDays(Number(range));

  const dateSet = new Set<string>();
  for (const deck of decks) {
    for (const d of deck.dailyStats) {
      if (!cutoff || d.date >= cutoff) dateSet.add(d.date);
    }
  }
  const dates = Array.from(dateSet).sort();

  const chartData = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const deck of decks) {
      const shortName = deck.name.split("::").pop() ?? deck.name;
      const found = deck.dailyStats.find((s) => s.date === date);
      row[shortName] = found ? msToMin(found.studyTimeMs) : 0;
    }
    return row;
  });

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">日別学習時間</h2>
        <div className="flex gap-1">
          {(["7", "30", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                range === r
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r === "all" ? "全期間" : `${r}日`}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} unit="分" />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => [`${Number(value)} 分`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {decks.map((deck, i) => {
            const shortName = deck.name.split("::").pop() ?? deck.name;
            const color = DECK_COLORS[i % DECK_COLORS.length];
            return (
              <Area
                key={deck.name}
                type="monotone"
                dataKey={shortName}
                stackId="a"
                stroke={color}
                fill={color}
                fillOpacity={0.7}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
