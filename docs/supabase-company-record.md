# Supabase me nayi company ka record kaise banega

**Tested:** neeche wala SQL maine live DB par chala kar verify kiya hai (rollback ke saath — koi
test data nahi bacha). Emveess ka setup reference hai.

---

## Pehle samjho: "company ka record" = 1 nahi, **5 rows**

Ek company DB me 5 jagah entry maangti hai. Agar sirf `companies` me row daal do to company
**ban jayegi par koi login nahi kar payega aur kuch dikhega nahi**.

```
companies            ← company ka identity card (name, slug, status)
   │
   ├── company_settings   ← branding: logo_url, about, theme, public_portal_enabled
   ├── locations          ← site(s); SOS number yahin se aata hai
   ├── users              ← company ka banda; auth.users se linked (login ke liye zaroori)
   │      └── company_admins ← yahi row login ko enable karti hai + username yahan hai
   └── (baad me) alerts, circulars, training, documents, rewards, life_saving_rules …
```

Ye **5 rows** ek hi transaction me banani chahiye — warna aadhi company ban ke reh jayegi.

---

## Pehle: admin ka login identity banao (Auth UI se)

`auth.users` me **direct SQL se insert mat karo** (password hash, email confirm, session —
sab Supabase handle karta hai).

**Supabase Dashboard → Authentication → Users → Add user**

| Field | Value |
|---|---|
| Email | `admin@shiv.com` (company ka real email) |
| Password | Strong password — company ko alag se do |
| **Auto Confirm User** | ✅ **Zaroori tick karo** |

> **Kyun Auto Confirm zaroori hai?** `resolve_company_admin_login()` sirf wahi user leta hai
> jiska `email_confirmed_at` set ho. Bina confirm ke login hamesha fail hoga aur error
> "Unable to sign in" aayega — samajh nahi aayega kyun.

---

## Ab ye SQL chalao

Supabase Dashboard → **SQL Editor** → paste → **Run**.
Sirf top ke 5 variables badalne hain:

```sql
do $$
declare
  ── ══════ YAHAN BADLO (5 lines) ══════ ──
  v_slug         text := 'shiv';                       -- subdomain: shiv.safex.cc.us
  v_name         text := 'Shiv Transport Pvt Ltd';
  v_admin_email  text := 'admin@shiv.com';             -- Authentication me banaya hua email
  v_username     text := 'shiv01';                     -- admin ka login username
  v_display_name text := 'Shiv Admin';
  v_theme        jsonb := '{"primary":"#0b2545","accent":"#f7b32b"}'::jsonb;
  ── ═════════════════════════════════════ ──

  v_company_id uuid;
  v_auth_id    uuid;
  v_user_id    uuid;
begin
  -- 0. Auth user dhundo (nahi mila to saaf error do)
  select id into v_auth_id from auth.users where email = v_admin_email;
  if v_auth_id is null then
    raise exception 'Auth user "%" nahi mila. Pehle Authentication → Users me banao (Auto Confirm ✅).', v_admin_email;
  end if;
  if (select email_confirmed_at from auth.users where id = v_auth_id) is null then
    raise exception 'Email confirm nahi hai. Auth user ko confirm karo warna login fail hoga.';
  end if;

  -- 1. Company (draft = public nahi, par admin login kar sakta hai)
  insert into public.companies (name, slug, status)
  values (v_name, v_slug, 'draft')
  on conflict (slug) do update set name = excluded.name, updated_at = now()
  returning id into v_company_id;

  -- 2. Settings — branding slot + portal OFF
  insert into public.company_settings (company_id, public_portal_enabled, anonymous_allowed, theme)
  values (v_company_id, false, true, v_theme)
  on conflict (company_id) do update set theme = excluded.theme, updated_at = now();

  -- 3. Pehla site (SOS number isi se aayega) — multi-site baad me add kar sakte ho
  insert into public.locations (company_id, name, region, emergency_number)
  values (v_company_id, 'Head Office', 'Bihar', '+91-9000000000')
  on conflict (company_id, name) do nothing;

  -- 4. Admin ka app-user record (auth se linked)
  insert into public.users (company_id, auth_user_id, display_name, designation, active)
  values (v_company_id, v_auth_id, v_display_name, 'Company Admin', true)
  on conflict (company_id, auth_user_id) do update
    set active = true, display_name = excluded.display_name
  returning id into v_user_id;

  -- 5. Admin assignment + username  ← YAHI ROW LOGIN ENABLE KARTI HAI
  insert into public.company_admins (company_id, user_id, username, active)
  values (v_company_id, v_user_id, v_username, true)
  on conflict (company_id, user_id) do update
    set username = excluded.username, active = true;

  raise notice '✅ Company "%" ban gayi (id: %)', v_slug, v_company_id;
end $$;
```

**`do $$ ... $$` block ek single transaction me chalta hai** — kahin bhi fail hua to **poora
rollback**, aadhi company nahi banegi. Dobara chalane par `ON CONFLICT` se update ho jayega,
duplicate nahi banega.

