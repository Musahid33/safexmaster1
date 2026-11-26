# Safex worker UI — frontend-only master UI

A **frontend-only** master UI for the worker safety portal. No backend, no database, no
authentication and no environment variables. Deploy it anywhere (Vercel included) and every
screen opens with sample data.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000.

## What is in this build

The app runs on **one demo location — West Bokaro (WBD)** — with sample employees, reports,
events, circulars and rewards. Nothing is sent anywhere and nothing is written to a database.

| Area | Status |
|---|---|
| Home, site banner, life saving rules, SOS | UI complete (demo data) |
| Report forms — Hazard, Near Miss, Safety Observation / UC / UA | UI complete, saves to the device only |
| Hazard form | Category (9 types), description, 1–5 severity, immediate action, camera/gallery photo |
| View Reports, filters, report detail | UI complete (demo data) |
| Training, Document Vault, Rewards, Alerts, Circulars | UI shells with empty/absent states |
| Employee Passport and search | UI complete (demo directory) |
| Company Admin console | **Removed** from this build |
| Report submission to a server | **Not connected** — reports stay on the device |

Reports submitted in the UI are queued in the browser (IndexedDB) and, for the demo, also
appear immediately in **View Reports**. Clearing site data removes them.

## Not suitable for operational use yet

This build has no server, so a submitted report never reaches a safety team. Do not use it
for real safety reporting until an authenticated, tenant-scoped ingestion service is
connected.

## Demo data

`lib/demo-fixture.ts` holds the single demo location, its employees, feed items, rewards and
sample reports. To connect the real database later:

1. Replace the fixture with a tenant data source (company, sites, directory, content).
2. Remove the demo ribbon and the `demo-*` placeholders in `app/page.tsx`.
3. Delete `public/demo/` sample photos once real attachments are served.

## Repository docs

`docs/` keeps the earlier review and planning notes. They describe the database, RLS and
multi-tenancy work that was removed from this build and are not used at runtime:

- `docs/multi-tenant-review.md` — requirement-vs-reality audit
- `docs/emveess-data-model.md` — per-table data model for a company
- `docs/company-onboarding-runbook.md` — onboarding order
- `docs/supabase-company-record.md` — SQL for a new company record
