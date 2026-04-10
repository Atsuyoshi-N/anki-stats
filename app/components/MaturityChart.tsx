"use client";

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

const BUCKET_ORDER = ["unseen", "0", "1-7", "8-21", "22-90", "91-365", "365+"];
const BUCKET_LABELS: Record<string, string> = {
  "unseen": "未学習",
  "0": "新規",
  "1-7": "1-7日",
  "8-21": "8-21日",
  "22-90": "22-90日",
  "91-365": "91-365日",
  "365+": "365日+",
};

export default function MaturityChart({ decks }: Props) {
  const chartData = BUCKET_ORDER.map((bucket) => {
    const row: Record<string, string | number> = { bucket: BUCKET_LABELS[bucket] ?? bucket };
    for (const deck of decks) {
      const shortName = deck.name.split("::").pop() ?? deck.name;
      const found = deck.maturityDistribution.find((m) => m.range === bucket);
      row[shortName] = found?.count ?? 0;
    }
    return row;
  }).filter((row) => {
    const total = Object.entries(row)
      .filter(([k]) => k !== "bucket")
      .reduce((s, [, v]) => s + (v as number), 0);
    return total > 0;
  });

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">カード成熟度分布</h2>
      <p className="text-xs text-gray-400 mb-4">カードの復習間隔(interval)に基づく分布</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
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
