# DESIGN.md — 詳細設計書

> 要件定義は PROJECT.md を参照。本ファイルはアーキテクチャ・ファイル構成・関数仕様を定義する。

---

## 1. アーキテクチャ概要

```
ブラウザ
  │  URLアクセス（例: /?source=TechCrunch）
  ▼
Next.js (Vercel) — Node.js ランタイム
  ├── loading.tsx（初回ナビゲーション時の Suspense フォールバック）
  │     └── Header + FilterBarSkeleton + NewsGridSkeleton を表示
  ├── page.tsx（同期 Server Component）
  │     ├── Header と FilterBar を即時レンダリング（データ取得なし）
  │     └── <Suspense fallback={<NewsGridSkeleton />}><NewsSection /></Suspense>
  │           └── フィルター変更時は Header/FilterBar を維持したまま
  │               ニュースグリッド部分だけスケルトンに切り替わる
  ├── NewsSection.tsx（非同期 Server Component）
  │     └── fetchAllNews() を呼び出し NewsList に結果を渡す
  └── GET /api/news（API Route）
        └── Phase 2 用予約。Phase 1 では page.tsx 配下から直接呼ばれない

外部RSSフィード（TechCrunch / The Verge / VentureBeat / Wired）
  └── fetchRssFeed() のみがアクセス（サーバーサイド限定。CORSの制約を受けない）

Vercel Analytics
  └── layout.tsx に設置した <Analytics /> が全ページの PV を自動計測
```

**Suspense 境界の設計意図:**
`loading.tsx` が Suspense フォールバックとなるのは初回ナビゲーション時のみ。フィルター変更時（`router.push` による同一セグメント内遷移）は `page.tsx` 内の `<Suspense>` が発火し、Header と FilterBar は維持されたままニュース部分のみスケルトンに切り替わる。これによりレイアウトシフトを防ぐ。

---

## 2. ファイル構成

```
src/
├── app/
│   ├── globals.css                 # Tailwind ディレクティブ（@tailwind base/components/utilities）
│   ├── layout.tsx                  # ルートレイアウト（Analytics・TranslationProvider）
│   ├── loading.tsx                 # 初回ナビゲーション時のフルページスケルトン
│   ├── page.tsx                    # トップページ（同期 Server Component）
│   ├── search/
│   │   └── page.tsx                # セマンティック検索ページ
│   └── api/
│       ├── news/
│       │   └── route.ts            # GET /api/news（予約）
│       ├── search/
│       │   └── route.ts            # POST /api/search（Vercel → FastAPI プロキシ）
│       ├── summarize/
│       │   └── route.ts            # POST /api/summarize（Vercel → FastAPI プロキシ）
│       ├── trending/
│       │   └── route.ts            # GET /api/trending（Vercel → FastAPI プロキシ）
│       ├── translate/
│       │   └── route.ts            # POST /api/translate（Groq バッチ翻訳）
│       └── cron/
│           └── reindex/
│               └── route.ts        # GET /api/cron/reindex（Vercel Cron → 再インデックス）
├── components/
│   ├── Header.tsx                  # ヘッダー（TranslateToggle・AI検索リンク）
│   ├── FilterBar.tsx               # ソースフィルター（Client Component）
│   ├── FilterBarSkeleton.tsx       # FilterBar のローディングプレースホルダー
│   ├── NewsSection.tsx             # ニュース取得担当（非同期 Server Component）
│   ├── NewsList.tsx                # ニュース一覧（Client Component・翻訳対応）
│   ├── NewsCard.tsx                # 記事カード 1 件（displayTitle prop 対応）
│   ├── NewsCardSkeleton.tsx        # 記事カードのローディングプレースホルダー
│   ├── NewsGridSkeleton.tsx        # NewsCardSkeleton をグリッドで並べたもの
│   ├── SummarizeButton.tsx         # AI要約ボタン（Client Component）
│   ├── SearchClient.tsx            # セマンティック検索UI（Client Component）
│   ├── TrendingBox.tsx             # 話題トピックボックス（Client Component）
│   └── TranslateToggle.tsx         # 翻訳トグルボタン（Client Component）
├── context/
│   └── TranslationContext.tsx      # 翻訳状態管理（React Context）
├── lib/
│   ├── types.ts                    # 型定義
│   ├── rss.ts                      # RSS取得・パースロジック
│   └── utils.ts                    # UIユーティリティ（formatRelativeTime）
└── constants/
    └── sources.ts                  # RSSソース一覧

python-backend/
├── main.py                         # FastAPI バックエンド（要約・検索・索引化・ソーシャル話題度）
└── requirements.txt                # Python 依存パッケージ

vercel.json                         # Vercel Cron 設定
```

