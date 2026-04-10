"use client";

import { useState } from "react";
import type { DeckData } from "@/types/anki";
import {
  BarChart,
  Bar,
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

export default function DailyReviewChart({ decks }: Props) {
  const [range, setRange] = useState<Range>("30");

  const cutoff = range === "all" ? "" : subtractDays(Number(range));

  // Collect all dates
  const dateSet = new Set<string>();
  for (const deck of decks) {
    for (const d of deck.dailyStats) {
      if (!cutoff || d.date >= cutoff) dateSet.add(d.date);
    }
  }
  const dates = Array.from(dateSet).sort();

  // Build chart data: one row per date, one key per deck
  const chartData = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const deck of decks) {
      const shortName = deck.name.split("::").pop() ?? deck.name;
      const found = deck.dailyStats.find((s) => s.date === date);
      row[shortName] = found?.reviews ?? 0;
    }
    return row;
  });

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">日別学習枚数</h2>
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
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => [Number(value).toLocaleString() + " 枚", String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {decks.map((deck, i) => {
            const shortName = deck.name.split("::").pop() ?? deck.name;
            return (
              <Bar
                key={deck.name}
                dataKey={shortName}
                stackId="a"
                fill={DECK_COLORS[i % DECK_COLORS.length]}
                radius={i === decks.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
