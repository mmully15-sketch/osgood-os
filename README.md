# Osgood OS v0.8 Operations Dashboard

This is a changed-files-only update for the development branch.

## New home screen

- Today's events
- Tomorrow's events
- Tasks due today
- Overdue tasks
- Upcoming event readiness
- Open walkthroughs
- Unconfirmed vendors
- Event-day staff assignments
- Quote value and open quote count
- Active leads
- Recent activity

## Database

No new Supabase migration is required. This dashboard uses tables already created by migrations 002 through 005.

## Apply this update

Copy only these files into the existing local repository:

- `app/app/page.tsx`
- `app/globals.css`
- `README.md`

Commit to the `development` branch.

Suggested commit:

`Add operations command center dashboard`
