# Admin architecture — who uses which URL

**Decision date:** 26 Nov 2026 · **Status:** agreed, not yet built
**Scope note:** this build is frontend-only (no database). The structure below is the
contract for when the data layer is reconnected.

---

## 1. Three surfaces, one deployment

| URL | Folder (when built) | Who | Scope |
|---|---|---|---|
| `/` | `app/page.tsx` | Worker | No login. Reports a concern, views own site's content. |
| `/company-admin` | `app/company-admin/` | Customer's safety manager | **Their own company only.** |
| `/super-admin` | `app/super-admin/` | Safex operator (us) | **All companies.** No worker-level report content. |

These are **routes inside one Next.js project**, not three deployments. One `main` branch,
one Vercel project. Splitting the folder later (e.g. moving super admin to a subdomain)
stays a routing change, not a rewrite.

### Why not one login for both

A super admin can see every tenant. If both roles share a login surface, every single query
must re-check "is this person a super admin?" — one missed check leaks one customer's data
to another. Separate URL and separate session means the company-admin session is scoped to
one company by construction, not by discipline.

Roles also differ in practice: one or two operators versus dozens of customer users, with
different password, MFA and session lifetime expectations. Branding differs too — the
customer console shows the customer's logo, the super admin shows Safex.

`/super-admin` is preferred over `/admin` only for naming consistency with
`/company-admin`. The path is **not** a security control — bots probe both. Protection
comes from authentication, MFA and role checks.

---

## 2. Who creates what — **Option B: the customer owns their own data**

Decided: the customer creates their own employees and locations. Safex does **not**
pre-populate a tenant.

### Super admin (`/super-admin`) creates

- The company record — name, slug, logo, brand colour
- The company's first admin user (invite by email)
- Plan, limits and enabled features
- Onboarding status — invited → active → suspended

### Company admin (`/company-admin`) creates and owns

- Locations / sites
- Departments
- Employees — manual entry **and** CSV bulk import
- Roles and permissions for their own users
- All safety content — reports review, CAPA, training, documents, rewards, circulars, events

### Rationale

The customer knows their own employees, departments and site structure. Pre-populating
hundreds of employee rows on their behalf means every onboarding becomes a manual data
entry job for us, and it goes stale the moment the customer hires someone.

CSV import on the customer side covers the bulk case, so "we want it ready at handover" is
still possible — the customer imports their own sheet during onboarding instead of us
transcribing it.

---

## 3. Boundary that keeps the two consoles honest

The super admin console must **not** become a back door into tenant data. Concretely:

- `/super-admin` shows company metadata, users, limits and health — **not** individual
  hazard reports, employee records or report photos.
- Support access to a tenant's data, if ever needed, is an explicit, time-boxed,
  logged action — not a default view.
- Company admin queries are always filtered by the session's `company_id`. Never by a
  `company_id` passed in from the client.

---

## 4. Build order when the data layer returns

1. Company record + super admin auth (smallest useful slice)
2. Company admin: locations and departments
3. Company admin: employees + CSV import
4. Company admin: report review and status workflow
5. Worker portal reads that company's real site, directory and content
6. Retire the West Bokaro demo fixture (`lib/demo-fixture.ts`) and the demo ribbon

Until step 6 ships, the app stays a demo with no server behind it.
