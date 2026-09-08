# Task API

A small CRUD API for managing a to-do list, built with Node.js + Express, backed
by a real Postgres database running in Docker.

## What this is

Five core endpoints (Create, Read, Update, Delete) over a `tasks` table, plus a
couple of optional extras (filtering, search, stats, reset). The API is exactly
the same one from the original in-memory version — only the storage layer
changed, twice now (SQLite, then Postgres).

## Running the whole stack

```bash
cp .env.example .env   # only needed the first time
docker compose up
```

That starts Postgres (with a named volume, so data survives container
restarts) and the app together. The app waits for Postgres to report healthy
before it starts. Once it's up:

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/docs`
- Postgres is also published on `localhost:5432` if you want to connect a
  GUI client directly.

Stop everything with `docker compose down`. Add `-v` to also delete the
volume (wipes the data) — leave it off to keep your tasks around.

### Running the app outside Docker (optional)

You can still run just the app with `npm start` against the containerized
Postgres, as long as `docker compose up db` is running and `.env` points
`DATABASE_URL` at `localhost:5432` (that's what `.env.example` already has).

## Endpoints

| Method | Path          | Description                              | Success | Errors        |
|--------|---------------|-------------------------------------------|---------|---------------|
| GET    | `/`           | API description                          | 200     | —             |
| GET    | `/health`     | Health check                             | 200     | —             |
| GET    | `/tasks`      | List all tasks (supports `?done=`, `?search=`, `?limit=`, `?offset=`) | 200 | — |
| GET    | `/tasks/:id`  | Get one task                             | 200     | 404           |
| POST   | `/tasks`      | Create a task (`{ "title": "..." }`)     | 201     | 400           |
| PUT    | `/tasks/:id`  | Update `title` and/or `done`             | 200     | 400, 404      |
| DELETE | `/tasks/:id`  | Delete a task                            | 204     | 404           |
| GET    | `/stats`      | `{ total, done, open }` counts (extra)   | 200     | —             |
| POST   | `/reset`      | Restore the 3 seed tasks (extra)         | 200     | —             |

## Example

```
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40
ETag: W/"28-PpSBYV7i68cXyGc7AhjVpkZkY5Q"
Date: Tue, 08 Sep 2026 02:36:44 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Buy milk","done":false}
```

## Swagger UI

![Swagger UI screenshot](docs-screenshot.png)

Screenshot of `/docs` after running "Try it out" on `POST /tasks`: the request
body, generated curl command, request URL, and the live `201 Created` response
from the running server.

## Containerizing the stack (Week 3)

The database moved again: SQLite → Postgres, running as its own container
instead of a file next to the code.

- **Postgres in Docker:** `docker-compose.yml` runs `postgres:16-alpine` with
  a named volume (`pgdata`) mounted at Postgres's data directory, so the
  volume — not the container — is what actually holds the data. Deleting or
  recreating the container leaves the volume, and the data, alone.
- **Schema:** `db/init.sql` creates the `tasks` table and seeds the 3 example
  rows. Postgres only runs files in `docker-entrypoint-initdb.d/` the first
  time it starts against an empty volume, which is exactly the "insert seed
  rows once" behavior this needs.
- **Connection string:** the app reads `DATABASE_URL` from `.env` (via
  `dotenv`). `.env` is gitignored; `.env.example` is committed so anyone
  cloning the repo knows what to fill in. Inside `docker compose`, the app
  container talks to Postgres by service name (`db`); running the app
  directly on your machine, it's `localhost` instead — `.env.example` has
  both cases covered.
- **The repository swap, honestly:** the SQLite version (Week 2) had SQL
  written directly inside the route handlers — there was no separate
  storage layer to swap. This week introduces one:
  [`repositories/postgresRepository.js`](repositories/postgresRepository.js)
  is now the *only* file that knows SQL exists. `server.js` calls
  `repository.listTasks()`, `repository.createTask()`, etc. and never sees a
  query. That means the promise "swapping storage only changes one file"
  is true starting from this commit, not before it — the routes changed
  *this* time because the abstraction didn't exist yet, but a future swap
  (back to SQLite, to an in-memory store for tests, whatever) would only
  touch the repository file.

### Proving persistence across a restart

1. `docker compose up`
2. Create a couple of tasks: `curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Survive a restart"}'`
3. `docker compose down` (without `-v`, so the volume stays)
4. `docker compose up` again
5. `curl http://localhost:3000/tasks` — the task created in step 2 is still there.

<!-- Fill in with your actual output once you run the steps above. -->

## AI vs me (Stage 7, optional)

I had Claude Code split my `server.js` into stage commits and push the repo,
instead of doing it by hand.

**What it did well:** it actually rebuilt the file stage by stage instead of
faking the history, and diffed the result against my original to make sure
nothing drifted. When I asked it to double check the requirements, it caught
that my README still had a made-up curl example and a "replace this
screenshot" placeholder — it ran the server for real and grabbed an actual
`201` response and a real Swagger screenshot instead of leaving those in.

**What it decided on its own:** the exact stage boundaries (it went off the
`// ---------- Stage N` comments already in my code), the repo name, and
commit message wording — none of which I told it. Nothing risky, just stuff
I hadn't specified.

**What my prompt left out:** how granular "stage-sized" should be, and
whether `/stats` and `/reset` deserved their own stage. It made reasonable
calls, but a more specific prompt would've gotten a more predictable result.
