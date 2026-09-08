const Database = require("better-sqlite3");

const db = new Database("tasks.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) {
  const seed = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  seed.run("Buy milk", 0);
  seed.run("Write README", 0);
  seed.run("Ship the API", 1);
}

module.exports = db;
