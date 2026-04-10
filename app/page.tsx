import type { AnkiData } from "@/types/anki";
import DeckOverview from "@/app/components/DeckOverview";
import DailyReviewChart from "@/app/components/DailyReviewChart";
import StudyTimeChart from "@/app/components/StudyTimeChart";
import AccuracyChart from "@/app/components/AccuracyChart";
import MaturityChart from "@/app/components/MaturityChart";
import HeatMap from "@/app/components/HeatMap";
import ankiDataRaw from "@/data/anki-data.json";

const ankiData = ankiDataRaw as AnkiData;

export default function Home() {
  const { fetchedAt, decks } = ankiData;
  const fetchedDate = new Date(fetchedAt).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Anki Stats</h1>
          <p className="text-xs text-gray-400">最終取得: {fetchedDate}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <HeatMap decks={decks} />
        <DeckOverview decks={decks} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyReviewChart decks={decks} />
          <StudyTimeChart decks={decks} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccuracyChart decks={decks} />
          <MaturityChart decks={decks} />
        </div>
      </main>
    </div>
  );
}
