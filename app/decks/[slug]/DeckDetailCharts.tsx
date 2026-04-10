"use client";

import { useState } from "react";
import type { DeckData, DailyStats } from "@/types/anki";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartTooltip from "@/app/components/ChartTooltip";

const COLORS = [
  "#60a5fa", "#4ade80", "#fb923c", "#f472b6",
  "#a78bfa", "#34d399", "#fbbf24", "#f87171",
  "#38bdf8", "#a3e635", "#e879f9", "#fb7185",
];

type Range = "7" | "30" | "all";

function subtractDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function RangeSelector({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex gap-1">
      {(["7", "30", "all"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
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
  );
}

interface Series {
  name: string;
  shortName: string;
  dailyStats: DailyStats[];
}

function buildSeries(deck: DeckData): Series[] {
  if (deck.children.length > 0) {
    return deck.children.map((child) => ({
      name: child.name,
      shortName: child.name.split("::").pop() ?? child.name,
      dailyStats: child.dailyStats,
    }));
  }
  return [{
    name: deck.name,
    shortName: deck.name,
    dailyStats: deck.dailyStats,
  }];
}

function collectDates(series: Series[], cutoff: string): string[] {
  const dateSet = new Set<string>();
  for (const s of series) {
    for (const d of s.dailyStats) {
      if (!cutoff || d.date >= cutoff) dateSet.add(d.date);
    }
  }
  return Array.from(dateSet).sort();
}

function movingAverage(
  dailyStats: DailyStats[],
  dates: string[],
  window: number
): Record<string, number | null> {
  const map = Object.fromEntries(dailyStats.map((s) => [s.date, s]));
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

export default function DeckDetailCharts({ deck }: { deck: DeckData }) {
  const [reviewRange, setReviewRange] = useState<Range>("30");
  const [timeRange, setTimeRange] = useState<Range>("30");
  const [accRange, setAccRange] = useState<Range>("30");

  const series = buildSeries(deck);
  const hasChildren = deck.children.length > 0;

  // --- Daily Reviews ---
  const reviewCutoff = reviewRange === "all" ? "" : subtractDays(Number(reviewRange));
  const reviewDates = collectDates(series, reviewCutoff);
  const reviewData = reviewDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const found = s.dailyStats.find((d) => d.date === date);
      row[s.shortName] = found?.reviews ?? 0;
    }
    return row;
  });

  // --- Study Time ---
  const timeCutoff = timeRange === "all" ? "" : subtractDays(Number(timeRange));
  const timeDates = collectDates(series, timeCutoff);
  const timeData = timeDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const found = s.dailyStats.find((d) => d.date === date);
      row[s.shortName] = found ? Math.round(found.studyTimeMs / 60000) : 0;
    }
    return row;
  });

  // --- Accuracy ---
  const accCutoff = accRange === "all" ? "" : subtractDays(Number(accRange));
  const accDates = collectDates(series, accCutoff);
  const maData = series.map((s) => ({
    series: s,
    ma: movingAverage(s.dailyStats, accDates, 7),
  }));
  const accData = accDates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const { series: s, ma } of maData) {
      row[s.shortName] = ma[date] ?? null;
    }
    return row;
  });

  return (
    <>
      {/* Daily Reviews */}
      <section className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            日別学習枚数
            {hasChildren && <span className="text-sm text-gray-400 font-normal ml-2">(子デッキ別)</span>}
          </h2>
          <RangeSelector range={reviewRange} onChange={setReviewRange} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reviewData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={(props) => <ChartTooltip {...props} unit=" 枚" />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Bar key={s.name} dataKey={s.shortName} stackId="a" fill={COLORS[i % COLORS.length]}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Study Time */}
      <section className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            日別学習時間
            {hasChildren && <span className="text-sm text-gray-400 font-normal ml-2">(子デッキ別)</span>}
          </h2>
          <RangeSelector range={timeRange} onChange={setTimeRange} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} unit="分" />
            <Tooltip content={(props) => <ChartTooltip {...props} unit=" 分" />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => {
              const color = COLORS[i % COLORS.length];
              return <Area key={s.name} type="monotone" dataKey={s.shortName} stackId="a" stroke={color} fill={color} fillOpacity={0.7} />;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Accuracy */}
      <section className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            正答率推移
            <span className="text-sm text-gray-400 font-normal ml-2">(7日移動平均{hasChildren ? "・子デッキ別" : ""})</span>
          </h2>
          <RangeSelector range={accRange} onChange={setAccRange} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={accData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: "#fff" }} formatter={(value, name) => {
              const v = value as number | null | undefined;
              return v != null ? [`${v}%`, String(name)] : ["データなし", String(name)];
            }} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Line key={s.name} type="monotone" dataKey={s.shortName} stroke={COLORS[i % COLORS.length]}
                strokeWidth={2} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </section>
    </>
  );
}
