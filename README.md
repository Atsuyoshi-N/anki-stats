# Anki Stats

Ankiの学習データを[AnkiConnect](https://foosoft.net/projects/anki-connect/)経由で取得し、デッキ別・横断的な統計情報を可視化する静的ダッシュボードです。GitHub Pagesで公開できます。

## ダッシュボード内容

- 学習ヒートマップ (過去1年間の日別学習量、GitHub風)
- デッキ概要 (デッキ別カード状態のテーブル + スタックドバーチャート)
- 日別学習枚数 (デッキ別スタックドバーチャート)
- 日別学習時間 (デッキ別スタックドエリアチャート)
- 正答率推移 (デッキ別7日移動平均の折れ線グラフ)
- カード成熟度分布 (復習間隔に基づくヒストグラム)

## 技術スタック

- Next.js (静的エクスポート)
- TypeScript
- Tailwind CSS
- Recharts
- AnkiConnect API

## 前提条件

- Node.js 22 以上
- Ankiがインストールされていること
- [AnkiConnect](https://ankiweb.net/shared/info/2055492159) アドオンがインストールされていること

## セットアップ

```sh
npm install
```

## 使い方

### 1. データ取得

Ankiを起動した状態で以下を実行します。AnkiConnect (localhost:8765) からデータを取得し、`data/anki-data.json` に保存します。

```sh
npm run fetch-data
```

### 2. ローカルで確認

```sh
npm run dev
```

http://localhost:3000/anki-stats/ をブラウザで開きます。

### 3. GitHub Pagesにデプロイ

```sh
npm run deploy
```

`gh-pages` ブランチにビルド成果物がpushされます。GitHubリポジトリの Settings > Pages で Source を `gh-pages` ブランチに設定してください。

### データの更新

Ankiの学習データを最新にしたい場合は、再度 `npm run fetch-data` を実行してから `npm run deploy` してください。