---

## 3. 使用パッケージ

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@xmldom/xmldom": "^0.8.x",
    "@vercel/analytics": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

**CSSフレームワーク**: Tailwind CSS（グリッドレイアウト・`animate-pulse` 等に使用）

**`@xmldom/xmldom` を使う理由**: ブラウザ標準の `DOMParser` は Node.js ランタイムに存在しない。`@xmldom/xmldom` は `DOMParser` と同等の API を Node.js で提供する互換パッケージ。`@xmldom/xmldom` は v0.8 以降に型定義を同梱しているため `@types/xmldom` は不要。

---

## 4. 環境変数

Phase 1 では環境変数は不要（RSSはAPIキー不要）。

Phase 2 で追加予定（`.env.local` に記載）:
```
GROQ_API_KEY=       # Groq LLM API キー
PYTHON_API_URL=     # FastAPI バックエンドのURL（Render.com）
```

---

## 5. 型定義 (`src/lib/types.ts`)

```typescript
export interface NewsItem {
  id: string          // URLをBase64エンコードした一意ID（重複排除に使用）
  title: string       // 記事タイトル
  description: string // 概要（HTMLタグ除去済み・200文字以内）
  url: string         // 元記事のURL
  publishedAt: string // ISO8601形式の日時文字列（例: "2026-06-13T09:00:00Z"）
  source: string      // フィード表示名（例: "TechCrunch"）。FilterBar のフィルターキーと一致する
}

export interface RssSource {
  url: string  // RSSフィードのURL
  name: string // UI上での表示名。NewsItem.source および FilterBar のフィルターキーに使われる
}

export interface FetchOptions {
  source?: string // ソース名で絞り込む。未指定または "all" のとき全件返す
  limit?: number  // 返す最大件数（デフォルト: 50）
}
```

**注意**: `category` フィールドは存在しない。フィルタリングはソース名（`RssSource.name`）で行う。

---

## 6. RSSソース一覧 (`src/constants/sources.ts`)

```typescript
import type { RssSource } from "@/lib/types"

export const RSS_SOURCES: RssSource[] = [
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    name: "TechCrunch",
  },
  {
    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    name: "The Verge",
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    name: "VentureBeat",
  },
  {
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
    name: "Wired",
  },
]
```

---

## 7. ユーティリティ関数 (`src/lib/utils.ts`)

UI コンポーネントからも呼ばれるため、サーバー専用モジュール（`rss.ts`）とは分離する。

### `formatRelativeTime(isoString: string): string`

| 項目 | 内容 |
|------|------|
| 目的 | ISO8601の日時文字列を「〇分前」等の相対表示に変換する |
| 引数 | `isoString`: ISO8601形式の日時文字列 |
| エラー | `isNaN(new Date(isoString).getTime())` が `true` の場合は `""` を返す |

**中間変数の定義（処理の先頭で宣言する）:**

```typescript
const diffMs      = Date.now() - new Date(isoString).getTime()
const diffMinutes = Math.floor(diffMs / 1000 / 60)
const diffHours   = Math.floor(diffMs / 1000 / 3600)
const diffDays    = Math.floor(diffMs / 1000 / 3600 / 24)
```

**閾値と返り値（上から順に評価する）:**

| 条件 | 返り値の例 |
|------|-----------|
| `diffMs < 0` または `diffMinutes < 1` | `"今"` |
| `diffMinutes < 60` | `"3分前"` |
| `diffHours < 24` | `"5時間前"` |
| `diffDays < 7` | `"2日前"` |
| それ以上 | `"2026/06/06"`（`YYYY/MM/DD` 形式。ゼロパディングあり） |

**`YYYY/MM/DD` 形式の実装:**

```typescript
const date = new Date(isoString)
const y = date.getFullYear()
const m = String(date.getMonth() + 1).padStart(2, "0")
const d = String(date.getDate()).padStart(2, "0")
return `${y}/${m}/${d}`
```

