const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------- In-memory "database" ----------
let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Write README", done: false },
  { id: 3, title: "Ship the API", done: true },
];
let nextId = 4;

// ---------- Stage 1: root & health ----------
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id", "/health"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- Stage 2: Read ----------
app.get("/tasks", (req, res) => {
  let result = tasks;

  // extra: filter by done=true/false
  if (req.query.done !== undefined) {
    const wantDone = req.query.done === "true";
    result = result.filter((t) => t.done === wantDone);
  }

  // extra: search by title substring
  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(term));
  }

  // extra: pagination
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    const offset = parseInt(req.query.offset) || 0;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : result.length;
    result = result.slice(offset, offset + limit);
  }

  res.json(result);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.json(task);
});

// ---------- Stage 3: Create ----------
app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});
