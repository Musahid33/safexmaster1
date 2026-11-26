# Company Onboarding Runbook

**Kabhi bhi nayi company add karni ho to is order me karo.** Order matter karta hai — agar
`companies` record bana diya par admin nahi bana, to company "live" dikhegi lekin koi login
nahi kar payega. Aur agar `public_portal_enabled` galti se `true` ho gaya bina data ke, to
khaali portal public ho jayega.

Reference implementation: **Emveess** (`slug: emveess`, already onboarded).

---

## 0. Pehle ye 3 cheezein tay karo (5 minute, DB se pehle)

| Decision | Rule | Example |
|---|---|---|
| **Slug** | lowercase, `a-z0-9`, hyphen allowed, **dotted nahi** (DB check: `^[a-z0-9]+(-[a-z0-9]+)*$`). Ye slug hi subdomain banega. | `Emveess` → `emveess`, `Shiv Transport` → `shiv-transport` |
| **Admin username** | lowercase, 3–64 chars, `^[a-z0-9][a-z0-9._-]{2,63}$`. **Per company unique** (same username do companies me chalega). | `emveess12`, `shiv01` |
| **Admin email** | real, verified email — password reset aur login identity yahi hai | `admin@shiv.com` |

> Slug baad me badalna aasan nahi hai (URL, reports, branding sab usse bandhe hote hain).
> Isliye pehle se soch lo. Reserved rakhna: `www`, `admin`, `api`, `app`, `portal`.

---

## 1. ⚠️ Deploy-side blockers (jo DB se pehle ya saath me fix karne hain)

Ye na karo to onboarded company **login bhi nahi kar payegi**:

