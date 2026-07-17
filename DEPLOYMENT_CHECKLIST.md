# Osgood OS v1.0.0 Deployment Checklist

1. Confirm the current branch is `development`.
2. Back up Supabase or confirm Point-in-Time Recovery/database backups are available.
3. Run `supabase/migrations/008_operations_center_tasks.sql` in Supabase SQL Editor.
4. Commit the release files to `development`.
5. Push origin and wait for the Vercel preview deployment.
6. Test login and Dashboard.
7. Open Operations and create a test task.
8. Verify an owner and due date are required.
9. Test In Progress, Blocked, Complete, and Reopen actions.
10. Confirm the Building Accountability dashboard card updates.
11. Verify Calendar, Clients, Quotes, Payments, and Floor Plans still open.
12. Merge to `main` only after preview verification.