---

## 8. RSS取得・パースロジック (`src/lib/rss.ts`)

**前提**: 全関数は Node.js ランタイム（サーバーサイド）でのみ実行される。

**ファイル先頭に必要なインポート:**

```typescript
import { DOMParser } from "@xmldom/xmldom"
import type { Element } from "@xmldom/xmldom"
import type { NewsItem, RssSource, FetchOptions } from "@/lib/types"
import { RSS_SOURCES } from "@/constants/sources"
```

`Element` は必ず `@xmldom/xmldom` からインポートすること。Next.js プロジェクトの `tsconfig.json` には `"lib": ["dom"]` が含まれるため、インポートなしで `Element` と書くとブラウザの DOM 型と競合し型エラーになる。

---

### `stripHtml(html: string): string`

| 項目 | 内容 |
|------|------|
| 目的 | HTMLタグを除去して純粋なテキストを返す |
| 引数 | `html`: タグを含む可能性のある文字列 |
| 処理 | 1. 正規表現 `/<[^>]*>/g` でタグを除去<br>2. `&amp;`→`&`、`&lt;`→`<`、`&gt;`→`>`、`&quot;`→`"`、`&apos;`→`'`、`&nbsp;`→`" "`（半角スペース）を置換<br>3. `/\s+/g` を `" "` に置換して連続空白・改行を圧縮<br>4. `trim()` で前後の空白を除去 |
| 返り値 | タグなし・エンティティ展開済みの文字列 |

---

### `truncate(text: string, maxLength: number): string`

| 項目 | 内容 |
|------|------|
| 目的 | 文字列を指定文字数で切り詰め末尾に "…" を付ける |
| 引数 | `text`: 対象文字列、`maxLength`: 最大文字数 |
| 処理 | `text.length <= maxLength` ならそのまま返す。超えていれば `text.slice(0, maxLength - 1) + "…"`（`…` の1文字分を差し引いて切り詰めるため、返り値は常に `maxLength` 文字以内になる） |
| 返り値 | 切り詰めた文字列 |

---

### `generateId(url: string): string`

| 項目 | 内容 |
|------|------|
| 目的 | URLから記事の一意IDを生成する（Map による重複排除のキーに使用） |
| 引数 | `url`: 記事のURL |
| 処理 | `Buffer.from(url).toString("base64url")` でBase64エンコード |
| 返り値 | Base64エンコードされた文字列（URLセーフ） |
| 注意 | `Buffer` は Node.js 固有API。Edge ランタイムへの移行時は `btoa(encodeURIComponent(url))` に変更すること |

---

### `getTagText(element: Element, tagName: string): string`

| 項目 | 内容 |
|------|------|
| 目的 | XML Element から指定タグの text content を安全に取得する |
| 引数 | `element`: `@xmldom/xmldom` の `Element`（ファイル先頭でインポート済み）、`tagName`: 取得するタグ名（例: `"title"`, `"link"`） |
| 処理 | `element.getElementsByTagName(tagName)[0]?.textContent ?? ""` |
| 返り値 | タグのテキスト内容、または空文字 |
| 注意 | `querySelector` は `@xmldom/xmldom` で未サポートのため、必ず `getElementsByTagName` を使うこと |

---

### `normalizeRssItem(item: Element, source: RssSource): NewsItem | null`

| 項目 | 内容 |
|------|------|
| 目的 | XML の item 要素を `NewsItem` 型に正規化する |
| 引数 | `item`: `@xmldom/xmldom` の `Element`、`source`: ソース情報 |
| 処理 | 1. タグを取得する。`const title = getTagText(item, "title")`、`const link = getTagText(item, "link")` で取得。`const dateStr = getTagText(item, "pubDate") \|\| getTagText(item, "published") \|\| getTagText(item, "updated")` の順で最初に非空の日付文字列を取得する（`published`・`updated` は Atom フォーマットのフォールバック）。`const rawDesc = getTagText(item, "description") \|\| getTagText(item, "summary") \|\| getTagText(item, "content:encoded")` の順で最初に非空の概要文字列を取得する（`summary`・`content:encoded` は Atom/拡張フォーマットのフォールバック）<br>2. `title` または `link` が空文字の場合は `null` を返す<br>3. `description` は `stripHtml()` → `truncate(200)` の順に整形<br>4. `publishedAt`: 取得した日付文字列が空文字、または `isNaN(new Date(dateStr).getTime())` が `true` の場合は `"1970-01-01T00:00:00.000Z"`（日付不正記事をリスト末尾に送るため）を使用。それ以外は `new Date(dateStr).toISOString()`<br>5. `id` は `generateId(link)` で生成<br>6. `source` フィールドは `source.name` をセット |
| 返り値 | `NewsItem`、または title / link が欠如している場合は `null` |

