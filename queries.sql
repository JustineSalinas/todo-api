-- Stage 4: manual SQL exploration against tasks.db
-- Run these in DB Browser for SQLite (or any SQLite client) with the app stopped
-- or running — SQLite handles both, and the API reflects changes immediately.

-- List every task
SELECT * FROM tasks;

-- Show only completed tasks
SELECT * FROM tasks WHERE done = 1;

-- Count all tasks
SELECT COUNT(*) FROM tasks;

-- Mark every task as completed
UPDATE tasks SET done = 1;

-- Delete all completed tasks
DELETE FROM tasks WHERE done = 1;
