# Ouja Founder Expense Recovery

A responsive Next.js app for reconstructing founder-paid company expenses from memory, estimates, evidence, and finance review.

## Run

```bash
npm install
npm run dev
```

The current workspace has Node available, but no `npm`, `pnpm`, or `yarn` executable on PATH. In a normal Node environment, the scripts above run the app.

## Source of truth

The UI currently persists to browser localStorage through a database-shaped state model so the product can be used immediately. The production source of truth should be Supabase/PostgreSQL using `supabase/schema.sql`. CSV and XLSX are export snapshots only.

## Included

- Seed apartments from the brief
- Founder, finance, and viewer role modes
- Guided apartment rebuild flow
- One-time setup and recurring cost capture
- Evidence upload controls
- Finance approval, rejection, and evidence request states
- SAR formatting
- Arabic/English toggle scaffold
- CSV and XLSX export
- Supabase schema with row-level security policies
