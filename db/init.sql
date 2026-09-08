-- Runs automatically the first time the Postgres container starts with an
-- empty data volume (docker-entrypoint-initdb.d convention). The WHERE NOT
-- EXISTS guard also makes it safe to re-run by hand.

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO tasks (title, done)
SELECT * FROM (VALUES
  ('Buy milk', false),
  ('Write README', false),
  ('Ship the API', true)
) AS seed(title, done)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
