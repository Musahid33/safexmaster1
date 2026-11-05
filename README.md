# Safex worker UI

A frontend-only starting point for building the master UI. The worker-facing screens and styling are retained; the admin console, API routes, database integration and server-side code have been removed.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The app uses a labelled preview site and has no live employee directory, published content, authentication or report submission. It is not suitable for operational safety reporting until those services are implemented and connected. Existing UI controls may show unavailable or empty states.

## Company profile

The Company Profile screen is a UI-only placeholder for About Us, Services, Address, Mobile and Email. It does not load or save data. Its reusable profile component accepts company details as props for a future data source. No database or hosting service is required to run the UI. The Privacy Policy is sample text only and must be reviewed and replaced before production use.

## Emergency contact and language

The SOS dialog uses the selected site's `sosNumber` field and never falls back to a hardcoded phone number. The UI-only preview has no number, so it displays an unavailable message instead of a call link. A future tenant data source must supply the correct site-specific number. Language choices remain defined in the frontend.

## Safety alerts UI

The Safety Alerts screen has no sample alerts and shows a disconnected state until a data source is connected. `PublishedSafetyAlert` in `lib/safety-alert-view.ts` defines the fields expected from a future tenant-scoped publishing source, including strip number, category, short description and attachment metadata. The screen accepts alert records and an optional category list as props; the requested categories are used as defaults until a tenant configuration supplies them. There is no admin publishing or database connection in this UI-only build. Attachments are limited to same-origin paths; the future backend must authorize access and provide safe viewing and download responses.
