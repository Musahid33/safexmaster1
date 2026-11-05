# Safex worker UI

A frontend-only starting point for building the master UI. The worker-facing screens and styling are retained; the admin console, API routes, database integration and server-side code have been removed.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The app uses a labelled preview site and has no live employee directory, published content, authentication or report submission. It is not suitable for operational safety reporting until those services are implemented and connected. Existing UI controls may show unavailable or empty states.

## Company profile

The Company Profile screen is a UI-only placeholder for About Us, Services, Address, Mobile and Email. It does not load or save data. Its reusable profile component accepts company details as props for a future data source. No database or hosting service is required to run the UI. The Privacy Policy is supplied as UI text; verify its accuracy and review it before production use.

## Emergency contact and language

The SOS dialog uses the selected site's `sosNumber` field and never falls back to a hardcoded phone number. The UI-only preview has no number, so it displays an unavailable message instead of a call link. A future tenant data source must supply the correct site-specific number. Language choices remain defined in the frontend.
