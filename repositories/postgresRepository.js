// Postgres implementation of the task repository. server.js and its routes
// only ever call the functions exported here — they never see SQL. Swapping
// storage again (SQLite, an in-memory map, whatever) means writing a new
// file with this same shape and changing one require() in server.js.

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function toApiTask(row) {
  return { id: row.id, title: row.title, done: row.done };
}

async function listTasks({ done, search, limit, offset } = {}) {
  let sql = "SELECT * FROM tasks WHERE 1 = 1";
  const params = [];

  if (done !== undefined) {
    params.push(done === "true");
    sql += ` AND done = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND title ILIKE $${params.length}`;
  }

  sql += " ORDER BY id";

  if (limit !== undefined) {
    params.push(parseInt(limit));
    sql += ` LIMIT $${params.length}`;
  }
  if (offset !== undefined) {
    params.push(parseInt(offset) || 0);
    sql += ` OFFSET $${params.length}`;
  }

  const { rows } = await pool.query(sql, params);
  return rows.map(toApiTask);
}

async function getTask(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0] ? toApiTask(rows[0]) : null;
}

async function createTask(title) {
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *",
    [title]
  );
  return toApiTask(rows[0]);
}

async function updateTask(id, { title, done }) {
  const existing = await getTask(id);
  if (!existing) return null;

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? done : existing.done;

  const { rows } = await pool.query(
    "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
    [newTitle, newDone, id]
  );
  return toApiTask(rows[0]);
}

async function deleteTask(id) {
  const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return rowCount > 0;
}

async function getStats() {
  const { rows } = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE done) AS done FROM tasks"
  );
  const total = Number(rows[0].total);
  const done = Number(rows[0].done);
  return { total, done, open: total - done };
}

async function resetTasks() {
  await pool.query("DELETE FROM tasks");
  await pool.query("ALTER SEQUENCE tasks_id_seq RESTART WITH 1");
  await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, false), ($2, false), ($3, true)",
    ["Buy milk", "Write README", "Ship the API"]
  );
  const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
  return rows.map(toApiTask);
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
  resetTasks,
  pool,
};
