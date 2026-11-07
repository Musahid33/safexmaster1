-- Index foreign keys not already covered by the foundation's indexes.
create index audit_logs_actor_auth_user_id_idx on public.audit_logs (actor_auth_user_id);
create index company_modules_module_id_idx on public.company_modules (module_id);
create index departments_company_location_idx on public.departments (company_id, location_id);
create index documents_company_location_idx on public.documents (company_id, location_id);
create index events_company_location_idx on public.events (company_id, location_id);
create index notifications_company_recipient_idx on public.notifications (company_id, recipient_user_id);
create index reports_company_department_idx on public.reports (company_id, department_id);
create index rewards_company_location_idx on public.rewards (company_id, location_id);
create index rewards_company_recipient_idx on public.rewards (company_id, recipient_user_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index training_company_location_idx on public.training (company_id, location_id);
create index user_roles_company_role_idx on public.user_roles (company_id, role_id);
create index users_company_department_idx on public.users (company_id, department_id);
create index users_company_location_idx on public.users (company_id, location_id);
