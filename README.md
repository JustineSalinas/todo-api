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

This whole project was built by prompting Claude Code rather than typing the
routes by hand, so this section is a reflection on that process instead of a
diff against a separate `ai-version/`.

**The prompt.** Two prompts, essentially: (1) split an already-written
`server.js` into stage-sized commits matching a course assignment's Stage
0–6 structure, and push it as a new public repo; (2) later, close out the
checklist — verify status codes, error handling, Swagger UI, and README
completeness against the actual running server.

**What the AI did well.** It didn't just re-commit the finished file with
fake history — it rebuilt `server.js` incrementally (routes added in the
same order the stage comments implied) and diffed the final version against
the original byte-for-byte before pushing, so the commit history is real
without the code silently drifting. It also caught that the README had two
placeholders — a curl block that was typed by hand and not actually run, and
a literal "replace this screenshot" note — and refused to leave those as
decorative filler once asked to verify the checklist. Instead it started the
server, ran real requests, and drove the Swagger "Try it out" flow in an
actual browser to capture a genuine 201 response.

**What it got wrong or decided on its own.** The stage boundaries themselves
were inferred from comments already in the code (`// ---------- Stage N`),
not from the original assignment text — a reasonable guess, but a guess. It
also picked commit message wording, the repo name (`todo-api`), and default
visibility/description without asking, since none of those were specified.
Nothing here was destructive, but they're all decisions a stricter prompt
would have pinned down instead of leaving to inference.

**What my prompt forgot to specify.** I never said how granular "stage-sized"
should be, so it made a judgment call — one endpoint group per stage rather
than one route per commit. I also didn't specify a commit message format or
whether the extras (`/stats`, `/reset`) belonged in their own stage or folded
into Stage 6; it chose the latter. If I wanted a specific commit-message
convention or a stricter one-PR-per-route history, I'd need to say so up
front.
