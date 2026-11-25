# Review — Per-company (multi-tenant) Master UI

**Repo:** `Musahid33/safexmaster1` · **Live:** https://safexmaster1.vercel.app/ · **DB:** Supabase `nwvycctdcopegkluyfc`
**Reviewed:** 25 Nov 2026 · branch `arena/7ba475b8-safexmaster1`

---

## 1. TL;DR (seedha jawab)

Aapka **design/architecture ka direction sahi hai** — database already company-scoped hai (`companies`, `locations`, `reports` … sab me `company_id`), ek `get_public_portal(slug)` RPC hai, `/portal/[company]` route hai, aur branding ka helper bhi hai. **Lekin jo aap chahte ho — "URL se company resolve ho aur usi ka logo, name, data render ho" — wo currently implemented nahi hai.**

Aaj ki live site kya dikha rahi hai (maine check kiya):

| Page | Aaj ka behaviour |
|---|---|
| `https://safexmaster1.vercel.app/` | Generic "Safety Portal", saare counters **0**, upar banner: *"UI preview only · No live data or server report submissions"* |
| `https://safexmaster1.vercel.app/portal/emveess` | **Error/404 page** (data DB me maujood hai — RPC sahi company return karta hai) |
| `https://safexmaster1.vercel.app/company-admin/login` | Login screen dikh rahi hai, lekin console ke andar har page "Data not connected" |

Yani: **multi-tenant ka skeleton hai, lekin host-based routing nahi, DB se branding/logo/data wiring nahi, aur reporting DB se connected hi nahi hai.**

Ek important baat: **live deployment is repo ke code se match nahi karta** (neeche §6 me detail). Isliye pehle "kaun sa code live hai" tay karna zaroori hai.

---

## 2. Requirement vs Reality

| # | Aapki requirement | Status | Proof |
|---|---|---|---|
| 1 | `emveess.safex.cc.us` khulte hi Emveess ka portal | ❌ **Missing** | Poore codebase me `host` / `x-forwarded-host` / subdomain parsing kahin nahi hai (grep: 0 results). Sirf path-based `/portal/<slug>` hai. |
| 2 | `shiv.safex.cc.us` → Shiv ka data, same UI | ❌ Missing | Wahi reason. Aur bina slug ke `/` generic preview dikhata hai. |
| 3 | Company **name** DB se | 🟡 Aadha | `get_public_portal` `companyName` deta hai aur header/title me use hota hai — **par sirf `/portal/<slug>` par**. Root URL par nahi. |
| 4 | Company **logo** DB se | ❌ Nahi | `company_settings.logo_url` DB me column hai, par code me **kabhi padha hi nahi jaata** (`logoUrl` ka 0 usage). Header me hardcoded `/icon-192.png` (Safex ka icon) hai. |
| 5 | Sab **data** (reports, training, docs, alerts, events, circulars, rewards) DB se | ❌ Nahi | `REPORT_SENDER = null`, `SAFETY_ALERTS = []`, vault/feed `[]`, training catalog `null`, employee directory throw karta hai. UI me hi "Reports are not connected in the UI preview" likha hai. |
| 6 | **Reporting** usi portal me (submit + logged reports) | ❌ Nahi | `submitReport()` sirf IndexedDB me queue karta hai, server par bhejta hi nahi. Koi `app/api` route maujood nahi. |
| 7 | Company admin console me us company ka data | ❌ Nahi | `CompanyPage.tsx` me har widget "Data not connected", saare buttons disabled. |
| 8 | Alag company → alag admin login | 🟡 Design galat | Login `COMPANY_PORTAL_SLUG` **env var** se hota hai — yani **ek deployment = ek company**. 20 companies ke liye 20 deployments chahiye honge. Host se resolve hona chahiye. |
| 9 | Per-tenant PWA/manifest/title/icon | ❌ Nahi | `app/manifest.ts` aur `app/layout.tsx` dono static "Safety Portal". |
| 10 | Naya company add karna (onboarding) | ❌ Nahi | Koi admin CRUD / provisioning script nahi. SQL se manually insert karna padta hai. |

---

## 3. Jo achha bana hua hai (isko todna nahi)

