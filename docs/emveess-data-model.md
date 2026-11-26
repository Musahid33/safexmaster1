# Emveess — Database Data Model (kya banega, kya ban nahi sakta)

**Source:** live Supabase DB (`nwvycctdcopegkluywfc`) ka actual schema, 25 Nov 2026.
Har "✅ hai" live se verified hai. Har "❌ missing" ka SQL maine transaction me chala kar
test kiya hai (rollback ke saath).

---

## 1. Aapki list vs aaj ka database — ek nazar me

| Aapne maanga | Aaj DB me | Status |
|---|---|---|
| **Company Name** | `companies.name` | ✅ hai |
| **Company Code** | — | ❌ **nahi hai** (sirf `slug` hai, jo URL ke liye hai) |
| **Company ID** | `companies.id` (uuid, auto) | ✅ hai |
| **Company Logo** | `company_settings.logo_url` (sirf column) | 🟡 column hai, **storage bucket nahi**, aur **code isko padhta hi nahi** |
| **Company Location (1 ya multiple)** | `locations` — ek company ke **kitne bhi** | ✅ hai |
| **Location Code** | — | ❌ **nahi hai** (sirf `name`, `region`) |
| **Location ID** | `locations.id` | ✅ hai |
| **Employee: Name** | `users.display_name` | ✅ hai |
| **Employee: Emp ID** | `users.employee_code` | ✅ hai |
| **Employee: Mobile** | — | ❌ **nahi hai** (sabse badi gap — see §4) |
| **Employee: Blood group** | — | ❌ nahi hai |
| **Employee: Address** | — | ❌ nahi hai |
| **Employee: Email** | — | ❌ nahi hai |
| **Employee: Grade** | — | ❌ nahi hai |
| **Employee: Skill category** | — | ❌ nahi hai (designation ke liye `designation` hai) |
| **Employee: Designation** | `users.designation` | ✅ hai |
| **Employee ka Reward** | `rewards.recipient_user_id` | ✅ hai |
| **Safety Alert** | `alerts` | 🟡 table hai, **par UI ke fields missing** (root cause, actions, lessons) |
| **Circular & Notice** | `circulars` | 🟡 table hai, `kind` se dono cover ho jayenge |
| **Events** | `events` | ✅ hai |
| **Training** | `training` + `training_assignments` | ✅ structure hai |
| **Documents / Vault** | `documents` (`category`, `is_public`) | ✅ hai |
| **Life Saving Rules** | `life_saving_rules` | ✅ hai |
| **Reports (Near Miss etc.)** | `reports` | 🟡 hai, par **type mismatch** (below §5) |

**Sabse pehle ye samajh lo:** aapki list ka **company/location/content hissa ready hai**,
**employee master hissa sabse kamzor hai** — aur wahi aapke Employee Passport UI ka base hai.

---

## 2. Emveess ke liye DB me kya banega (complete picture)

