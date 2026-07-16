# Osgood OS v0.4

This release combines the interface overhaul, the pricing calculator, and the current 2026 client/event schedule.

## New features

- Modern Osgood-branded dashboard and navigation
- Wedding package calculator
- Corporate and private-event pricing calculator
- Add-ons, discounts, deposit, and remaining-balance calculations
- Select an existing client directly in the calculator
- Save shared quotes to Supabase
- Automatically mark selected leads as quoted
- Redesigned dashboard with upcoming events, tasks, and quote value
- Idempotent import of the 20 current events from Schedule 1.xlsm

## Import the current client list

Run this file once in Supabase SQL Editor:

`supabase/migrations/003_import_current_clients.sql`

It uses fixed IDs and `on conflict`, so running it again updates the same records instead of duplicating them.

## Deploy

Replace your local GitHub Desktop repository files with this release, commit, and push.

Suggested commit:

`Add pricing calculator, current events, and new interface`
