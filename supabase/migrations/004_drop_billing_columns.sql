-- Portfolio simplification. Apply this by hand in the Supabase SQL editor.
-- The app does not read or write these columns, so it keeps working before this runs.
-- handle_new_user only inserts auth_id, email, and name, so new Google sign-ins
-- still succeed after the columns are gone.

alter table public.practices drop column if exists subscription_status;
alter table public.practices drop column if exists trial_start_date;
alter table public.practices drop column if exists trial_end_date;
alter table public.practices drop column if exists polar_customer_id;
alter table public.practices drop column if exists polar_subscription_id;
alter table public.practices drop column if exists current_period_end;
alter table public.practices drop column if exists daily_upload_count;
alter table public.practices drop column if exists daily_upload_reset_date;