### 1.1 Vercel env vars
Project → Settings → Environment Variables (Production + Preview + Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://nwvycctdcopegkluywfc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>      ← sirf server, NEXT_PUBLIC_ nahi
AUTH_RATE_LIMIT_SECRET=<random 32+ chars>          ← iske bina login "unavailable" deta hai
COMPANY_PORTAL_SLUG=<company slug>                 ← abhi ek hi company ke liye; host-routing ke baad hat jayega
```

`AUTH_RATE_LIMIT_SECRET` missing hua to login **hamesha fail** hoga (code `throw new Error('Rate limiter not configured')` karta hai). Ye aaj ka sabse common "login nahi ho raha" ka reason hai.

### 1.2 Abhi ek deployment = ek company
`COMPANY_PORTAL_SLUG` ek hi slug leta hai. Iska matlab **nayi company onboard karne par
login page bhi usi company ka hoga**. Multi-company ek saath chalane ke liye pehle
host-based routing chahiye (`emveess.safex.cc.us` → `emveess`).
Tab tak: nayi company ke liye ya to env var badlo (re-deploy), ya alag Vercel project banao.

### 1.3 Domain (multi-tenant ke liye, ek baar)
Vercel project me `safex.cc.us` **aur** `*.safex.cc.us` add karo. Wildcard SSL ke liye
domain ke **nameservers Vercel** par hone chahiye (DNS-01 challenge).

---

## 2. Supabase → Authentication → Users (Step 2, SQL se pehle)

Ye step **UI se** karna hai — `auth.users` me direct insert mat karo (password hashing,
email confirmation, session trigger sab miss ho jayega).

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Email: `admin@shiv.com`
3. Password: strong password (company ko alag channel se do)
4. **Auto Confirm User** ✅ tick karo
   *(zaroori hai — `resolve_company_admin_login` sirf `email_confirmed_at is not null` wale users ko leta hai)*
5. User create hone ke baad **user ka UUID copy** karo (ya neeche SQL se `auth.users` se lookup kar lo)

---

## 3. Ek hi transaction me poori company banao (Step 3)

Supabase Dashboard → **SQL Editor** me chalao. `v_slug` / `v_name` / `v_admin_email` /
`v_username` badal do. Baaki **as-is** rakho.

> Neeche wala block **kuch bhi delete nahi karta**. Dobara chalane par `ON CONFLICT` se
> update karega. Galat slug diya to company public **nahi** hogi (start me `public_portal_enabled = false`).

```sql
begin;

-- ══════════ YAHAN APNI COMPANY KI DETAILS BHARO ══════════
select
  'shiv'                          as v_slug,            -- subdomain: shiv.safex.cc.us
  'Shiv Transport Pvt Ltd'        as v_name,
  'admin@shiv.com'                as v_admin_email,     -- Step 2 me banaya hua Auth email
  'shiv01'                        as v_username,        -- login username
  'Shiv Admin'                    as v_display_name,
  '{"primary":"#0b2545","accent":"#f7b32b"}'::jsonb as v_theme
into v;
-- ════════════════════════════════════════════════════════

-- 3.1 Company record (status = 'draft' — public nahi)
insert into public.companies (name, slug, status)
select v_name, v_slug, 'draft' from v
on conflict (slug) do update set name = excluded.name, updated_at = now();

-- 3.2 Company settings — portal OFF (jab tak data nahi bhara)
insert into public.company_settings (company_id, public_portal_enabled, anonymous_allowed, theme)
select c.id, false, true, v_theme from public.companies c, v where c.slug = v.v_slug
on conflict (company_id) do update set theme = excluded.theme, updated_at = now();

-- 3.3 Pehla site/location — onboarding ke liye ek chahiye (multi-site baad me)
insert into public.locations (company_id, name, region, emergency_number)
select c.id, 'Head Office', 'Bihar', '+91-XXXXXXXXXX'
from public.companies c, v where c.slug = v.v_slug
on conflict (company_id, name) do nothing;

-- 3.4 Admin ka app-user record (auth.users se linked)
insert into public.users (company_id, auth_user_id, display_name, designation, active)
select c.id, au.id, v_display_name, 'Company Admin', true
from public.companies c, v
join auth.users au on au.email = v.v_admin_email
where c.slug = v.v_slug
on conflict (company_id, auth_user_id) do update set active = true, display_name = excluded.display_name;

-- 3.5 Admin assignment + login username (ye row login ko enable karti hai)
insert into public.company_admins (company_id, user_id, username, active)
select c.id, u.id, v_username, true
from public.companies c, v
join public.users u on u.company_id = c.id and u.auth_user_id = (select id from auth.users where email = v.v_admin_email)
where c.slug = v.v_slug
on conflict (company_id, user_id) do update set username = excluded.username, active = true;

commit;
```

Agar koi bhi step fail ho (jaise email `auth.users` me nahi mila) to **poora block rollback**
ho jayega — aadhi-adhoori company nahi banegi.

---

## 4. Verify karo (Step 4 — ye skip mat karo)

```sql
-- Ye EXACTLY 1 row aur saare ✓ true aana chahiye
select
  c.slug,
  c.status,
  s.public_portal_enabled                as portal_published,
  (u.id is not null)                     as has_app_user,
  (ca.user_id is not null)               as has_admin_row,
  ca.username,
  (au.email_confirmed_at is not null)    as email_confirmed,
  (select count(*) from public.locations l where l.company_id = c.id and l.active) as active_sites
from public.companies c
left join public.company_settings s on s.company_id = c.id
left join public.users u            on u.company_id = c.id
left join public.company_admins ca  on ca.company_id = c.id and ca.user_id = u.id
left join auth.users au            on au.id = u.auth_user_id
where c.slug = 'shiv';
```

Login-resolver bhi test karo (username → email mapping):

```sql
select * from public.resolve_company_admin_login('shiv', 'shiv01');
-- Ek row aani chahiye: email + company_id. Khaali aaya to 3.4/3.5 me kuch chhoot gaya.
```

Expected: `has_app_user`, `has_admin_row`, `email_confirmed` sab `true`, `active_sites >= 1`,
`portal_published` abhi `false`.

---

## 5. Login test karo (Step 5)

`https://safexmaster1.vercel.app/company-admin/login` → `shiv01` + password.

Kaam na kare to isi order me check karo:

| Symptom | Reason | Fix |
|---|---|---|
| "Sign-in is not configured or temporarily unavailable" | `AUTH_RATE_LIMIT_SECRET` ya Supabase env var missing | Vercel env vars (§1.1) |
| "Unable to sign in" | `COMPANY_PORTAL_SLUG` galat company par set hai | env var update + redeploy |
| Login chal gaya par console khaali | Expected — admin console abhi DB se connected nahi hai | §7 |

---

## 6. Data bharo (Step 6) — aur `public_portal_enabled` ko `false` hi rakho

Frontend abhi in tables se **kuch bhi render nahi karta** (data wiring pending hai),
lekin onboarding ke waqt data sahi shape me daal dena zaroori hai warna baad me dobara
kaam karna padega. Ye do cheezein sabse pehle:

**6.1 Report type convention — snake_case**
Live data snake_case me hai (`near_miss`, `observation`, `hazard`, `suggestion`).
App ke `ReportType` (Title Case) se mapping code me ek jagah define karo. Direct
Title Case insert **na** karo, warna hero counters 0 rahenge.

**6.2 Logo — abhi storage bucket hi nahi hai**
`storage.buckets` khaali hai, aur code `logo_url` kabhi padhta hi nahi. Aaj logo ke liye:
- Filhaal `/public` me static file daal ke `logo_url` me path likh do (DB me record rahega),
- Proper solution: ek `company-logos` bucket (public read) banao + RPC/`brandingFor` me `logo_url` wire karo.

Table-wise minimum jo ek company ko chahiye:

| Table | Kya daalna hai | Publish flag |
|---|---|---|
| `locations` | site name, region, emergency_number (**SOS isi se aata hai**) | `active = true` |
| `life_saving_rules` | `rule_no`, `title`, `body`, `is_active` | `is_active = true` |
| `alerts` | title, body, severity | `is_published = true` |
| `circulars` | title, body, kind | `is_published = true` |
| `events` | title, description, starts_at | `status = 'published'` |
| `training` | title, content_type | `status = 'published'` |
| `documents` | title, category, storage_path | `status = 'published'` **aur** `is_public = true` |
| `rewards` | title, description, recipient_user_id | `status = 'published'` |

---

## 7. Company ko live karo (Step 7 — sirf jab §1 aur §6 done ho)

```sql
-- 7.1 Company ko active karo (iss step ke bina login bhi block hai —
--     current_admin_access sirf status='active' companies return karta hai)
update public.companies set status = 'active', updated_at = now() where slug = 'shiv';

-- 7.2 Portal publish karo (ye abhi sirf RPC ko affect karta hai — UI wiring pending)
update public.company_settings
set public_portal_enabled = true, updated_at = now()
where company_id = (select id from public.companies where slug = 'shiv');
```

> **Publication ek decision hai, default nahi.** Jo bhi fields publish honge (name, sites,
> emergency number, stats) URL jaanne wala koi bhi dekh sakega. Isliye pehle content, phir publish.

---

## 8. End-to-end acceptance test

```bash
# A. RPC se company resolve ho rahi hai?
#    Supabase SQL Editor me:
#    select public.get_public_portal('shiv');
#    → companyName + sites ka JSON aana chahiye

# B. Live URL (aaj path-based; host-based routing ke baad subdomain)
# https://safexmaster1.vercel.app/portal/shiv
# NOTE: abhi ye 404 de raha hai (Vercel env vars + code wiring pending) — §1.1 check karo

# C. Company isolation (do companies ke saath test)
#    shiv ke admin se login karke emveess ka data na dikhe
```

---

## 9. Checklist (print kar lo)

```
[ ] Slug / username / admin email tay
[ ] Vercel env vars set (5 variables) + redeploy
[ ] Supabase Auth user banaya + Auto Confirm ✅
[ ] §3 SQL chalaya (company + settings + location + user + admin)
[ ] §4 verify query: sab true, active_sites >= 1
[ ] resolve_company_admin_login('shiv','shiv01') → 1 row
[ ] Login test pass
[ ] Logo + theme + About/Services/contact bhara
[ ] Kam se kam: 1 location (SOS number), rules, 2-3 alerts/circulars
[ ] Company status = 'active'
[ ] public_portal_enabled = true (last step)
[ ] /portal/shiv par data dikh raha hai
[ ] Doosri company ka data leak nahi ho raha (isolation test)
```

---

## 10. Aaj ke liye ek important caveat

Aapka design ek nayi company ko 30–40 minute me onboard karne ki allow karta hai **agar**
aap SQL chala sakte ho. Par **self-service onboarding UI nahi hai** — admin console me
"Add company" jaisa kuch nahi, aur ek deployment ek hi company ka login dikhata hai
(§1.2). Real onboarding (20 companies) ke liye pehle ye 3 cheezein chahiye:

1. **Host-based routing** (`proxy.ts` + slug from host) — tabhi ek deployment sab companies serve karega
2. **Admin console me real data** — warna admin login karke kuch kar nahi payega
3. **Onboarding API/flow** — abhi ye SQL runbook hi "process" hai; baad me ek secure
   server route (`/api/onboarding`) banao jo yehi transaction chala de (service role, audit log ke saath)

Tab tak: **nayi company = §1 env var change + §2 Auth user + §3 SQL + §4 verify**. Emveess
ko reference ki tarah copy karo.
