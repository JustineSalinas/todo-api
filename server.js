require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const repository = require("./repositories/postgresRepository");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Wrap async route handlers so a rejected promise reaches Express's error
// handling instead of crashing the process.
function asyncRoute(handler) {
  return (req, res, next) => handler(req, res, next).catch(next);
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
app.get(
  "/tasks",
  asyncRoute(async (req, res) => {
    const tasks = await repository.listTasks(req.query);
    res.json(tasks);
  })
);

app.get(
  "/tasks/:id",
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    const task = await repository.getTask(id);
    if (!task) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }
    res.json(task);
  })
);

// ---------- Stage 3: Create ----------
app.post(
  "/tasks",
  asyncRoute(async (req, res) => {
    const { title } = req.body || {};

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }

    const newTask = await repository.createTask(title.trim());
    res.status(201).json(newTask);
  })
);

// ---------- Stage 4: Update & Delete ----------
app.put(
  "/tasks/:id",
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
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

    const updated = await repository.updateTask(id, {
      title: title !== undefined ? title.trim() : undefined,
      done,
    });
    if (!updated) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }
    res.json(updated);
  })
);

app.delete(
  "/tasks/:id",
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await repository.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }
    res.status(204).send();
  })
);

// ---------- Extras ----------
app.get(
  "/stats",
  asyncRoute(async (req, res) => {
    res.json(await repository.getStats());
  })
);

app.post(
  "/reset",
  asyncRoute(async (req, res) => {
    const tasks = await repository.resetTasks();
    res.json({ status: "reset", tasks });
  })
);

// ---------- Stage 5: Swagger UI ----------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ---------- Error handling ----------
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