---

### `parseRssFeed(xml: string, source: RssSource): NewsItem[]`

| 項目 | 内容 |
|------|------|
| 目的 | XML文字列をパースして `NewsItem[]` を返す |
| 引数 | `xml`: RSSフィードのXML文字列、`source`: ソース情報 |
| 処理 | 1. `new DOMParser().parseFromString(xml, "text/xml")` でパース（ファイル先頭でインポート済みの `@xmldom/xmldom` の `DOMParser` を使用）<br>2. `doc.getElementsByTagName("parsererror").length > 0` ならパース失敗とみなし空配列を返す<br>3. `[...Array.from(doc.getElementsByTagName("item")), ...Array.from(doc.getElementsByTagName("entry"))]` で全記事要素を配列として取得する（`item` は RSS 2.0、`entry` は Atom フォーマット。両方取得することでどちらの形式でも動作する。`getElementsByTagName` は `HTMLCollectionOf` を返すため必ず `Array.from()` で変換すること）<br>4. 各要素を `normalizeRssItem()` で変換<br>5. `filter((item): item is NewsItem => item !== null)` で `null` を除去して返す |
| 返り値 | `NewsItem[]`（空配列の場合もあり） |
| エラー | XMLパース失敗時は空配列を返す（他ソースに影響を与えない） |

---

### `fetchRssFeed(source: RssSource): Promise<NewsItem[]>`

| 項目 | 内容 |
|------|------|
| 目的 | 単一RSSフィードをHTTP取得して `NewsItem[]` を返す |
| 引数 | `source`: `RssSource` 型 |
| 処理 | 1. `try/catch` 全体を囲む<br>2. `fetch(source.url, { next: { revalidate: 1800 } })` でHTTP GET（Next.js キャッシュ: 30分）<br>3. `response.ok` が false の場合は `console.warn(\`[RSS] Failed to fetch \${source.name}: \${response.status}\`)` を出力して空配列を返す<br>4. `response.text()` でXML文字列を取得<br>5. `parseRssFeed(xml, source)` でパースして返す |
| エラー | `catch` で例外を捕捉し `console.warn` を出力して空配列を返す |
| 返り値 | `Promise<NewsItem[]>` |

---

### `fetchAllNews(options?: FetchOptions): Promise<NewsItem[]>`

| 項目 | 内容 |
|------|------|
| 目的 | 全RSSソースから記事を並列取得し、重複排除・ソートして返す |
| 引数 | `options.source`: ソース名フィルター（未指定または `"all"` のとき全ソースを対象にする）<br>`options.limit`: 上限件数（デフォルト: `50`） |
| 処理 | 1. **ソースリストの決定**: `options?.source && options.source !== "all"` が `true` のとき `RSS_SOURCES.filter(s => s.name === options.source)` で絞り込む。それ以外（`undefined` または `"all"`）は `RSS_SOURCES` 全件を使う<br>2. `Promise.allSettled(targetSources.map(fetchRssFeed))` で並列取得（1つ失敗しても他は継続）<br>3. `.filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled").flatMap(r => r.value)` で fulfilled の結果のみ取り出し、1次元の `NewsItem[]` に展開する<br>4. **重複排除**: `const map = new Map<string, NewsItem>()` を作成し、各記事に対して `if (!map.has(item.id)) map.set(item.id, item)` で追加する（先着優先。同一IDが後から来ても上書きしない）<br>5. `[...map.values()]` を比較関数 `(a, b) => b.publishedAt.localeCompare(a.publishedAt)` で降順（新しい順）に `sort()` する（ISO8601文字列は辞書順と時系列順が一致するため `localeCompare` が使える）<br>6. `slice(0, options?.limit ?? 50)` で件数を制限して返す |
| 返り値 | `Promise<NewsItem[]>` |

