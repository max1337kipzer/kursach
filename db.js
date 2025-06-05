const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cardId TEXT,
      comment TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      isAdmin INTEGER DEFAULT 0
    )
  `);

  // Создать пользователя admin, если его нет
  db.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`,
        ['admin', 'admin', 1]
      );
    }
  });
});

module.exports = db;