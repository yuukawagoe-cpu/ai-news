# MyApp プロジェクト管理ファイル

> このファイルはClaudeが毎回作業開始前に読み込み、確認する必須ファイルです。
> **要件定義はユーザーの許可なしに変更禁止。**

---

## 作業ルール

1. 作業開始前に必ずこのファイル（PROJECT.md）を読み込む
2. 要件定義はユーザーの許可なしに変更しない
3. 作業が進むたびに「進捗ログ」に追記する（日付・作業内容・現在の状態を記録）
4. 新しいファイルを追加・削除した場合は「ファイル一覧」を更新する
5. 不明点はユーザーに確認してから進める

---

## ファイル一覧

| ファイル名 | 説明 |
|-----------|------|
| PROJECT.md | プロジェクト管理ファイル（本ファイル）。ルール・要件・進捗を管理 |
| DESIGN.md | 詳細設計書。アーキテクチャ・ファイル構成・関数仕様を記載 |
| src/lib/types.ts | NewsItem / RssSource / FetchOptions 型定義 |
| src/constants/sources.ts | RSS ソース一覧（TechCrunch / The Verge / VentureBeat / Wired） |
| src/lib/utils.ts | formatRelativeTime（相対日時変換） |
| src/lib/rss.ts | RSS 取得・パース・重複排除・ソートロジック |
| src/app/api/news/route.ts | GET /api/news（Phase 2 用） |
| src/components/NewsCardSkeleton.tsx | 記事カードスケルトン |
| src/components/NewsGridSkeleton.tsx | グリッドスケルトン（NewsCardSkeleton × 6） |
| src/components/FilterBarSkeleton.tsx | フィルターバースケルトン |
| src/components/NewsCard.tsx | 記事カード（1件） |
| src/components/NewsList.tsx | 記事グリッドレイアウト |
| src/components/NewsSection.tsx | 非同期 Server Component（RSS 取得担当） |
| src/components/FilterBar.tsx | ソースフィルター（Client Component） |
| src/components/Header.tsx | ヘッダー |
| src/app/loading.tsx | 初回ナビゲーション用フルページスケルトン |
| src/app/page.tsx | トップページ（同期 Server Component） |
| src/app/layout.tsx | ルートレイアウト（Analytics・globals.css） |

---

## 要件定義

### アプリ概要

最新のAIニュースをRSSフィードから取得し、一覧表示するWebアプリケーション。
フロントエンドはNext.js + TypeScriptで構築し、Vercelで無料ホスティングする。
インターン選考（フロントエンド志向）のポートフォリオとして活用する。

### 目的

- AIに関する最新情報をまとめて閲覧できる
- 情報収集の手間を省き、効率よくAIトレンドを把握できる
- フロントエンド開発（TypeScript / React / Next.js / UI・UX設計）の実践経験を積む

### 技術スタック（確定）

| 技術 | 選定理由 |
|------|---------|
| **Next.js** | API Routesを使いサーバーサイドでRSSを取得できるため、CORSの制約を受けない。SSRにより初期表示が速い。フロントエンドとバックエンドAPIを一つのリポジトリで管理できる |
| **TypeScript** | ニュース記事データ（タイトル・日付・URL・ソース等）の型が複雑で、型安全性が実用的に必要。インターン要件とも合致 |
| **Vercel** | Next.jsの開発元が提供するホスティングサービスで相性が最良。無料プランで本番運用可能。Vercel Analyticsが標準で使えその指標をUI改善に活かせる |
| **RSSフィード** | APIキー不要・無料・無制限。技術メディア各社が公式に提供しており信頼性が高い |
| **Vercel Analytics** | PV（ページビュー）を自動計測してトレンドの把握に活用できる。無料枠では記事クリック等のカスタムイベントは取得できないため計測範囲はPVのみ |

### 機能要件（確定）

#### Phase 1（必須・フロントエンド）

- [ ] 複数のRSSフィードからAIニュースをサーバーサイドで取得する
- [ ] ニュース一覧を表示する（タイトル・概要・ソース名・相対日時・リンク）
- [ ] ソースフィルター（ソース別に絞り込み）
- [ ] ローディング中はスケルトンUIを表示する
- [ ] Vercel Analytics で閲覧データを計測する
- [ ] レスポンシブデザイン（PC・スマートフォン対応）

#### Phase 2（時間があれば・バックエンド拡張）

- [ ] Python + FastAPI によるバックエンドAPIの追加
- [ ] LangChain + LLM（Groq / Gemini 無料枠）による記事の自動要約
- [ ] RAG + ベクトルDB（ChromaDB）による記事の蓄積と自然言語検索
- [ ] 「先週のLLM関連ニュースを検索」等のセマンティック検索UI

