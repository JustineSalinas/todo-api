const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const db = require("./db"); // creates tasks.db, the tasks table, and seeds it on first run

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// SQLite stores booleans as 0/1; convert on the way out.
function toApiTask(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

// ---------- Stage 1: root & health ----------
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id", "/health", "/stats", "/reset"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- Stage 2: Read ----------
app.get("/tasks", (req, res) => {
  let sql = "SELECT * FROM tasks WHERE 1 = 1";
  const params = [];

  // extra: filter by done=true/false
  if (req.query.done !== undefined) {
    sql += " AND done = ?";
    params.push(req.query.done === "true" ? 1 : 0);
  }

  // extra: search by title substring
  if (req.query.search) {
    sql += " AND title LIKE ?";
    params.push(`%${req.query.search}%`);
  }

  sql += " ORDER BY id";

  // extra: pagination
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    const offset = parseInt(req.query.offset) || 0;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : -1;
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
  }

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(toApiTask));
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.json(toApiTask(task));
});

// ---------- Stage 3: Create ----------
app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }

  const info = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, 0)")
    .run(title.trim());
  const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(toApiTask(newTask));
});

// ---------- Stage 4: Update & Delete ----------
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "provide at least one of: title, done" });
  }
  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "done must be true or false" });
  }

  const newTitle = title !== undefined ? title.trim() : task.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : task.done;
  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, id);

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(toApiTask(updated));
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.status(204).send();
});

// ---------- Extras ----------
app.get("/stats", (req, res) => {
  // extra: counts via SQL COUNT() instead of counting in JS
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM tasks").get();
  const { done } = db.prepare("SELECT COUNT(*) AS done FROM tasks WHERE done = 1").get();
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  db.prepare("DELETE FROM tasks").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name = 'tasks'").run();
  const seed = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  seed.run("Buy milk", 0);
  seed.run("Write README", 0);
  seed.run("Ship the API", 1);

  const rows = db.prepare("SELECT * FROM tasks ORDER BY id").all();
  res.json({ status: "reset", tasks: rows.map(toApiTask) });
});

// ---------- Stage 5: Swagger UI ----------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ---------- Fallback for bad JSON bodies ----------
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid JSON body" });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