- **DB schema genuinely tenant-safe hai:** har business table me `company_id`, aur child tables me composite FK `(company_id, id)` — cross-company link DB level par rukta hai.
- **`get_public_portal(p_slug)`** `security definer` + fixed `search_path` + slug regex + `public_portal_enabled` flag — achha pattern. Publication opt-in hai (default `false`), ye best practice hai.
- **RLS enabled hai sab tables par**, aur `anon`/`authenticated` par default revoke — foundation bilkul sahi hai.
- **Runtime validation:** `parsePublicPortal()` strictly validate karta hai (UUID, slug regex, duplicate site id, stats bounds) aur tests bhi hain (`tests/public-portal.test.mjs`).
- **Admin auth defence-in-depth:** `proxy.ts` + `lib/server/admin-guard.ts` dono verify karte hain, `current_admin_access()` sirf `auth.uid()` se derive hota hai — client-supplied company id trust nahi hota.
- **Site selection tenant-scoped** hai (`safex-active-site:<tenantId>`), ek tenant ki choice doosre tenant me leak nahi hoti.
- `/portal/[company]` par `dynamic = 'force-dynamic'` + `no-store` — company ke beech cache leak nahi hoga.

---

## 4. P0 — Blockers (ye kiye bina requirement pura nahi hoga)

### 4.1 Host-based tenant resolution hi nahi hai
Aaj routing **path** par hai (`/portal/emveess`), aapko **host** par chahiye (`emveess.safex.cc.us`).

Karna hoga (recommended design):

**Step 1 — `proxy.ts` me host → slug**
```ts
// proxy.ts (Next 16 middleware equivalent)
const ROOT = process.env.PORTAL_ROOT_DOMAIN ?? 'safex.cc.us'; // env se, hardcode nahi

function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(':')[0].toLowerCase();
  if (h === ROOT || h === `www.${ROOT}`) return null;          // apex → landing
  if (!h.endsWith(`.${ROOT}`)) return null;                     // vercel.app → preview
  const sub = h.slice(0, -(ROOT.length + 1));
  if (!sub || sub.includes('.')) return null;                    // ek level hi
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(sub) ? sub : null;
}

// request header me daalo, rewrite mat karo:
request.headers.set('x-tenant-slug', slug)
```
Aur matcher badhao — abhi sirf `/company-admin/:path*` hai, isko poori site par chalao (`/company-admin` bhi host-aware ho).

**Step 2 — server-side tenant load (root page bhi)**
`app/page.tsx` abhi `'use client'` hai. Isko server component banao jo `headers()` se slug nikaale, `loadPublicPortal(slug)` call kare, aur `<PortalProvider>` me wrap karke existing UI render kare:

```
app/page.tsx          → server: resolve tenant from host → <PortalProvider portal={p}><SafexHome/></PortalProvider>
app/SafexHome.tsx     → ab jo aaj ka page.tsx hai (client), wahi shift hoga
app/portal/[slug]/page.tsx → same server component reuse (ya canonical host par 301)
```
Isse **ek hi page root aur subdomain dono par** kaam karega, aur `generateMetadata()` se per-company **title/OG/manifest** bhi mil jayega.

**Step 3 — fail-closed**
- Unknown / unpublished / suspended slug → **404**, generic portal nahi (warna data leak + confusing).
- Apex domain → landing page (ya `www` par redirect).
- `/portal/<slug>` ko canonical subdomain par **301** kar do (duplicate content aur galat reporting se bachne ke liye).

**Step 4 — Vercel side**
- Project me `safex.cc.us` **aur** `*.safex.cc.us` dono domains add karo.
- Wildcard SSL ke liye **Vercel nameservers** chahiye (DNS-01 challenge) — domain ke NS Vercel par point karne padenge. (Bina NS delegation wildcard cert nahi banega.)
- Current token se `list_projects` khali aa raha hai — connector ka access scope check kar lena, warna domain add nahi hoga.
- Note: Vercel **Hobby plan non-commercial only** hai; company product ke liye Pro lena padega.