> `do` block `select` ka result nahi dikhata — success par sirf "Success. No rows returned"
> aayega, error par exact message. Verify ke liye neeche wali query chalao.

---

## Verify karo (ye step skip mat karo)

```sql
select
  c.slug,
  c.status,
  s.public_portal_enabled                as portal_published,
  (u.id  is not null)                    as has_app_user,
  (ca.user_id is not null)               as has_admin_row,
  ca.username,
  (au.email_confirmed_at is not null)    as email_confirmed,
  (select count(*) from public.locations l
     where l.company_id = c.id and l.active)  as active_sites
from public.companies c
left join public.company_settings s on s.company_id = c.id
left join public.users u            on u.company_id = c.id
left join public.company_admins ca  on ca.company_id = c.id and ca.user_id = u.id
left join auth.users au             on au.id = u.auth_user_id
where c.slug = 'shiv';
```

**Expected (1 row):**

| slug | status | portal_published | has_app_user | has_admin_row | username | email_confirmed | active_sites |
|---|---|---|---|---|---|---|---|
| shiv | draft | **false** | **true** | **true** | shiv01 | **true** | **1** |

Aur login-resolver test:

```sql
select * from public.resolve_company_admin_login('shiv', 'shiv01');
-- 1 row aani chahiye (email + company_id)
-- khaali aaya = step 4/5 me kuch chhoot gaya, ya email confirm nahi hai
```

---

## Clean SQL chahte ho? (optional, but recommended)

Bina variables wali simple version — seedha values daal do:

```sql
-- Shiv Transport Pvt Ltd onboard
with new_company as (
  insert into public.companies (name, slug, status)
  values ('Shiv Transport Pvt Ltd', 'shiv', 'draft')
  returning id
), new_settings as (
  insert into public.company_settings (company_id, public_portal_enabled, theme)
  select id, false, '{"primary":"#0b2545"}'::jsonb from new_company
  returning company_id
), new_location as (
  insert into public.locations (company_id, name, region, emergency_number)
  select id, 'Head Office', 'Bihar', '+91-9000000000' from new_company
  returning company_id
), new_user as (
  insert into public.users (company_id, auth_user_id, display_name, designation)
  select nc.id, au.id, 'Shiv Admin', 'Company Admin'
  from new_company nc
  join auth.users au on au.email = 'admin@shiv.com'
  returning id, company_id
)
insert into public.company_admins (company_id, user_id, username)
select company_id, id, 'shiv01' from new_user;
```

> Ye chhota hai par **idempotent nahi** — dobara chalane par slug duplicate error dega.
> Ek hi baar chalane ke liye theek hai.

---

## Uske baad kya?

1. **Login test:** `/company-admin/login` → `shiv01` + password
   (abhi `COMPANY_PORTAL_SLUG` env var us company par set hona chahiye — ek deployment = ek company)
2. **Branding bharo:** `company_settings` me `logo_url`, `about`, `services`, `address`, `email`, `mobile`
3. **Content daalo:** `life_saving_rules`, `alerts`, `circulars`, `travel` nahi — `training`, `documents`, `events`
   (publish flags: `is_published` / `status='published'` / `is_public=true`)
4. **Live karo (last step):**
   ```sql
   update public.companies set status = 'active' where slug = 'shiv';
   update public.company_settings set public_portal_enabled = true
   where company_id = (select id from public.companies where slug = 'shiv');
   ```

---

## Galtiyan jo aksar hoti hain

| Galti | Kya hota hai | Fix |
|---|---|---|
| `auth.users` me SQL se insert kiya | Password kaam nahi karega, login fail | Auth UI se user banao |
| Auto Confirm tick nahi kiya | `resolve_company_admin_login` khaali row deta hai → "Unable to sign in" | User confirm karo |
| Sirf `companies` me row daali | Company hai par login nahi, portal nahi | 5 rows chahiye (§ upar) |
| Slug me capital/underscore/dot | `companies_slug_check` error | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `company_settings` nahi banayi | RPC `get_public_portal` company ko hi nahi dhundega (JOIN settings par hai) | Step 2 zaroori hai |
| `status='active'` kar diya bina content | Khaali portal public ho jayega | Publish sabse last me |
| Username me capital | `company_admins_username_check` error | lowercase only |

---

## Ek important limitation (aaj ki sachchai)

Ye process **SQL chala sakne wale ke liye** hai — 5 minute ka kaam. Par:

- **Koi "Add Company" button nahi hai** admin console me
- **Ek deployment = ek company** (`COMPANY_PORTAL_SLUG`), isliye nayi company onboard karne par
  login page bhi badalna padega (env var + redeploy)
- **20 companies** ek saath chalane ke liye pehle **host-based routing** chahiye
  (`shiv.safex.cc.us` → `shiv`), phir `COMPANY_PORTAL_SLUG` ki zaroorat hi nahi rahegi

Yani: **aaj manual SQL se onboarding hoti hai, product nahi.** Proper solution ke liye
`/api/onboarding` route (service role + audit log) + host routing chahiye.
