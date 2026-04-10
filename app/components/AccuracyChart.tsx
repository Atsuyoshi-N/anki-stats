"use client";

import { useState } from "react";
import type { DeckData } from "@/types/anki";
import {
  LineChart,
  Line,
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

function movingAverage(
  deck: DeckData,
  dates: string[],
  window: number
): Record<string, number | null> {
  const map = Object.fromEntries(deck.dailyStats.map((s) => [s.date, s]));
  const result: Record<string, number | null> = {};
  for (let i = 0; i < dates.length; i++) {
    const slice = dates.slice(Math.max(0, i - window + 1), i + 1);
    const entries = slice.map((d) => map[d]).filter(Boolean);
    if (entries.length === 0) {
      result[dates[i]] = null;
    } else {
      const totalReviews = entries.reduce((s, e) => s + e.reviews, 0);
      const totalCorrect = entries.reduce((s, e) => s + e.correctRate * e.reviews, 0);
      result[dates[i]] = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 1000) / 10 : null;
    }
  }
  return result;
}

export default function AccuracyChart({ decks }: Props) {
  const [range, setRange] = useState<Range>("30");

  const cutoff = range === "all" ? "" : subtractDays(Number(range));

  const dateSet = new Set<string>();
  for (const deck of decks) {
    for (const d of deck.dailyStats) {
      if (!cutoff || d.date >= cutoff) dateSet.add(d.date);
    }
  }
  const dates = Array.from(dateSet).sort();

  const maData = decks.map((deck) => ({
    deck,
    ma: movingAverage(deck, dates, 7),
  }));

  const chartData = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const { deck, ma } of maData) {
      const shortName = deck.name.split("::").pop() ?? deck.name;
      row[shortName] = ma[date] ?? null;
    }
    return row;
  });

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">正答率推移 <span className="text-sm text-gray-400 font-normal">(7日移動平均)</span></h2>
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
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: "#fff" }}
            formatter={(value, name) => {
              const v = value as number | null | undefined;
              return v != null ? [`${v}%`, String(name)] : ["データなし", String(name)];
            }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
          {decks.map((deck, i) => {
            const shortName = deck.name.split("::").pop() ?? deck.name;
            return (
              <Line
                key={deck.name}
                type="monotone"
                dataKey={shortName}
                stroke={DECK_COLORS[i % DECK_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
