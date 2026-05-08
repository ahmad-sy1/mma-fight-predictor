# Fight Oracle — Project Guide for Claude

## Project overview
AI-powered UFC fight prediction app. Random Forest model trained on 5,000+ bouts.
Stack: **Next.js 16 (App Router) + Tailwind v4 + FastAPI + Supabase**.

---

## Directory structure

```
mma-fight-predictor/
├── frontend/          # Next.js 16 app
│   └── app/
│       ├── components/    # Shared UI components
│       ├── lib/           # Shared utilities and constants
│       ├── about/         # About page
│       ├── upcoming/      # Upcoming fights page
│       ├── globals.css    # Tailwind @theme + CSS fallbacks
│       ├── layout.tsx     # Root layout
│       ├── page.tsx       # Predict page (home)
│       └── types.ts       # Shared TypeScript types
├── backend/           # All Python code — run from this directory
│   ├── api/           # FastAPI app
│   │   ├── main.py
│   │   ├── model.py
│   │   ├── fighter_info.py
│   │   ├── fighter_stats.py
│   │   └── upcoming.py
│   └── data/          # Data pipeline
│       ├── scraper.py     # One-time full scrape — DO NOT modify for CI
│       ├── sync.py        # Incremental sync — called by CI
│       ├── build_dataset.py
│       └── train_model.py
└── .github/workflows/
    └── scrape.yml     # Weekly sync CI (Monday 08:00 Amsterdam / 06:00 UTC)
```

**Running the backend:** always `cd backend` first. Imports use package-style (`from api.model`, `from data.scraper`) with `backend/` as the working directory root.
- API: `cd backend && uvicorn api.main:app --reload`
- Sync: `cd backend && python -m data.sync`

---

## Frontend conventions

### Tailwind v4
- Colors are defined via `@theme` in `globals.css` — never hardcode hex values in components.
- Available color tokens: `bg`, `surface`, `section`, `line`, `line-strong`, `ink`, `ink-dim`, `ink-mute`, `accent`, `accent-soft`, `blue`, `blue-soft`.
- Usage: `text-accent`, `bg-surface`, `border-line`, `shadow-card`, `animate-fade-up`.
- `globals.css` also has `html, body { background/color }` CSS fallbacks for dev-mode cache safety.
- Dynamic colors (corner = red/blue): use conditional class strings — `corner === 'red' ? 'text-accent' : 'text-blue'`. Do NOT use `style={{ color: 'var(--color-accent)' }}` for static cases.
- The only acceptable remaining inline styles: computed percentage widths for bar charts, SVG size props, SVG stroke transitions, and the fighter search input's dynamic border color.

### Component structure rules
- **Long components get split into private sub-components** defined above the default export in the same file.
- Sub-components are NOT exported — they're local to the file unless reused elsewhere.
- Example: `FighterSearch.tsx` contains `FighterAvatar`, `RecordStrip`, `StreakBanner`, `AccuracyDonuts`, `StatTiles`, `DetailList`, `WinMethodBar`, `Autocomplete` — all unexported, all above the main export.
- Shared sub-component pattern when two components need same UI: define in the file where it's most used (e.g. `FactorRow` exists in both `ResultCard.tsx` and `FightDialog.tsx` independently).

### Shared utilities
- `app/lib/constants.ts` — `API_URL` and other shared constants. Never inline `http://localhost:8000` in component files.
- `app/lib/utils.ts` — `initials(name)` and `heightFmt(cms)`. Never duplicate these.

### Hooks extraction
- Page-specific logic with 3+ state vars belongs in a `use*` hook defined at the top of the same file.
- Example: `usePrediction()` in `page.tsx` manages all fighter fetch + predict state.
- Cross-page hooks go in `app/lib/hooks/`.

### Donut component
- `Donut.tsx` uses `stroke="currentColor"` — color is inherited from parent's `text-*` class.
- Do NOT add a `color` prop back. Wrap in a `text-accent` or `text-blue` div to control color.

### TypeScript
- `PredictionFactor` has `sub?: string` — API may or may not include it.
- Corner type is always `'red' | 'blue'`, never a plain string.

---

## Data pipeline conventions

### scraper.py vs sync.py
- `scraper.py` — one-time full historical scrape. **Do not modify for CI purposes.**
- `sync.py` — incremental sync. Fetches only events newer than latest Supabase row. Called by CI.
- `sync.py` imports functions FROM `scraper.py` — shared scraper logic lives there.

### sync.py logic
1. Fetch all completed events from ufcstats.com (newest first)
2. Query Supabase for most recent event name (1 row only)
3. Walk event list, collect everything newer than known event
4. Skip if nothing new
5. Per new event: scrape fight URLs → scrape fight details → save to Supabase (300ms sleep between fights)

---

## CI/CD

- Workflow: `.github/workflows/scrape.yml`
- Schedule: Monday 06:00 UTC = 08:00 Amsterdam (CEST/summer). In winter (CET) fires at 07:00 Amsterdam — GitHub Actions has no timezone support, 1hr drift is acceptable.
- Manual trigger: GitHub → Actions → Sync UFC fights → Run workflow
- Required secrets: `SUPABASE_URL`, `SUPABASE_KEY`
- Runs `python -m data.sync` from `backend/` directory — verify this path matches repo layout.

---

## What NOT to do
- Do not add inline `style={{}}` for colors that can be Tailwind classes.
- Do not define `API_URL` inline in component files — import from `app/lib/constants.ts`.
- Do not duplicate `initials()` or `heightFmt()` — import from `app/lib/utils.ts`.
- Do not modify `scraper.py` for CI or incremental sync purposes.
- Do not add a `color` prop to `Donut` — use `currentColor` + parent text class.
- Do not change the cron schedule without converting to UTC first.