### 4.2 Branding DB se wired nahi (name aadha, logo zero)
- `lib/public-portal.ts` ka `PublicPortal` type me `logoUrl`, `theme`, `about`, `email`, `mobile`, `features` **hain hi nahi** → RPC bhi nahi bhejta → UI tak pahunchta hi nahi.
- `lib/app-config.ts:31` me `logoPath: null` hardcoded.
- `app/page.tsx:503` header me hardcoded `/icon-192.png` (Safex icon) — tenant logo kabhi nahi.
- `app/components/MorePages.tsx:262,270` — install page bhi Safex icon + "The Safex logo is used for the app." dikhata hai.
- Fallback branding (monogram `S`) bhi `app/page.tsx:699` me hardcoded.

Karna hoga:
1. RPC payload extend karo: `logoUrl`, `theme`, `about`, `services`, `address`, `email`, `mobile`, `website`, `publicPortalEnabled` — versioned (`v: 2`) rakho taaki `parsePublicPortal` backward-compatible rahe.
2. `brandingFor(companyName)` → `brandingFor(portal)` banao.
3. Header/logo component tenant logo use kare; logo na ho to **company ke initials** (Safex icon nahi — Safex sirf platform/admin console ka brand hai).
4. `app/layout.tsx` static metadata → `generateMetadata()` per tenant; `app/manifest.ts` → `app/manifest.webmanifest/route.ts` jo host se naam/icon de. (Install ki hui app ka naam company ke hisaab se badlega.)
5. Safex logo/footer ko **platform branding** me rakho, tenant UI me nahi (ya "Powered by Safex" chhota rakho — wo aapki marzi, par decision consistent ho).