```
companies (1 row)
  id            uuid   ← "Company ID" (auto)
  name          text   ← "Emveess"
  slug          text   ← "emveess"  (URL ke liye, unique)
  status        draft | active | suspended | archived
  ❌ code       text   ← "Company Code" — ADD KARNA HOGA

  └── company_settings (1 row)
        logo_url              ❌ abhi khaali + bucket nahi
        about, services, address, email, mobile
        theme                 jsonb  {"primary":"#0b2545","accent":"#f7b32b"}
        public_portal_enabled bool   ← publish switch
        anonymous_allowed     bool

  ├── locations (1..N rows — jitne site chahiye)
  │     id              uuid   ← "Location ID"
  │     name            text   ← "West Bokaro (WBD)"
  │     region          text
  │     emergency_number text  ← SOS button isi se
  │     active          bool
  │     last_injury_date date  ← "Days Without Injury" isi se
  │     ❌ code         text   ← "Location Code" — ADD KARNA HOGA
  │
  ├── departments (0..N)
  │     name, location_id
  │
  ├── users (employee master — 1..N rows)
  │     id              uuid   ← internal
  │     employee_code   text   ← "Emp ID" ✅
  │     display_name    text   ← "Name" ✅
  │     designation     text   ✅
  │     location_id, department_id, active, is_public
  │     ❌ mobile, email, blood_group, address, grade, skill_category
  │     ❌ date_of_birth, joined_on, photo_url, emergency_contact
  │     ❌ auth_user_id  ← sirf admin ke paas hota hai, employees ke liye nahi chahiye
  │
  ├── company_admins (1..N)
  │     company_id + user_id + username ← admin login
  │
  ├── alerts (Safety Alert)
  │     title, body, severity, is_published ✅
  │     ❌ category, area, root_cause, immediate_actions[],
  │       corrective_actions[], lessons_learned[], attachment_path, occurred_at
  │       ← UI ye sab dikhata hai, isliye add karne padenge
  │
  ├── circulars (Circular + Notice + Update — sab ek table)
  │     title, body, kind, is_published ✅
  │     ❌ attachment_path, published_at
  │
  ├── events
  │     title, description, starts_at, ends_at, status ✅
  │
  ├── training
  │     title, content_type, storage_path, status ✅
  │     └── training_assignments : user_id + status(completed) + completed_at ✅
  │           → hero ka "Training count" aur passport ka Training card
  │
  ├── documents (Document Vault)
  │     title, category, storage_path, status, is_public, version ✅
  │
  ├── rewards (Rewards & Recognition)
  │     title, description, recipient_user_id → users.id ✅
  │
  ├── life_saving_rules
  │     rule_no, title, body, is_active ✅  (company-level, per-site nahi)
  │
  ├── gallery_items (photos)
  │     title, storage_path, is_published ✅
  │
  ├── reports (Near Miss / Hazard / Observation / Suggestion / Grievance)
  │     type, category, description, severity, status,
  │     anonymous, reporter_name/phone/email, is_public ✅
  │     ⚠️ type snake_case rakhna (see §5)
  │
  ├── notifications
  │     recipient_user_id, title, body, read_at ✅
  │
  ├── contact_messages
  │     name, email, phone, message, status ✅
  │
  ├── audit_logs
  │     actor_auth_user_id, action, target_type/id, details jsonb ✅
  │
  ├── plans / subscriptions
  │     company ka plan + validity ✅ (aaj khaali)
  │
  ├── modules / company_modules
  │     feature on/off per company (training, library, rewards…) ✅
  │
  └── roles / permissions / role_permissions / user_roles
        RBAC ka structure hai ✅, par **policies nahi** (kaam nahi karta abhi)
```

**Ginti:** ek Emveess onboard karne par minimum **5 rows** (company + settings + location +
admin user + admin assignment). Poora data bharne par **15–20 tables** me rows hongi.

---

## 3. Kya "ban jayega" vs kya "banana padega"

### ✅ Aaj hi ready (sirf rows daalni hain)
`companies`, `company_settings`, `locations`, `departments`, `alerts`, `circulars`, `events`,
`training`, `training_assignments`, `documents`, `rewards`, `life_saving_rules`,
`gallery_items`, `reports`, `notifications`, `contact_messages`, `audit_logs`,
`plans`/`subscriptions`, `modules`/`company_modules`, `roles`/`user_roles`.

### ❌ Schema change chahiye (SQL migration)
Company code, Location code, **employee master ke 9 fields**, **alerts ke 8 fields**,
circulars ke 2 fields. Neeche copy-paste SQL hai.

### 🔴 Sirf schema se nahi hoga — extra kaam chahiye
| Cheez | Kyun |
|---|---|
| **Logo upload** | `storage.buckets` khaali hai — pehle `company-logos` bucket banao |
| **Employee master bulk import** | CSV import tool/script nahi hai (roster `.gitignore` me blocked hai — sahi hai) |
| **Employee Passport ka OTP unlock** | `privateAccess` gateway ki implementation hi nahi hai |
| **Document/training file upload** | storage bucket nahi |
| **Reports DB se aaye** | `REPORT_SENDER = null`, ingestion route nahi |
| **Roles/permissions kaam kare** | `roles`/`permissions`/`user_roles` par koi RLS policy nahi |

---

## 4. Sabse badi gap — Employee Master (aapki list ka 6/10 missing)

Aapne maanga:

| Field | Aaj | Note |
|---|---|---|
| Name | ✅ `display_name` | |
| Emp ID | ✅ `employee_code` | company ke andar unique |
| Mobile no | ❌ | **Passport ka OTP isi par jaata hai** — iske bina locked cards kabhi nahi khulenge |
| Blood group | ❌ | UI me "withheld from public search" likha hai — matlab DB me hona chahiye |
| Address | ❌ | same |
| Email id | ❌ | |
| Grade | ❌ | UI me field ka naam **"Skill Grade"** hai (`employee.skillGrade`) |
| Skill category | ❌ | UI me nahi, par aapne maanga |
| Designation | ✅ `designation` | |
| DOB | ❌ | UI private section me dikhata hai |

