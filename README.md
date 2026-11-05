# Safex worker UI

A frontend-only starting point for building the master UI. The worker-facing screens and styling are retained; the admin console, API routes, database integration and server-side code have been removed.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The preview has no connected company or sites, employee directory, published content, authentication or report submission. Site-dependent report forms are unavailable until site data is supplied. It is not suitable for operational safety reporting until those services are implemented and connected. Existing UI controls may show unavailable or empty states.

## Company profile

The Company Profile screen is a UI-only placeholder for About Us, Services, Address, Mobile and Email. It does not load or save data. Its reusable profile component accepts company details as props for a future data source. No database or hosting service is required to run the UI. The Privacy Policy is supplied as UI text; verify its accuracy and review it before production use.

## Emergency contact and language

The SOS dialog uses the selected site's `sosNumber` field and never falls back to a hardcoded phone number. The UI-only preview has no number, so it displays an unavailable message instead of a call link. A future tenant data source must supply the correct site-specific number. Language choices remain defined in the frontend.

## Site selection

Once a tenant and its sites are connected, on a device's first visit the user chooses a site, even if only one is listed. The selection is remembered in local browser storage under that tenant ID; a removed or invalid site must be selected again. If storage is blocked or cleared, the choice is requested again. When multiple sites are available the header provides a site switcher.

SOS reads only the selected site's configured number. Life Saving Rules come from the selected site's `lifeSavingRules`, and recognition items carry a `siteId` so the gallery displays only the selected site's entries. The UI-only preview has no configured rules, emergency number or recognitions. A future integration must provide a stable tenant ID and enforce tenant and site authorization server-side; browser storage and client-side filtering are not security boundaries.

## Portal branding

The UI builds the title from the supplied company name as `<Company Name> - Safety Portal`, and uses the shared Safex logo. Without tenant data it displays the generic `Safety Portal` label. The browser title is updated when company data is provided. The current static PWA manifest uses a generic name; a future tenant-aware server manifest is required for company-specific installed app names. No database is connected.

## Offline report queue

The UI includes an IndexedDB queue for reports and attachments, scoped by tenant and site. Saving locally is not a server submission. A company and site must be supplied before a report can be queued; the current preview supplies neither. Anonymous reports omit the employee object, but entered text and photos may still identify a person. Data stored on the device is not encrypted by this app and may be lost if browser storage is cleared or evicted.

There is no server sender in this preview, so queued reports cannot yet be uploaded. A future authenticated, tenant-authorized sender must accept the queue ID as an idempotency key and confirm durable server storage before the queue deletes a report. The retry hook runs at app startup and on an online event while the app is open; it does not provide background sync or offline app-shell caching. Do not use this preview for operational safety reporting.
