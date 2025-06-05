const express = require('express');
const path = require('path');
const db = require('./db');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Сессии
app.use(session({
  secret: 'my_secret_key', // замените на свой секрет в реальном проекте
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Раздача статических файлов
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/my-web-app', express.static(path.join(__dirname, 'my-web-app')));
app.use(express.static(path.join(__dirname, 'my-web-app')));

// Добавление комментария
app.post('/api/comments', (req, res) => {
  const { cardId, comment } = req.body;
  db.run(
    'INSERT INTO comments (cardId, comment) VALUES (?, ?)',
    [cardId, comment],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при сохранении комментария' });
      }
      res.status(201).json({ message: 'Комментарий сохранён', comment: { id: this.lastID, cardId, comment } });
    }
  );
});

// Удаление комментария
app.delete('/api/comments/:id', (req, res) => {
  db.run(
    'DELETE FROM comments WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при удалении комментария' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }
      res.json({ message: 'Комментарий удалён' });
    }
  );
});

// Получить все комментарии
app.get('/api/comments', (req, res) => {
  db.all('SELECT * FROM comments', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при получении комментариев' });
    }
    res.json(rows);
  });
});

// Получить комментарии по cardId
app.get('/api/comments/:cardId', (req, res) => {
  db.all('SELECT * FROM comments WHERE cardId = ?', [req.params.cardId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при получении комментариев' });
    }
    res.json(rows);
  });
});

// Редактирование комментария (только для admin)
app.put('/api/comments/:id', (req, res) => {
  if (!req.session.user || req.session.user.username !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const { comment } = req.body;
  db.run(
    'UPDATE comments SET comment = ? WHERE id = ?',
    [comment, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при редактировании комментария' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }
      res.json({ message: 'Комментарий обновлён' });
    }
  );
});

// Регистрация пользователя
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }
  // Проверка на уникальность имени пользователя в БД
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    if (row) {
      return res.status(409).json({ error: 'Пользователь уже существует' });
    }
    // Вставка нового пользователя
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при регистрации' });
      }
      res.status(201).json({ message: 'Пользователь зарегистрирован' });
    });
  });
});

// Вход пользователя
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
    req.session.user = { username };
    res.status(200).json({ message: 'Вход выполнен', username });
  });
});

// Проверка авторизации
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: 'Не авторизован' });
  }
});

// Выход
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Выход выполнен' });
  });
});

// Остальные маршруты (страницы проекта)
app.get('/comment.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'comment.html'));
});
app.get('/friends.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'friends.html'));
});
app.get('/news.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'news.html'));
});
app.get('/messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'messages.html'));
});
app.get('/notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'notifications.html'));
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-web-app', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-web-app', 'register.html'));
});

// Пример middleware для проверки админа
function requireAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Только для администратора' });
  }
}

// Пример использования:
// app.put('/comments/:id', requireAdmin, (req, res) => { ... });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});