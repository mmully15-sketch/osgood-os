# Osgood OS v0.2

This release is matched to the existing Supabase schema already present in The Osgood project.

## Existing schema used

- `profiles.active`
- `leads.name`, `leads.partner`, `leads.guests`
- Text IDs for `leads`, `quotes`, and `activity_log`
- Existing `tasks` and `activity_log` tables
- Existing quote totals, deposits, balances, and JSON payloads

No destructive ID conversion is required.

## 1. Run the compatibility migration

In Supabase:

1. Open **SQL Editor**.
2. Open `supabase/migrations/002_existing_schema_compatibility.sql`.
3. Copy the entire file.
4. Paste it into a new query.
5. Click **Run** once.

This migration does not drop your tables or records. It configures:

- Updated-at triggers
- Automatic staff profiles
- Active-staff and administrator checks
- Row Level Security policies
- Realtime for leads, quotes, and tasks
- Unique quote numbers

## 2. Create or verify the first administrator

Create your user under **Authentication > Users**, then run:

```sql
update public.profiles
set role='admin', full_name='Mike Mulligan', active=true
where email='YOUR_EMAIL_ADDRESS';
```

Replace the email address.

## 3. Deploy to Vercel

Add:

```text
NEXT_PUBLIC_SUPABASE_URL=https://yawrapctnsmoxbtltoud.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_mYhxVRdOWhoxU_UsfcNQvA_Izc2YCfA
```

Then deploy the GitHub repository through Vercel.

## Important

Do not run `001_initial_schema.sql` against this existing database. It is retained only as the clean-install reference for an empty Supabase project. Use migration `002_existing_schema_compatibility.sql`.
