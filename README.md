# Task API

A small in-memory CRUD API for managing a to-do list, built with Node.js + Express.

## What this is

Five core endpoints (Create, Read, Update, Delete) over an in-memory list of tasks,
plus a couple of optional extras (filtering, search, stats, reset). Data lives only
in memory — restarting the server resets it to the seed tasks.

## How to run it

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`. Swagger UI (interactive docs) is at
`http://localhost:3000/docs`.

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

## The mortality experiment

Restarting the server resets `tasks` back to the 3 seed items — anything created,
updated, or deleted during the previous run is gone. That's because the data lives
only in a JavaScript array in the process's memory, not on disk or in a database.
This is exactly why Week 3 introduces persistent storage.

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
