const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const { setupAuthRoutes, verifyToken } = require('./authRoutes');
const bcrypt = require('bcryptjs');

// Create and open an SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to open the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Initialize database schema and seed data
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      user_id TEXT PRIMARY KEY,
      balance INTEGER,
      email TEXT UNIQUE,
      username TEXT,
      password TEXT,
      bio TEXT
    )`, (err) => {
      if (err) console.error('Error creating Users table:', err.message);
    });

    // Friends table
    db.run(`CREATE TABLE IF NOT EXISTS Friends (
      user_id TEXT,
      friend_id TEXT,
      PRIMARY KEY (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES Users(user_id),
      FOREIGN KEY (friend_id) REFERENCES Users(user_id)
    )`, (err) => {
      if (err) console.error('Error creating Friends table:', err.message);
    });

    // Favorite Friends table
    db.run(`CREATE TABLE IF NOT EXISTS FavoriteFriends (
      user_id TEXT,
      favorite_friend_id TEXT,
      PRIMARY KEY (user_id, favorite_friend_id),
      FOREIGN KEY (user_id) REFERENCES Users(user_id),
      FOREIGN KEY (favorite_friend_id) REFERENCES Users(user_id)
    )`, (err) => {
      if (err) console.error('Error creating FavoriteFriends table:', err.message);
    });

    // Pending Bets table
    db.run(`CREATE TABLE IF NOT EXISTS PendingBets (
      bet_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      amount REAL NOT NULL,
      bet_details TEXT,
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )`, (err) => {
      if (err) console.error('Error creating PendingBets table:', err.message);
    });

    // Finished Bets table
    db.run(`CREATE TABLE IF NOT EXISTS FinishedBets (
      bet_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      amount REAL NOT NULL,
      bet_details TEXT,
      outcome TEXT,
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )`, (err) => {
      if (err) console.error('Error creating FinishedBets table:', err.message);
    });

    console.log('All tables created or already exist.');

    // Seed test users
    db.get("SELECT COUNT(*) as count FROM Users", [], (err, row) => {
      if (err) {
        console.error('Error checking users:', err.message);
      } else if (row.count === 0) {
        console.log('Adding test users');
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            console.error('Error generating salt:', err.message);
            return;
          }
          bcrypt.hash('password123', salt, (err, hash) => {
            if (err) {
              console.error('Error hashing password:', err.message);
              return;
            }
            db.run(`INSERT INTO Users (user_id, balance, email, username, password, bio) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    ['user1', 100, 'user1@gmail.com', 'John Doe', hash, 'Hi there!'],
                    (err) => {
                      if (err) console.error('Error inserting user1:', err.message);
                    });
            db.run(`INSERT INTO Users (user_id, balance, email, username, password, bio) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    ['user2', 200, 'user2@gmail.com', 'Jane Smith', hash, 'Hello there!'],
                    (err) => {
                      if (err) console.error('Error inserting user2:', err.message);
                    });
          });
        });
      }
    });
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.url === '/api/balance' && req.method === 'GET') {
    verifyToken(req, res, () => {
      const userId = req.user.id;
      db.get("SELECT balance FROM Users WHERE user_id = ?", [userId], (err, row) => {
        if (err) {
          console.error('Database error:', err.message);
          res.writeHead(500);
          res.end(JSON.stringify({ message: 'Database error' }));
        } else if (row) {
          res.writeHead(200);
          res.end(JSON.stringify({ balance: row.balance }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ message: 'User not found' }));
        }
      });
    });
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
