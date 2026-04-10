import fs from "fs";
import path from "path";
import type { AnkiData, DeckData, DailyStats, MaturityBucket } from "../types/anki";

const ANKI_CONNECT_URL = "http://localhost:8765";

async function invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params }),
  });
  const json = (await res.json()) as { result: T; error: string | null };
  if (json.error) throw new Error(`AnkiConnect error [${action}]: ${json.error}`);
  return json.result;
}

// AnkiConnect cardReviews returns: [usn, ease, ivl, lastIvl, factor, time, type][]
type ReviewEntry = [number, number, number, number, number, number, number];

// AnkiConnect cardsInfo card type
interface CardInfo {
  cardId: number;
  interval: number;
  type: number;   // 0=new, 1=learn, 2=review, 3=relearn
  queue: number;  // -1=suspended, 0=new, 1=learn, 2=review, 3=dayLearn, 4=preview
  reps: number;
  lapses: number;
}

function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

function epochDayToDateString(days: number): string {
  const d = new Date(days * 86400000);
  return d.toISOString().split("T")[0];
}

function getMaturityBucket(interval: number): string {
  if (interval < 0) return "unseen";
  if (interval === 0) return "0";
  if (interval <= 7) return "1-7";
  if (interval <= 21) return "8-21";
  if (interval <= 90) return "22-90";
  if (interval <= 365) return "91-365";
  return "365+";
}

const BUCKET_ORDER = ["unseen", "0", "1-7", "8-21", "22-90", "91-365", "365+"];

async function fetchDeckData(deckName: string, allDeckNames: string[]): Promise<DeckData> {
  // Card IDs in deck (findCards with deck:"Parent" includes child decks)
  const cardIds = await invoke<number[]>("findCards", { query: `deck:"${deckName}"` });

  // Card details
  const cards = cardIds.length > 0
    ? await invoke<CardInfo[]>("cardsInfo", { cards: cardIds })
    : [];

  // Stats
  const stats: DeckData["stats"] = { new: 0, learning: 0, review: 0, suspended: 0, total: cards.length };
  for (const card of cards) {
    if (card.queue === -1) stats.suspended++;
    else if (card.type === 0) stats.new++;
    else if (card.type === 1 || card.type === 3) stats.learning++;
    else if (card.type === 2) stats.review++;
  }

  // Maturity distribution
  const bucketMap: Record<string, number> = {};
  for (const card of cards) {
    const b = getMaturityBucket(card.interval);
    bucketMap[b] = (bucketMap[b] ?? 0) + 1;
  }
  const maturityDistribution: MaturityBucket[] = BUCKET_ORDER
    .filter((r) => bucketMap[r] !== undefined)
    .map((r) => ({ range: r, count: bucketMap[r] }));

  // Collect this deck + all child decks for review history
  const relatedDecks = allDeckNames.filter(
    (name) => name === deckName || name.startsWith(deckName + "::")
  );
  const dailyStats = await buildDailyStats(relatedDecks);

  return { name: deckName, stats, maturityDistribution, dailyStats };
}

async function buildDailyStats(deckNames: string[]): Promise<DailyStats[]> {
  const cutoffMs = Date.now() - 365 * 86400000;
  const dailyMap: Record<string, { reviews: number; studyTimeMs: number; correct: number }> = {};

  // Fetch cardReviews for each deck (parent + children) and aggregate
  for (const deck of deckNames) {
    const rows = await invoke<[number, number, number, number, number, number, number, number][]>(
      "cardReviews",
      { deck, startID: cutoffMs }
    );

    for (const [id, , ease, , , , timeMs] of rows) {
      if (timeMs <= 0) continue;
      const dateStr = epochDayToDateString(Math.floor(id / 86400000));
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { reviews: 0, studyTimeMs: 0, correct: 0 };
      dailyMap[dateStr].reviews++;
      dailyMap[dateStr].studyTimeMs += timeMs;
      if (ease >= 2) dailyMap[dateStr].correct++;
    }
  }

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      reviews: d.reviews,
      studyTimeMs: d.studyTimeMs,
      correctRate: d.reviews > 0 ? d.correct / d.reviews : 0,
    }));
}

async function main() {
  console.log("Connecting to AnkiConnect...");

  const allDeckNames = await invoke<string[]>("deckNames");
  // Only fetch top-level decks (no "::" separator).
  // Anki's findCards with deck:"Parent" includes all child decks automatically.
  const topLevelDecks = allDeckNames.filter(
    (name) => name !== "Default" && !name.includes("::")
  );
  console.log(`Found ${allDeckNames.length} total decks, ${topLevelDecks.length} top-level:`, topLevelDecks);

  const decks: DeckData[] = [];
  for (const name of topLevelDecks) {
    console.log(`  Fetching: ${name}`);
    const deck = await fetchDeckData(name, allDeckNames);
    decks.push(deck);
  }

  const data: AnkiData = {
    fetchedAt: new Date().toISOString(),
    decks,
  };

  const outPath = path.resolve(process.cwd(), "data", "anki-data.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
