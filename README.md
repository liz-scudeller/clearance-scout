# SaleRadar

SaleRadar is a clean MVP for discovering and reporting local closing sales, clearance sales, warehouse sales, relocation sales, and liquidation deals.

## Stack

- React + Vite
- Tailwind CSS
- Node.js + Express
- Supabase Postgres, Auth, and Storage

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
3. Run `supabase/seed.sql` for sample deals.
4. Create a public Supabase Storage bucket named `deal-images`.
5. Copy `client/.env.example` to `client/.env`.
6. Copy `server/.env.example` to `server/.env`.
7. Fill in the Supabase values.

## Run locally

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

The API runs on `http://localhost:4000`. Vite will print the frontend URL.

## Deal Scanner

Run the scanner schemas before using the scanner:

```sql
-- Supabase SQL Editor
-- Run these files in order:
supabase/migrations/002_deal_scanner_schema.sql
supabase/migrations/003_ai_classification_schema.sql
```

Optional scanner API keys live in `server/.env`:

```bash
SEARCH_PROVIDER=serpapi
SERPAPI_KEY=
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
EVENTBRITE_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
AI_CLASSIFICATION_ENABLED=true
AI_AUTO_APPROVE_THRESHOLD=85
AI_PENDING_REVIEW_THRESHOLD=60
AI_CLASSIFICATION_BATCH_LIMIT=20
```

Manual scanner run:

```bash
cd server
npm run scan:deals
```

Admin scanner UI:

```text
/admin/scanner
```

### AI classification

The scanners collect raw public mentions only. AI does not scrape or fetch websites.

Flow:

1. Scanners save raw data to `raw_deal_mentions` with `classification_status = new`.
2. If `AI_CLASSIFICATION_ENABLED=true`, the scanner job classifies up to `AI_CLASSIFICATION_BATCH_LIMIT` new mentions.
3. AI returns structured JSON with relevance, sale type, category, confidence, summary, admin notes, and suggested status.
4. High confidence mentions can become active deals.
5. Medium confidence mentions become pending deals for admin review.
6. Low confidence mentions stay ignored as raw mentions.

Manual AI endpoints:

```http
POST /api/admin/ai/classify/:rawMentionId
POST /api/admin/ai/classify-batch
GET /api/admin/ai/classification-results
```

The `/admin/scanner` page includes buttons for `Classify with AI`, `Classify New Mentions`, `Convert to Deal`, `Ignore`, and `View Source`.