**Aur ek design decision:** `users` table me `auth_user_id` hai (Supabase Auth link).
**Employees ke liye ise `null` rakho** — warna har employee ke liye Auth account banega,
jo aap nahi chahte (worker portal bina login chalta hai). Sirf **company admins** ke paas
`auth_user_id` hona chahiye.

---

## 5. ⚠️ Report type mismatch — pehle ye theek karo

Live data already snake_case me hai, par repo ki RPC Title Case dhundti hai:

```sql
-- Live reports table me aaj:
hazard(7), near_miss(18), observation(46), suggestion(5)   ← snake_case

-- Repo ka get_public_portal() ye count karta hai:
r.type = 'Near Miss'           -- kabhi match nahi karega
r.type = 'Safety Observation'  -- kabhi match nahi karega
```

Iska seedha asar: **hero ke Near Miss / Safety Observation counters hamesha 0**, chahe data ho.

**Canonical convention (recommendation):** DB me **snake_case** rakho, aur UI ke
`ReportType` se mapping ek jagah define karo:

| UI (`ReportType`) | DB (`reports.type`) |
|---|---|
| Near Miss | `near_miss` |
| Hazard | `hazard` |
| Safety Observation | `observation` |
| Unsafe Condition | `unsafe_condition` |
| Unsafe Act | `unsafe_act` |
| Feedback | `feedback` |
| Grievance | `grievance` |
| Suggest/Recommend | `suggestion` |
| Speak Up | `speak_up` |
| Unsafe Behaviour | `unsafe_behaviour` |
| Consequence | `consequence` |

Aur RPC ko in values par count karna chahiye (live `v_public_stats` view already snake_case use karti hai — usi se match karo).

---

## 6. Migration SQL (tested — transaction me chala kar rollback kiya)

Ye ek hi baar chalana hai. **Tested on live DB** (columns sab create hue, test insert pass, phir rollback).

```sql
-- ══ Companies: Company Code ══
alter table public.companies add column code text;
create unique index companies_code_key on public.companies(code) where code is not null;
-- (chahe to CHECK: code = upper(code) aur length 2..20)

-- ══ Locations: Location Code ══
alter table public.locations add column code text;
create unique index locations_company_code_key on public.locations(company_id, code) where code is not null;

-- ══ Employee Master: 10 fields ══
alter table public.users
  add column mobile            text,
  add column email             text,
  add column blood_group       text,
  add column address           text,
  add column grade             text,          -- UI: "Skill Grade"
  add column skill_category    text,          -- aapka "Jntvti Skill category"
  add column date_of_birth     date,
  add column joined_on         date,
  add column photo_url         text,
  add column emergency_contact text;

alter table public.users
  add constraint users_blood_group_check
  check (blood_group is null or blood_group in ('A+','A-','B+','B-','O+','O-','AB+','AB-'));

create unique index users_company_mobile_key on public.users(company_id, mobile) where mobile is not null;
create index users_company_employee_code_idx on public.users(company_id, employee_code);

-- ══ Alerts: UI ke detail fields ══
alter table public.alerts
  add column category           text,
  add column area               text,
  add column root_cause         text,
  add column immediate_actions  text[],
  add column corrective_actions text[],
  add column lessons_learned    text[],
  add column attachment_path    text,
  add column occurred_at        timestamptz;

-- ══ Circulars: attachment + publish time ══
alter table public.circulars
  add column attachment_path text,
  add column published_at    timestamptz;
```

> **PII warning:** `users` table me ab mobile, address, DOB, blood group aayenge.
> Ye table **default-deny** hai (anon/authenticated par koi grant nahi) — aaj theek hai.
> Par jab employee directory ka public lookup banao, tab **sirf allowed fields** ka view/RPC
> do (name, emp code, designation, site) — mobile/address/blood group **kabhi** public na ho.

---

## 7. Emveess ke liye sample insert (poora set)

