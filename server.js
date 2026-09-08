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

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});
