# Osgood OS v0.6 Calendar & Event Operations

## New features

- Shared monthly calendar
- Weddings, private events, corporate events, tours, holds, maintenance, and other events
- Linked client records
- Event start and end times
- Guest counts
- Space assignments
- Assigned staff
- Vendor, setup, teardown, and internal notes
- Operational checklist
- Event timeline
- Calendar events imported from current client records
- Dashboard now shows upcoming calendar events

## Required migration

Run this file in Supabase SQL Editor before deploying:

`supabase/migrations/004_calendar_event_operations.sql`

It creates:

- `events`
- `event_checklist`
- `event_timeline`
- Row Level Security policies
- Realtime for events
- Calendar records for existing dated clients
- Standard operating checklists

## Deploy

After the migration succeeds:

1. Replace your local GitHub Desktop repository files with this release.
2. Commit.
3. Push origin.
4. Vercel deploys automatically.

Suggested commit:

`Add calendar and event operations`