### 4.3 Live site data render nahi kar rahi (`/portal/emveess` error)
Maine DB me check kiya — data bilkul theek hai:
```
get_public_portal('emveess') → { companyId: a3ff22f4…, companyName: "Emveess",
   sites: [{ name: "West Bokaro (WBD)", … }] }   ✅
companies: 1 active, public_portal_enabled = true
```
Iske baad bhi live URL error de raha hai. Sabse sambhavit wajah: **Vercel par `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set nahi hain** → `loadPublicPortal` `null` return karta hai → `notFound()`.

Check karne ki cheez:
```sql
-- Supabase me (migration drift ke liye)
select version, name from supabase_migrations.schema_migrations order by version;
```
aur Vercel → Project → Settings → Environment Variables me teeno honi chahiye:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `COMPANY_PORTAL_SLUG` (jab tak host-routing na ho).

### 4.4 Reporting server-side connected hi nahi
- `app/page.tsx:36` → `const REPORT_SENDER: ReportSender | null = null;`
- `submitReport()` (line ~441) sirf `queueReport()` karta hai; **koi API route nahi** (`app/api` folder hi nahi hai).
- `LoggedReports` component DB se kuch fetch nahi karta — hardcoded "not connected" error dikhata hai.
- Alerts (`SAFETY_ALERTS = []`), training (`null`), documents (`[]`) — sab empty.

Karna hoga: `app/api/reports/route.ts` (POST) — **host se tenant resolve** → body validate → rate-limit → service-role se `reports` insert → queue ID ko `idempotency` key banao. Client par `insert` permission **mat do** (neeche security dekho). Uske baad `REPORT_SENDER` wire karo aur LoggedReports ko read API (ya RPC) se jodo — field allow-list ke saath (reporter name dikhe, phone/email/address kabhi nahi).

### 4.5 Preview banner + placeholder text production me hai
Har page ke top par: *"UI preview only · No live data or server report submissions"*. Company ko live demo dikhane se pehle ye hataana/gate karna zaroori hai (`NODE_ENV` / preview flag), warna client ke saamne "ye adhura hai" likha aayega. Isi tarah "UI preview", "Data not connected", "not connected in the UI preview" jaise ~40+ strings hain.

---

## 5. P1 — Correctness bugs (data connect karte hi phootenge)

### 5.1 Report type mismatch — hero counters hamesha 0 rahenge
Aapke live DB me `reports.type` snake_case hai:
```
hazard(7), near_miss(18), observation(46), suggestion(5)
```
Lekin repo ki RPC Title Case count karti hai:
```sql
r.type = 'Near Miss'            -- kuch match nahi karega
r.type = 'Safety Observation'   -- kuch match nahi karega
```
→ `nearMissCount`/`safetyObservationCount` **always 0**. Yahi "Days Without Injury 0" ka bhi ek hissa hai.

Fix: ek canonical convention tay karo. Recommendation: **DB snake_case** rakho (`near_miss`, `observation`, …), UI ke `ReportType` ↔ DB ke beech ek mapping table banao, aur RPC usi par count kare. Live `v_public_stats` view already snake_case use karti hai — usi se match karo.

### 5.2 Live DB vs repo migrations — **drift dono taraf**
- Repo me 11 migrations hain, live par **9** applied hain (`hardening_and_indexes` aur `public_site_stats` live par nahi hain).
- Live par 4 migrations aise hain jo **repo me hi nahi hain**: `master_ui_compat`, `public_stats_views`, `anon_grants_master_ui`, `grant_modules_anon`.
- Live par 10 extra tables hain jo repo ke migrations me nahi: `alerts`, `circulars`, `contact_messages`, `gallery_items`, `life_saving_rules`, `training_assignments`, `v_public_stats`, `v_public_training_stats`, `admin_login_attempts`, `company_admins`.
- Live `companies.status` policy `('active','trial')` allow karti hai — par repo ke schema me `trial` valid status hi nahi hai.

Iska seedha asar: **repo se deploy karke schema sync nahi hoga**, aur naye environment par app tootega. Fix: live schema ko source of truth maan kar `supabase db pull` (ya pg_dump schema) karke ek **baseline migration** repo me commit karo, uske baad naye changes sirf migrations se jaayein. Purane `20261122120000_hardening_and_indexes.sql` ko chala kar dekhna padega (report type check `open/in_progress/closed` par live data pass karega, lekin stats RPC phir bhi type mismatch ki wajah se 0 dega).

### 5.3 Per-tenant admin login galat model par hai
`COMPANY_PORTAL_SLUG` ek env var hai → ek deployment = ek company. Aap chah rahe ho 20 companies ek hi deployment par. Login bhi host se resolve hona chahiye:
```
host emveess.safex.cc.us → slug 'emveess' → resolve_company_admin_login('emveess', username)
```
Aur `mayAccessAdmin` me company id **host se** aani chahiye, cookie se nahi (cookie user-controlled hai).

### 5.4 Multi-site UI ka ek edge case
`initialSiteId()` single site par auto-select karta hai, multi-site par user se poochta hai — theek hai. Par `displaySites` empty (tenant unresolved) hone par bhi **site dialog khulta hai**, jabki portal hi unavailable hona chahiye. Host-resolution ke baad ye automatically fix ho jayega (404 pehle).

---

## 6. Live deployment vs repo — verify karo (important)

Repo aur live site **different code** dikha rahe hain:

| Cheez | Repo (`main` @ `01f14a9`) | Live site |
|---|---|---|
| `/company-admin/login` heading | "Welcome Back" + **single** "Username" field | "Safety starts with your people", "COMPANY ADMIN ACCESS", **"Company code" + "User name" + "Password"** |
| Visual text search | `"Safety starts"` kahin nahi | Live par maujood |

Matlab: ya **Vercel par purana commit deploy hai**, ya kisi aisi branch se deploy hua hai jo `main` me merge nahi hui, ya build fail ho raha hai. Isko sabse pehle settle karo — warna main me fix karke bhi live par kuch nahi badlega.

Check:
```bash
gh api repos/Musahid33/safexmaster1/deployments --jq '.[0:5][] | "\(.created_at) \(.ref) \(.environment)"'
```
Plus Vercel dashboard me last production deployment ka commit SHA.

Repo hygiene (is branch par):
- `safexmaster1.zip` (3.7 MB) **committed hai** — isme ek purana snapshot (`.aistudio/` artifacts, `dist/`, duplicate `favicon.ico`) hai. Ise remove karo, `.gitignore` me `*.zip` add karo.
- `.gitignore` already employee-master CSV block karta hai — achha.

---

## 7. Security — live DB me serious gaps (ye sabse pehle)

Maine `anon` role se test karke verify kiya. Achhi khabar: RLS ne 58 private reports block kiye. **Buri khabar: 18 reports `anon` ko readable hain, aur bahut saare write grants khule pade hain.**

| Risk | Detail | Evidence |
|---|---|---|
| 🔴 **Cross-tenant read** | Policy `pub_reports_read USING (is_public)` — `company_id` filter **nahi**. Yani Emveess ka `is_public=true` report Shiv ka anon user bhi padh sakta hai. Aaj 18 aise reports hain. | `select … set role anon` → 18 rows |
| 🔴 **Open insert** | `pub_reports_insert` `WITH CHECK (true)` + `anon` ko `INSERT`. Koi bhi publishable key se apni marzi ka `company_id`, `location_id` aur **`is_public=true`** insert kar sakta hai → spam + doosri company ke naam par fake report. | grants + policy |
| 🔴 **Company settings leak** | `pub_settings USING (true)` — **saari** companies ka `email`, `mobile`, `address`, `about` aur `public_portal_enabled` status padha ja sakta hai, chahe unka portal publish na ho. | anon read → 1 row |
| 🟠 **Employee CRUD** | `reports`, `users`, `documents`, `training`, `locations` par `authenticated` ko UPDATE/DELETE, aur policy `is_company_user()` sirf itna dekhti hai ki user us company ka hai — **role/permission nahi**. Koi bhi employee saare reports edit/delete kar sakta hai. `roles`/`permissions`/`user_roles` tables hain par unki koi policy nahi. | policy dump |
| 🟠 **Over-broad anon grants** | `life_saving_rules`, `training_assignments`, `contact_messages`, `gallery_items` par `anon` ko `INSERT/UPDATE/DELETE`; `v_public_stats`, `v_public_training_stats` par bhi full grants. Aaj RLS bacha rahi hai (ya view aggregate hai to insert fail hoga), par ye ek policy bug door se data loss hai. Views `security_invoker` nahi hain → RLS bypass karti hain. | grant dump |
| 🟡 **Leftover dev tables** | `contact_messages`, `gallery_items`, `training_assignments`, `admin_login_attempts` — repo migrations me nahi hain, matlab governance ke bahar bane hain. | migration list |

**Fix (order):**
1. `revoke all on all tables in schema public from anon;` — phir sirf wahi grants do jo RPC ke liye chahiye (aaj ek bhi direct table grant nahi chahiye; sab `security definer` RPC / server route se karo).
2. `drop policy pub_reports_read` — public feed **kabhi** direct table se na do; server route host→company resolve karke field allow-list ke saath de.
3. `pub_settings` ko `public_portal_enabled = true and companies.status='active'` tak seemit karo (ya RPC hata do).
4. `pub_reports_insert` hatao → server-side ingestion (rate limit + validation + idempotency).
5. `is_company_user()` ke saath role check jodo: `is_company_user(company_id) AND has_permission(company_id, 'reports.write')`.
6. Views ko `with (security_invoker = true)` banao ya `revoke` kar do.

---

## 8. Recommended architecture (ek nazar me)

```
Next.js (single deployment)
│
├─ proxy.ts (middleware)
│    host → slug ──► x-tenant-slug header        (unknown → 404)
│    apex/www    ──► landing page
│    /portal/x   ──► 301 to x.<root>             (canonical)
│
├─ Server layer (per request)
│    resolveTenant(): slug → get_public_portal(slug)   [no-store]
│    → { companyId, name, logoUrl, theme, sites, features }
│
├─ app/page.tsx (server)  ──► <PortalProvider portal> <SafexHome/> </PortalProvider>
│    generateMetadata()  ──► per-company title / OG / manifest
│    /portal/[slug]      ──► same component (dev/testing)
│
├─ app/api/reports/route.ts (POST/GET)
│    host → tenant → validate → rate limit → service role → reports table
│    GET: only this company + only allow-listed fields
│
├─ app/company-admin/*   ──► login & data also host-scoped
│
└─ Supabase
     get_public_portal(slug) v2  (logo, theme, stats with CORRECT type values)
     RLS: anon = 0 grants; authenticated = role-gated
```

**Zaroori principle:** tenant kabhi bhi client se na aaye. `host` (Vercel) → server par resolve → company id. Client ko `companyId` sirf read-only context ke liye do, aur har query server par dobara verify ho.

---

## 9. Phase-wise roadmap

**Phase 0 — Safai (0.5 din)**
- [ ] Vercel deployment ↔ repo sync confirm karo; env vars verify
- [ ] `safexmaster1.zip` remove + `.gitignore`
- [ ] DB drift: `supabase db pull` → baseline migration repo me

**Phase 1 — Security (1 din, isse pehle kuch mat karo)**
- [ ] `anon` ke saare table grants revoke
- [ ] `pub_reports_read`, `pub_reports_insert`, `pub_settings` policies fix
- [ ] Role-based `is_company_user` / permissions
- [ ] Views `security_invoker`

**Phase 2 — Host-based multi-tenant (2–3 din)**
- [ ] `proxy.ts` host → slug → header; matcher full site
- [ ] `app/page.tsx` server component + `generateMetadata`
- [ ] 404 on unknown/unpublished; apex landing; `/portal/<slug>` → 301
- [ ] Vercel: `safex.cc.us` + `*.safex.cc.us`, nameservers → Vercel (wildcard SSL)

**Phase 3 — Branding from DB (1–2 din)**
- [ ] RPC v2: `logoUrl`, `theme`, `about`, contact, features
- [ ] `brandingFor(portal)`; header/install/about me tenant logo
- [ ] Per-tenant manifest + icons + theme color
- [ ] Preview banner / "not connected" text gate karo

**Phase 4 — Reporting + content (3–5 din)**
- [ ] `app/api/reports` POST/GET + `REPORT_SENDER` wire + offline queue flush
- [ ] LoggedReports DB se (field allow-list)
- [ ] Alerts / Events / Circulars / Training / Documents / Rewards DB se
- [ ] Employee directory (passport lookup) server route se

**Phase 5 — Admin console (3–5 din)**
- [ ] Host-based company login (env var hatao)
- [ ] CompanyPage ko real data se jodo, actions enable karo
- [ ] Company provisioning flow (naya tenant = record + admin + settings)

**Phase 6 — Polish**
- [ ] Per-tenant theme, favicon, OG image
- [ ] Tests: host→slug unit tests, cross-tenant isolation test (2 companies)
- [ ] Analytics/reporting per tenant

---

## 10. Verification commands (khud check karne ke liye)

```sql
-- 1. Admin kaun hai
select c.name, c.slug, c.status, s.public_portal_enabled, s.logo_url
from public.companies c left join public.company_settings s on s.company_id=c.id;

-- 2. Kya anon ko kuch dikh raha hai (0 aana chahiye, aaj 18 aata hai)
begin; set local role anon;
select count(*) from public.reports;
rollback;

-- 3. Type convention
select type, status, count(*) from public.reports group by 1,2;

-- 4. Drift
select version, name from supabase_migrations.schema_migrations order by version;
```

```bash
# Live par tenant route ka status
curl -s -o /dev/null -w "%{http_code}\n" https://safexmaster1.vercel.app/portal/emveess
```

---

## 11. Final verdict

| Sawaal | Jawab |
|---|---|
| Kya code us tarah se bana hua hai (URL se company)? | **Nahi.** Path-based `/portal/<slug>` hai, host-based nahi. Root URL generic hai. |
| UI same rahega, data badlega? | **Design ready hai** (PortalProvider, tenant-scoped site selection) — bas wiring missing. |
| Logo/name DB se? | Name aadha (sirf portal route par), **logo bilkul nahi**. |
| Reporting usi me? | **Nahi** — sirf local IndexedDB queue, server nahi. |
| Admin console me data? | **Nahi** — pura UI placeholder. |
| Sabse bada risk? | Live DB me **cross-tenant read + open insert** — multi-tenant banane se pehle fix karna zaroori. |
| Sabse pehla kaam? | (1) Security fix, (2) host routing, (3) live/repo sync confirm. |

Achhi baat: foundation (schema, RLS skeleton, RPC pattern, tenant-scoped UI state) sahi hai — **rebuild nahi, wiring karni hai**. Order matter karta hai: **security → host routing → branding → data/reporting → admin**.
