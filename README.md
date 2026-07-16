# Osgood OS v0.7 Event Detail Workflow

## New event workflow features

- Workflow stages: Planning, Contracted, Finalizing, Event Ready, Event Day, Completed
- Readiness percentage
- Final guest count
- Primary and emergency contacts
- Floor-plan status
- Event-day role assignments
- Grouped operations checklist
- Checklist due dates, responsible staff, and notes
- Vendor directory with arrival/departure times
- Room setup records
- Timeline management
- Setup, teardown, incident, and internal notes
- Post-event checklist items

## Required migration

Run:

`supabase/migrations/005_event_detail_workflow.sql`

before deploying the updated app.

## Deployment

Replace your local GitHub Desktop repository files with this release, commit, and push.

Suggested commit:

`Expand event workflow and operations checklist`
