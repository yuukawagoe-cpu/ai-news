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
| src/components/SummarizeButton.tsx | AI要約ボタン（Client Component） |
| src/components/SearchClient.tsx | セマンティック検索UI（Client Component） |
| src/app/search/page.tsx | 検索ページ（Server Component） |
| src/app/api/summarize/route.ts | POST /api/summarize（Vercel → FastAPI プロキシ） |
| src/app/api/search/route.ts | POST /api/search（Vercel → FastAPI プロキシ） |
| src/context/TranslationContext.tsx | 翻訳ON/OFF状態管理（React Context） |
| src/components/TranslateToggle.tsx | 日本語タイトル翻訳トグルボタン（Client Component） |
| src/components/TrendingBox.tsx | 話題トピックボックス（Client Component） |
| src/app/api/trending/route.ts | GET /api/trending（Vercel → FastAPI プロキシ） |
| src/app/api/translate/route.ts | POST /api/translate（Groq バッチ翻訳） |
| src/app/api/cron/reindex/route.ts | GET /api/cron/reindex（Vercel Cron → 再インデックス） |
| vercel.json | Vercel Cron 設定（毎日 0:00 UTC） |
| python-backend/main.py | FastAPI バックエンド（要約・検索・RSS索引化・社会的話題度） |
| python-backend/requirements.txt | Python 依存パッケージ一覧 |

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

#### Phase 2（実装済み・バックエンド拡張）

- [x] Python + FastAPI によるバックエンドAPI（Render.com 無料枠）
- [x] Groq API（llama-3.3-70b-versatile）による記事の日本語AI要約
- [x] fastembed + Qdrant Cloud によるベクトル検索・記事蓄積
- [x] 自然言語検索UI（「先週のLLM関連ニュースを検索」等）
- [x] ヘッダーの日本語翻訳トグルボタン（タイトルをバッチ翻訳）
- [x] 話題トピックボックス（トップ3記事 + AI要約をページ最上部に表示）
- [x] 話題度スコア（同トピック記事の同時掲載数 × 時間減衰）
- [x] 定期インデックス化（Vercel Cron 毎日0:00 UTC）・古記事自動削除

#### Phase 3（実装予定・ソーシャル話題度）

- [ ] Hacker News API による社会的スコア取得（ポイント数・無料・認証不要）
- [ ] Reddit r/artificial・r/MachineLearning の投票数取得（無料 JSON API）
- [ ] 話題度 = HN ポイント + Reddit スコア（SNS で話題なら上位表示）
- [ ] AIキーワードフィルター（無関係な記事を除外）
- [ ] 社会的スコアが RSS クロスカバレッジより優先（同URL記事は上書き）

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

### 2026-06-14（続き）
- **作業内容**: Step 17 完了（GitHub プッシュ・Vercel デプロイ）
  - GitHub リポジトリ作成: https://github.com/yuukawagoe-cpu/ai-news（Public）
  - Vercel デプロイ成功（本番ビルド・全ルート確認済み）
  - 本番 URL: https://ai-news-eight-ecru.vercel.app
- **現在の状態**: **Phase 1 完全完了**。全機能が本番環境で動作中。
- **備考**: Vercel の GitHub 連携（push 自動デプロイ）は Vercel ダッシュボード上で手動設定が必要（CLI での自動接続が失敗したため）。次回 `git push` 後は `npx vercel --prod` で再デプロイ可能。

### 2026-06-14（Phase 2 完了）
- **作業内容**: Phase 2 実装完了（セマンティック検索・AI要約）
  - `python-backend/main.py` — FastAPI バックエンド
    - fastembed（`all-MiniLM-L6-v2` 384次元 ONNX）で埋め込みベクトル生成
    - Qdrant Cloud にRSS記事を索引化（起動時にバックグラウンドスレッドで実行）
    - Groq API（`llama-3.3-70b-versatile`）を httpx 直接呼び出しで使用（SDK 非互換のため）
    - 日本語クエリを英語に翻訳してから埋め込み（`translate_to_english()`）
    - `/search` — セマンティック検索 + 日本語回答生成
    - `/summarize` — 記事タイトル・概要から日本語3文要約
    - Qdrant / Groq クライアントを遅延初期化（起動クラッシュ防止）
  - `python-backend/requirements.txt` — groq SDK 削除・httpx バージョン固定解除
  - `src/components/SummarizeButton.tsx` — 各記事カードの「AI要約を見る」ボタン
  - `src/components/SearchClient.tsx` — 自然言語検索UI（クエリ入力・回答・関連記事一覧）
  - `src/app/search/page.tsx` — 検索ページ
  - `src/app/api/summarize/route.ts` — Vercel → Render.com プロキシ（BOM除去・エラー詳細付き）
  - `src/app/api/search/route.ts` — Vercel → Render.com プロキシ（BOM除去・エラー詳細付き）
  - `src/components/Header.tsx` — 「AI検索」ナビリンク追加
  - `src/components/NewsCard.tsx` — `HAS_BACKEND` フラグで SummarizeButton 条件表示
- **デプロイ先**:
  - フロントエンド: https://ai-news-eight-ecru.vercel.app（Vercel）
  - バックエンド: Render.com 無料枠（15分無操作でスリープ）
- **解決した問題**:
  - Render.com ポートスキャンタイムアウト → `ThreadPoolExecutor` でバックグラウンド索引化
  - `KeyError: 'GROQ_API_KEY'` 起動クラッシュ → 遅延初期化で解決
  - groq SDK が httpx 0.28 と非互換 → SDK 削除・httpx REST 直接呼び出しに変更
  - `PYTHON_API_URL` の BOM 文字（PowerShell の `echo` が付加）→ `.replace(/^﻿/, "")` で除去
  - 日本語クエリの検索精度低下 → Groq で英語翻訳してから埋め込み
- **現在の状態**: **Phase 2 完全完了**。要約・セマンティック検索とも本番環境で動作確認済み。

### 2026-06-14（Phase 3 着手）
- **背景**: 話題度スコアが「4媒体のRSSで同トピックが何件あるか」に依存していたため、1媒体しか取り上げないニュース（例: Fable）がスコア0になる問題があった
- **作業内容**: ソーシャル話題度機能を設計・実装
  - `python-backend/main.py` に `fetch_hacker_news()`・`fetch_reddit()` を追加
  - Hacker News Algolia Search API でAI関連記事とポイント数を取得
  - Reddit r/artificial・r/MachineLearning のトップ投稿を JSON API で取得
  - `index_articles()` を4パス構成に変更
    - Pass 1: RSS記事を一括 upsert（score=0）
    - Pass 2: コサイン類似度でクロスカバレッジスコアを更新（×10スケーリング）
    - Pass 3: HN記事を upsert（同URL記事はソーシャルスコアで上書き）
    - Pass 4: Reddit記事を upsert（同URL記事はソーシャルスコアで上書き）
- **現在の状態**: **Phase 3 実装完了**。GitHub・Vercel・Render.com にデプロイ済み。
