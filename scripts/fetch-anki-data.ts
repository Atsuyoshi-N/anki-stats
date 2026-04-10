import fs from "fs";
import path from "path";
import type { AnkiData, DeckData, DailyStats, MaturityBucket, ChildDeckData } from "../types/anki";

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

interface CardInfo {
  cardId: number;
  interval: number;
  type: number;
  queue: number;
  reps: number;
  lapses: number;
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

function toSlug(deckName: string): string {
  return encodeURIComponent(deckName.replace(/ /g, "_"));
}

async function fetchReviewRows(deckName: string): Promise<number[][]> {
  const cutoffMs = Date.now() - 365 * 86400000;
  return invoke<number[][]>("cardReviews", { deck: deckName, startID: cutoffMs });
}

function aggregateDaily(rows: number[][]): DailyStats[] {
  const dailyMap: Record<string, { reviews: number; studyTimeMs: number; correct: number }> = {};

  for (const row of rows) {
    const id = row[0];
    const ease = row[3];
    const timeMs = row[7];
    if (timeMs <= 0) continue;
    const dateStr = new Date(id).toLocaleDateString("sv-SE");
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { reviews: 0, studyTimeMs: 0, correct: 0 };
    dailyMap[dateStr].reviews++;
    dailyMap[dateStr].studyTimeMs += timeMs;
    if (ease >= 2) dailyMap[dateStr].correct++;
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

async function fetchDeckData(deckName: string, allDeckNames: string[]): Promise<DeckData> {
  // Card IDs in deck (findCards with deck:"Parent" includes child decks)
  const cardIds = await invoke<number[]>("findCards", { query: `deck:"${deckName}"` });

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

  // Collect child deck names (direct children only: "Parent::Child" but not "Parent::Child::Grandchild")
  const childDeckNames = allDeckNames.filter(
    (name) => name.startsWith(deckName + "::") && !name.slice(deckName.length + 2).includes("::")
  );

  // All related decks for total daily stats
  const allRelated = allDeckNames.filter(
    (name) => name === deckName || name.startsWith(deckName + "::")
  );

  // Fetch review rows for all related decks
  const allRows: number[][] = [];
  for (const dk of allRelated) {
    const rows = await fetchReviewRows(dk);
    allRows.push(...rows);
  }
  const dailyStats = aggregateDaily(allRows);

  // Build per-child daily stats (each child includes its own sub-children)
  const children: ChildDeckData[] = [];
  if (childDeckNames.length > 0) {
    // Reviews directly in parent deck (not in any child)
    const parentRows = await fetchReviewRows(deckName);
    if (parentRows.length > 0) {
      children.push({
        name: deckName + " (直接)",
        dailyStats: aggregateDaily(parentRows),
      });
    }

    for (const childName of childDeckNames) {
      const childRelated = allDeckNames.filter(
        (name) => name === childName || name.startsWith(childName + "::")
      );
      const childRows: number[][] = [];
      for (const dk of childRelated) {
        const rows = await fetchReviewRows(dk);
        childRows.push(...rows);
      }
      const childDaily = aggregateDaily(childRows);
      if (childDaily.length > 0) {
        children.push({ name: childName, dailyStats: childDaily });
      }
    }
  }

  return {
    name: deckName,
    slug: toSlug(deckName),
    stats,
    maturityDistribution,
    dailyStats,
    children,
  };
}

async function main() {
  console.log("Connecting to AnkiConnect...");

  const allDeckNames = await invoke<string[]>("deckNames");
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
