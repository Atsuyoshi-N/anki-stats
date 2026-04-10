"use client";

import Link from "next/link";
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
import ChartTooltip from "./ChartTooltip";

interface Props {
  decks: DeckData[];
}

const COLORS = {
  new: "#60a5fa",
  learning: "#fb923c",
  review: "#4ade80",
  suspended: "#94a3b8",
};

export default function DeckOverview({ decks }: Props) {
  const totals = decks.reduce(
    (acc, d) => ({
      new: acc.new + d.stats.new,
      learning: acc.learning + d.stats.learning,
      review: acc.review + d.stats.review,
      suspended: acc.suspended + d.stats.suspended,
      total: acc.total + d.stats.total,
    }),
    { new: 0, learning: 0, review: 0, suspended: 0, total: 0 }
  );

  const chartData = decks.map((d) => ({
    name: d.name.split("::").pop() ?? d.name,
    fullName: d.name,
    新規: d.stats.new,
    学習中: d.stats.learning,
    復習: d.stats.review,
    停止中: d.stats.suspended,
  }));

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">デッキ概要</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(
          [
            { label: "新規", value: totals.new, color: "text-blue-500" },
            { label: "学習中", value: totals.learning, color: "text-orange-400" },
            { label: "復習", value: totals.review, color: "text-green-400" },
            { label: "合計", value: totals.total, color: "text-gray-700" },
          ] as const
        ).map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="pb-2 pr-4 font-medium">デッキ</th>
              <th className="pb-2 px-3 font-medium text-right text-blue-500">新規</th>
              <th className="pb-2 px-3 font-medium text-right text-orange-400">学習中</th>
              <th className="pb-2 px-3 font-medium text-right text-green-400">復習</th>
              <th className="pb-2 px-3 font-medium text-right text-gray-400">停止中</th>
              <th className="pb-2 pl-3 font-medium text-right text-gray-700">合計</th>
            </tr>
          </thead>
          <tbody>
            {decks.map((d) => (
              <tr key={d.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium max-w-[200px] truncate" title={d.name}>
                  <Link
                    href={`/decks/${d.slug}/`}
                    className="text-blue-600 hover:underline"
                  >
                    {d.name}
                  </Link>
                </td>
                <td className="py-2 px-3 text-right text-blue-500">{d.stats.new.toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-orange-400">{d.stats.learning.toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-green-400">{d.stats.review.toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-gray-400">{d.stats.suspended.toLocaleString()}</td>
                <td className="py-2 pl-3 text-right font-semibold text-gray-700">{d.stats.total.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="py-2 pr-4 text-gray-700">合計</td>
              <td className="py-2 px-3 text-right text-blue-500">{totals.new.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-orange-400">{totals.learning.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-green-400">{totals.review.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-gray-400">{totals.suspended.toLocaleString()}</td>
              <td className="py-2 pl-3 text-right text-gray-700">{totals.total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stacked bar */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={(props) => <ChartTooltip {...props} unit=" 枚" />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="新規" stackId="a" fill={COLORS.new} />
          <Bar dataKey="学習中" stackId="a" fill={COLORS.learning} />
          <Bar dataKey="復習" stackId="a" fill={COLORS.review} />
          <Bar dataKey="停止中" stackId="a" fill={COLORS.suspended} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