---

## 9. APIエンドポイント (`src/app/api/news/route.ts`)

### `GET /api/news`

**Phase 1 での位置づけ**: `page.tsx` → `NewsSection.tsx` → `fetchAllNews()` の経路でデータ取得するため、Phase 1 ではこのエンドポイントは呼び出されない。Phase 2 でのクライアントサイド再取得・外部サービス連携用に実装しておく。

**ファイル先頭に必要なインポート:**

```typescript
import { NextRequest } from "next/server"
import { fetchAllNews } from "@/lib/rss"
```

| 項目 | 内容 |
|------|------|
| クエリパラメータ | `source`: ソースフィルター（省略で全件）<br>`limit`: 最大件数（省略でデフォルト50） |
| エクスポート | `export async function GET(request: NextRequest): Promise<Response>` — Next.js App Router の route handler は HTTP メソッド名と一致する named export でなければリクエストがルーティングされないため、関数名は必ず `GET` にすること |
| 処理 | 1. `request` の型は `NextRequest`<br>2. `request.nextUrl.searchParams` からパラメータを取得<br>3. `source`: `searchParams.get("source")` は値がない場合 `null` を返すため `searchParams.get("source") ?? undefined` として `string \| undefined` に変換する<br>4. `limit`: `Number(searchParams.get("limit"))` で変換し、`isNaN(limit)` または `limit <= 0` の場合は `50` にフォールバック<br>5. `fetchAllNews({ source, limit })` を呼び出す<br>6. `Response.json(items)` で返す<br>7. 例外発生時は `Response.json({ error: "Failed to fetch news" }, { status: 500 })` を返す |
| レスポンス | `200 OK`: `NewsItem[]` のJSON<br>`500`: `{ error: string }` |

---

## 10. コンポーネント仕様

### `Header` (`src/components/Header.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | なし |
| 表示内容 | アプリ名「AI News」（左寄せ）、サブタイトル「最新のAIニュースをまとめて閲覧」（右寄せ） |
| スタイル | 横幅フル・上部固定のナビゲーションバー形式 |

---

### `FilterBar` (`src/components/FilterBar.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Client Component（`"use client"` をファイル先頭に記載） |
| インポート | `import { useRouter } from "next/navigation"` （App Router 用。`"next/router"` は Pages Router 用であり使用不可） |
| Props | `sources: string[]`（タブに表示するソース名の配列）<br>`selected: string`（現在選択中のソース名、または `"all"`） |
| 動作 | 「すべて」ボタンをクリックすると `router.push("/")` でルートパス（`source` パラメータなし）に遷移する。各ソース名ボタンをクリックすると `router.push(\`/?source=\${encodeURIComponent(name)}\`)` に遷移する（"The Verge" のようにスペースを含むソース名を安全に渡すため `encodeURIComponent` を使用する） |
| 表示 | 「すべて」ボタン（`selected === "all"` のときハイライト）＋ `sources` の各ボタンを横並び |
| ハイライト | 選択中: 背景色・テキスト太字。非選択: 通常スタイル |
| アクセシビリティ | 全体を `role="tablist"`。「すべて」ボタンは `role="tab"` と `aria-selected={selected === "all"}`。各ソースボタンは `role="tab"` と `aria-selected={selected === name}` で記述 |

---

### `FilterBarSkeleton` (`src/components/FilterBarSkeleton.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | なし |
| 表示 | FilterBar と同じ高さ・横並びのグレーの丸角矩形を5個並べ、Tailwind の `animate-pulse` でアニメーション |
| 用途 | `loading.tsx` から呼び出される |

---

### `NewsCardSkeleton` (`src/components/NewsCardSkeleton.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | なし |
| 表示 | `NewsCard` と同じ外形寸法の矩形。タイトル領域・日付領域・概要領域をグレーの `div` で模倣し、`animate-pulse` でアニメーション |
| 用途 | `NewsGridSkeleton` から呼び出される |

---

### `NewsGridSkeleton` (`src/components/NewsGridSkeleton.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | なし |
| インポート | `import NewsCardSkeleton from "@/components/NewsCardSkeleton"` |
| 表示 | `NewsCardSkeleton` を6件、`NewsList` と同一の Tailwind グリッドクラス（`grid grid-cols-1 sm:grid-cols-2 gap-4`）で並べる |
| 用途 | `loading.tsx` と `page.tsx` 内の `<Suspense fallback={...}>` の両方から呼び出される |

