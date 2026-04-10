import Link from "next/link";
import type { AnkiData } from "@/types/anki";
import ankiDataRaw from "@/data/anki-data.json";
import DeckDetailCharts from "./DeckDetailCharts";

const ankiData = ankiDataRaw as AnkiData;

export function generateStaticParams() {
  return ankiData.decks.map((deck) => ({ slug: deck.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DeckDetailPage({ params }: Props) {
  const { slug } = await params;
  const deck = ankiData.decks.find((d) => d.slug === slug);

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">デッキが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{deck.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats summary */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "新規", value: deck.stats.new, color: "text-blue-500" },
              { label: "学習中", value: deck.stats.learning, color: "text-orange-400" },
              { label: "復習", value: deck.stats.review, color: "text-green-400" },
              { label: "停止中", value: deck.stats.suspended, color: "text-gray-400" },
              { label: "合計", value: deck.stats.total, color: "text-gray-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <DeckDetailCharts deck={deck} />
      </main>
    </div>
  );
}