```sql
-- 1. Company code
update public.companies set code = 'EMV' where slug = 'emveess';

-- 2. Location code
update public.locations set code = 'WBD-01'
where company_id = (select id from public.companies where slug='emveess') and name = 'West Bokaro (WBD)';

-- 3. Employee master (ek sample; bulk ke liye CSV import script chahiye)
insert into public.users
  (company_id, employee_code, display_name, designation, location_id,
   mobile, email, blood_group, address, grade, skill_category, is_public, active)
select
  c.id, 'EMP001', 'Ramesh Kumar', 'Technician', l.id,
  '9876543210', 'ramesh@emveess.com', 'O+', 'Bokaro, Jharkhand', 'A', 'Electrical', false, true
from public.companies c
join public.locations l on l.company_id = c.id and l.name = 'West Bokaro (WBD)'
where c.slug = 'emveess'
on conflict (company_id, employee_code) do nothing;

-- 4. Life saving rule
insert into public.life_saving_rules (company_id, rule_no, title, body)
select id, 1, 'Work at height', 'Harness aur lifeline ke bina 1.8 m se upar kaam mat karo.'
from public.companies where slug='emveess'
on conflict do nothing;

-- 5. Safety alert
insert into public.alerts (company_id, location_id, title, body, severity, category, is_published)
select c.id, l.id, 'Conveyor guard missing', 'Belt conveyor ke drive side par guard nahi tha.',
       'high', 'Mechanical', true
from public.companies c join public.locations l on l.company_id=c.id
where c.slug='emveess' limit 1;

-- 6. Circular / Notice (kind se dono)
insert into public.circulars (company_id, title, body, kind, is_published)
select id, 'Safety Week 2026', 'Safety week 4-10 March.', 'circular', true
from public.companies where slug='emveess';

-- 7. Event
insert into public.events (company_id, location_id, title, description, starts_at, status)
select c.id, l.id, 'Mock Drill', 'Fire evacuation drill.', now() + interval '7 days', 'published'
from public.companies c join public.locations l on l.company_id=c.id
where c.slug='emveess' limit 1;

-- 8. Training + assignment (hero ka count)
insert into public.training (company_id, location_id, title, content_type, status)
select c.id, l.id, 'Working at Height', 'video', 'published'
from public.companies c join public.locations l on l.company_id=c.id
where c.slug='emveess' limit 1;

insert into public.training_assignments (company_id, location_id, training_id, user_id, status, completed_at)
select t.company_id, t.location_id, t.id, u.id, 'completed', now()
from public.training t
join public.users u on u.company_id = t.company_id and u.employee_code='EMP001'
where t.title='Working at Height';

-- 9. Reward (employee ke naam)
insert into public.rewards (company_id, location_id, recipient_user_id, title, description, status)
select u.company_id, u.location_id, u.id, 'Safety Champion', '100% PPE compliance', 'published'
from public.users u where u.employee_code='EMP001';

-- 10. Document
insert into public.documents (company_id, title, category, storage_path, status, is_public)
select id, 'SOP - Confined Space', 'SOP / SWP', 'docs/sop-confined-space.pdf', 'published', true
from public.companies where slug='emveess';
```

---

## 8. Abhi ke liye clear limitations

| Cheez | Status |
|---|---|
| Employee master ka **bulk import** (CSV/Excel) | ❌ tool nahi — SQL/manual hi |
| **Logo upload** | ❌ storage bucket nahi |
| **Document/training/alerts ki files** | ❌ storage bucket nahi (`storage_path` sirf text hai) |
| **Employee passport OTP** | ❌ gateway implement nahi |
| **Reports DB me jaana** | ❌ client sirf IndexedDB me rakhta hai |
| **UI in tables ko padhta hai** | ❌ sirf `get_public_portal` (name + sites) — baaki sab hardcoded empty |
| **Roles/permissions enforce** | ❌ policies nahi |

Yani: **schema tayyar kar sakte ho (aaj), par data UI me dikhane ke liye code wiring baaki hai.**

---

## 9. Recommended order

1. **§6 migration chalao** (company code, location code, employee 10 fields, alert 8 fields)
2. **Report type convention fix karo** (§5) — warna counters 0 rahenge
3. **Storage buckets banao:** `company-logos` (public read), `documents`, `alerts` (private)
4. **Emveess ka master data bharo** (locations → employees → rules)
5. **Phir content** (alerts, circulars, events, training, documents, rewards)
6. **Code wiring** (alag kaam): RPC v2 + employee directory API + content APIs
7. **Publish** (`status='active'` + `public_portal_enabled=true`) — sabse last