---

### `NewsCard` (`src/components/NewsCard.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | `item: NewsItem` |
| インポート | `import type { NewsItem } from "@/lib/types"`、`import { formatRelativeTime } from "@/lib/utils"` |
| 表示内容 | タイトル（外部リンク）、ソース名バッジ、相対日時、概要テキスト |
| リンク | `<a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title}>` |
| 相対日時 | `formatRelativeTime(item.publishedAt)` の返り値を表示（仕様は §7 参照） |

---

### `NewsList` (`src/components/NewsList.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Server Component |
| Props | `items: NewsItem[]` |
| インポート | `import type { NewsItem } from "@/lib/types"`、`import NewsCard from "@/components/NewsCard"` |
| 表示 | `items` を `grid grid-cols-1 sm:grid-cols-2 gap-4` で `NewsCard` を並べる |
| 空の場合 | 「現在表示できるニュースがありません」メッセージを中央に表示 |

---

### `NewsSection` (`src/components/NewsSection.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | 非同期 Server Component（`async` 関数） |
| Props | `source: string`（フィルター対象のソース名、または `"all"`） |
| 処理 | 1. `fetchAllNews({ source })` でニュースを取得<br>2. `<NewsList items={items} />` を返す |
| インポート | `fetchAllNews` は `"@/lib/rss"` から、`NewsList` は `"@/components/NewsList"` からインポート |
| 備考 | このコンポーネントが `page.tsx` の `<Suspense>` 内に配置されることで、データ取得中は `NewsGridSkeleton` が表示される |

---

### `loading.tsx` (`src/app/loading.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | Next.js 組み込みの Suspense フォールバック。初回ナビゲーション時に自動的に表示される |
| インポート | `import Header from "@/components/Header"`、`import FilterBarSkeleton from "@/components/FilterBarSkeleton"`、`import NewsGridSkeleton from "@/components/NewsGridSkeleton"` |
| 表示内容 | `<Header />` ＋ `<FilterBarSkeleton />` ＋ `<NewsGridSkeleton />` を `page.tsx` と同じレイアウト構造で並べる |
| 備考 | フィルター変更時（`router.push` による遷移）は `page.tsx` 内の `<Suspense>` が発火するため、このファイルは使用されない |

---

### `page.tsx` (`src/app/page.tsx`)

| 項目 | 内容 |
|------|------|
| 種別 | **同期** Server Component（`async` なし） |
| Props | `searchParams?: { source?: string \| string[] }` （Next.js App Router では同名クエリパラメータが複数渡された場合 `string[]` になるため） |
| 処理 | 1. `const rawSource = searchParams?.source` で値を取得し、`Array.isArray(rawSource) ? rawSource[0] : rawSource` で `string \| undefined` に確定させる。その後 `?? "all"` でデフォルト値を設定する（この時点の変数名は `normalized: string`）<br>2. `const source: string = RSS_SOURCES.some(s => s.name === normalized) ? normalized : "all"` でソース名を検証する。`RSS_SOURCES` に存在しない値（URLを手動で書き換えた場合等）は `"all"` に戻す（`"all"` 自体は `RSS_SOURCES` に存在しないため else 側に落ち `"all"` になる。この動作は正しい）<br>3. `const sources = RSS_SOURCES.map(s => s.name)` でソース名一覧を生成<br>4. `<Header />` を描画（データ依存なし、即時表示）<br>5. `<FilterBar sources={sources} selected={source} />` を描画（即時表示）<br>6. `<Suspense fallback={<NewsGridSkeleton />}><NewsSection source={source} /></Suspense>` を描画 |
| インポート | `{ Suspense }` は `"react"` から、`RSS_SOURCES` は `"@/constants/sources"` から（ソース名一覧の生成と入力値の検証の両方に使用）、`NewsSection` / `Header` / `FilterBar` / `NewsGridSkeleton` は各コンポーネントファイルからインポート |
| 備考 | `page.tsx` 自体は非同期処理を持たないため、Header と FilterBar はサスペンドせず即時表示される |

---

### `layout.tsx` (`src/app/layout.tsx`)