### 非機能要件（確定）

- 運用コスト: 無料（Vercel無料プラン、RSSは無料、LLMは無料枠内）
- 外部公開: 可能（Vercelが提供するURLでアクセス可能）
- 自動更新: Next.jsのキャッシュ機能で30分ごとにRSSを再取得

---

## 進捗ログ

### 2026-06-13
- **作業内容**: プロジェクト開始。PROJECT.md を作成。SessionStart hookを設定。
- **作業内容（続）**: 技術スタック・フェーズ構成を確定。PROJECT.mdに要件を反映。詳細設計フェーズへ移行。
- **現在の状態**: 要件定義確定済み。DESIGN.md 計4回の検証・修正サイクルを経て実装可能な状態に到達。
- **修正内容（4回目）**: rss.tsのインポート補完（NewsItem/RssSource/FetchOptions/RSS_SOURCES）、stripHtmlに&apos;&nbsp;追加、formatRelativeTimeのYYYY/MM/DDゼロパディング実装追加、route.tsにNextRequest・fetchAllNewsインポートとGETエクスポート名を明示、FilterBarの「すべて」ボタンaria-selected明示、NewsCard/NewsList/NewsGridSkeleton/loading.tsxのインポート行追加、globals.cssをファイル構成と§12に追記、layout.tsxにglobals.cssインポート記載、§12にcreate-next-appコマンドとnpm installを追加
- **次のステップ**: Next.jsプロジェクトの初期化から実装フェーズへ。
- **作業内容（ChatGPT指摘対応）**: Analytics説明をPVのみに修正（PROJECT.md）、「カテゴリフィルター」→「ソースフィルター」に統一（PROJECT.md要件）、FilterBarのURLエンコード追加（encodeURIComponent）、page.tsxにソース名バリデーション追加、truncateを201→200文字に修正、normalizeRssItemの日付/概要フォールバック追加（Atom対応）・不正日付をエポックに変更・変数名明示（title/link/dateStr/rawDesc）、parseRssFeedにentry要素サポート追加、Phase 2のChromaDB/Render無料枠の制約を注記、page.tsxの処理ステップ番号重複を修正（DESIGN.md）
- **現在の状態**: 設計完了。実装フェーズへ移行可能。

### 2026-06-14
- **作業内容**: Phase 1 実装完了（Steps 1〜16）
  - `src/lib/types.ts` — NewsItem / RssSource / FetchOptions 型定義
  - `src/constants/sources.ts` — TechCrunch / The Verge / VentureBeat / Wired の RSS ソース一覧
  - `src/lib/utils.ts` — `formatRelativeTime`（ISO8601→相対表示）
  - `src/lib/rss.ts` — `stripHtml` / `truncate` / `generateId` / `getTagText` / `normalizeRssItem` / `parseRssFeed` / `fetchRssFeed` / `fetchAllNews`（RSS 2.0 + Atom 対応・重複排除・並列取得）
  - `src/app/api/news/route.ts` — GET /api/news（Phase 2 用予約）
  - `src/components/NewsCardSkeleton.tsx` — カードスケルトン（animate-pulse）
  - `src/components/NewsGridSkeleton.tsx` — グリッドスケルトン（6件）
  - `src/components/FilterBarSkeleton.tsx` — フィルターバースケルトン（5個）
  - `src/components/NewsCard.tsx` — 記事カード（タイトル・バッジ・相対日時・概要）
  - `src/components/NewsList.tsx` — グリッドレイアウト・空件数メッセージ対応
  - `src/components/NewsSection.tsx` — 非同期 Server Component（fetchAllNews → NewsList）
  - `src/components/FilterBar.tsx` — Client Component（encodeURIComponent・aria-selected）
  - `src/components/Header.tsx` — ヘッダー（AI News / サブタイトル）
  - `src/app/loading.tsx` — 初回ナビゲーション時フルページスケルトン
  - `src/app/page.tsx` — 同期 Server Component（ソース名バリデーション・Suspense 境界）
  - `src/app/layout.tsx` — lang="ja"・Vercel Analytics・globals.css インポート
- **修正内容**: `[...map.values()]` → `Array.from(map.values())` （TypeScript tsconfig target 未指定環境対応）; `package.json` の name を `myapp-init` → `myapp` に修正; 一時ディレクトリ `C:/Users/yuuka/myapp-init` を削除
- **現在の状態**: `npm run build` 成功。`/`（動的）と `/api/news` が正常にビルドされたことを確認。**次のステップ**: `npm run dev` でローカル動作確認 → GitHub へプッシュ → Vercel にデプロイ（Step 17）
