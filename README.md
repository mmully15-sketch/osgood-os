# Osgood OS

Osgood OS is the internal sales, event, proposal, payment, floor-planning, and building-operations platform for The Osgood Wedding & Events.

## Version

`1.0.0`

## Local development

```bash
npm install
npm run dev
```

## Operations Center setup

Run the following migration once in Supabase SQL Editor:

```text
supabase/migrations/008_operations_center_tasks.sql
```

## Deployment

The project is designed for GitHub + Vercel deployment. Use the `development` branch for preview testing and merge to `main` after validation.