| 項目 | 内容 |
|------|------|
| インポート | `import "./globals.css"` で Tailwind CSS を適用する（このインポートがないと Tailwind が一切適用されない）。`<Analytics />` は `"@vercel/analytics/react"` からインポート |
| 処理 | 1. `<html lang="ja">` でルート要素を設定<br>2. `<body>` 内に `{children}` と `<Analytics />` を設置<br>3. `export const metadata` で `title: "AI News"`、`description: "最新のAIニュースをまとめて閲覧"` を定義 |

---

## 11. Phase 2 設計概要（実装済み）

Phase 2 では、Next.js のフロントエンドはそのままに、Python バックエンドを別サービスとして追加した。

```
Next.js (Vercel)
  ├── POST /api/summarize  → FastAPI /summarize（Groq で日本語3文要約）
  ├── POST /api/search     → FastAPI /search（セマンティック検索 + 回答生成）
  ├── GET  /api/trending   → FastAPI /trending（話題度上位記事 + 要約）
  ├── POST /api/translate  → Groq 直接呼び出し（タイトルバッチ翻訳）
  └── GET  /api/cron/reindex → FastAPI /reindex（Vercel Cron から毎日呼び出し）

Python FastAPI (Render.com 無料枠)
  ├── GET  /health
  ├── POST /reindex   — RSS + HN + Reddit を再インデックス・古記事クリーンアップ
  ├── GET  /trending  — 話題度上位 N 件を返す（日本語要約付き）
  ├── POST /summarize — 記事タイトル・概要から日本語3文要約
  └── POST /search    — 日本語クエリ → 英語翻訳 → 類似検索 → 日本語回答

Embedding / Vector DB
  ├── fastembed（sentence-transformers/all-MiniLM-L6-v2, 384次元 ONNX）
  └── Qdrant Cloud（外部永続化・Render.com スピンダウン後も保持）

LLM
  └── Groq API httpx 直接呼び出し（llama-3.3-70b-versatile）
      ※ groq SDK は httpx 0.28 と非互換のため使用しない
```

---

## 12. Phase 3 設計概要（ソーシャル話題度・実装済み）

RSS のクロスカバレッジスコアから Hacker News・Reddit の社会的スコアに移行する。

### データソース

| ソース | API | 取得するもの |
|--------|-----|-------------|
| Hacker News | Algolia HN Search API（無料・認証不要） | ポイント数（points）・タイトル・URL |
| Reddit r/artificial | Reddit JSON API（無料・User-Agent 必須） | スコア + コメント数 × 2 |
| Reddit r/MachineLearning | Reddit JSON API | 同上 |

### `fetch_hacker_news(limit: int) -> list[dict]`

| 項目 | 内容 |
|------|------|
| エンドポイント | `https://hn.algolia.com/api/v1/search?query={kw}&tags=story&hitsPerPage=10` |
| キーワード | `AI`, `artificial intelligence`, `LLM`, `machine learning`, `OpenAI`, `Anthropic` を順に検索 |
| 重複排除 | `objectID` で管理 |
| 返却フィールド | `url`, `title`, `score`（= HN ポイント数）, `source = "Hacker News"` |

### `fetch_reddit(subreddit: str, limit: int) -> list[dict]`

| 項目 | 内容 |
|------|------|
| エンドポイント | `https://www.reddit.com/r/{subreddit}/top.json?t=day&limit={limit}` |
| User-Agent | `ai-news-bot/1.0`（Reddit API 要件） |
| スコア計算 | `post["score"] + post["num_comments"] * 2` |
| 返却フィールド | `url`, `title`, `score`, `source = "Reddit r/{subreddit}"` |

### `index_articles()` の4パス構成

```
Pass 1: RSS 4ソース → Qdrant upsert（trending_score = 0）
Pass 2: RSS記事のコサイン類似度クロスカバレッジを計算 → set_payload（score × 10）
Pass 3: HN記事 → Qdrant upsert（trending_score = HN ポイント数）
         ※ 同じ URL の RSS 記事があれば社会的スコアで上書き
Pass 4: Reddit記事 → Qdrant upsert（trending_score = Reddit スコア）
         ※ 同じ URL の記事があれば社会的スコアで上書き
後処理: cleanup_articles()（30日 + 低スコア記事削除・500件上限）
```

### trending_score の優先順位

```
社会的スコア（HN/Reddit）> RSS クロスカバレッジ × 10
```

同じ URL の記事が HN/Reddit にもある場合、後でupsert される社会的スコアが優先される。

### `/trending` エンドポイントの有効スコア計算

```python
effective_score = (1 + trending_score) * exp(-days_old * 0.1)
```

`trending_score = 0` でも新着（days_old = 0）なら `effective_score = 1` となり表示対象になる。

---

## 12. 実装順序（Phase 1）

### Step 0: プロジェクト初期化（最初に1回だけ実行）

```bash
npx create-next-app@14 . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

| オプション | 意味 |
|-----------|------|
| `@14` | Next.js 14 を使用（v15 では `searchParams` が `Promise` 型になり設計が変わるため固定） |
| `.` | 現在のディレクトリにプロジェクトを作成 |
| `--typescript` | TypeScript を使用 |
| `--tailwind` | Tailwind CSS をセットアップ（`globals.css`・`tailwind.config.ts`・`postcss.config.js` を自動生成） |
| `--app` | App Router を使用（Pages Router ではない） |
| `--src-dir` | `src/` ディレクトリ構造を使用（§2 のファイルパスと一致させるために必須） |
| `--import-alias "@/*"` | `@/` エイリアスを `src/` に設定（`tsconfig.json` に自動反映） |

このコマンドにより `globals.css` / `tailwind.config.ts` / `postcss.config.js` / `tsconfig.json` / `next.config.mjs` 等の設定ファイルが自動生成される。これらは手動実装不要。

次に、`create-next-app` では自動インストールされない追加パッケージをインストールする:

```bash
npm install @xmldom/xmldom @vercel/analytics
```

| パッケージ | 用途 |
|-----------|------|
| `@xmldom/xmldom` | `rss.ts` で RSS XML をサーバーサイドパース（Node.js に `DOMParser` がないため必要） |
| `@vercel/analytics` | `layout.tsx` で Vercel Analytics を有効化 |

---

### Step 1〜17: ファイル実装

| # | ファイル | 理由 |
|---|---------|------|
| 1 | `src/lib/types.ts` | 全ファイルが依存する型を最初に確定する |
| 2 | `src/constants/sources.ts` | `rss.ts` が依存する |
| 3 | `src/lib/utils.ts` | `NewsCard` が依存する。`rss.ts` より先に作る |
| 4 | `src/lib/rss.ts` | データ取得の核。`types.ts` と `sources.ts` に依存 |
| 5 | `src/app/api/news/route.ts` | `rss.ts` に依存。動作確認用に Phase 1 で実装する |
| 6 | `src/components/NewsCardSkeleton.tsx` | 依存なし |
| 7 | `src/components/NewsGridSkeleton.tsx` | `NewsCardSkeleton` に依存 |
| 8 | `src/components/FilterBarSkeleton.tsx` | 依存なし |
| 9 | `src/components/NewsCard.tsx` | `types.ts` と `utils.ts` に依存 |
| 10 | `src/components/NewsList.tsx` | `NewsCard.tsx` に依存 |
| 11 | `src/components/NewsSection.tsx` | `rss.ts` と `NewsList.tsx` に依存 |
| 12 | `src/components/FilterBar.tsx` | 依存なし（Props は `string[]` のみ） |
| 13 | `src/components/Header.tsx` | 依存なし |
| 14 | `src/app/loading.tsx` | `Header` / `FilterBarSkeleton` / `NewsGridSkeleton` に依存 |
| 15 | `src/app/page.tsx` | 全コンポーネントと `sources.ts` に依存 |
| 16 | `src/app/layout.tsx` | `@vercel/analytics` に依存 |
| 17 | Vercel デプロイ | 全実装完了後 |

---

## 13. デプロイ手順

1. GitHub リポジトリを作成し、プロジェクトをプッシュする
2. [vercel.com](https://vercel.com) にログインし「Add New Project」からリポジトリをインポートする
3. フレームワークが「Next.js」と自動検出されることを確認する
4. 「Deploy」を実行する（Phase 1 は環境変数不要のためそのままデプロイ可能）
5. デプロイ完了後、発行された URL で動作確認を行う
6. 以降は `main` ブランチへのプッシュで自動デプロイされる
