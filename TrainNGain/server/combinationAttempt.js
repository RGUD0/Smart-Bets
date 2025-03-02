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
      friend_id TEXT, 
      FOREIGN KEY (user_id) REFERENCES Users(user_id),
      FOREIGN KEY (friend_id) REFERENCES Users(user_id)
    )`, (err) => {
      if (err) console.error('Error creating PendingBets table:', err.message);
    });

    console.log('All tables created or already exist.');
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

  // Balance Endpoint (example)
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

  // Get Friends List Endpoint
  if (req.url === '/api/friends' && req.method === 'GET') {
    verifyToken(req, res, () => {
      const userId = req.user.id;

      db.all("SELECT u.user_id, u.username FROM Users u JOIN Friends f ON u.user_id = f.friend_id WHERE f.user_id = ?", [userId], (err, rows) => {
        if (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ message: 'Database error' }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ friends: rows }));
        }
      });
    });
  }

  // Create Bet Endpoint (POST)
  if (req.url === '/api/create-bet' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      verifyToken(req, res, () => {
        const { friendId, amount, betDetails } = JSON.parse(body);
        const userId = req.user.id;

        // Check if the user is friends with the selected friend
        db.get("SELECT * FROM Friends WHERE user_id = ? AND friend_id = ?", [userId, friendId], (err, row) => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ message: 'Database error' }));
          } else if (!row) {
            // If not friends, return an error message
            res.writeHead(400);
            res.end(JSON.stringify({ message: 'You must be friends with the user to create a bet' }));
          } else {
            // Insert the bet into the PendingBets table
            db.run("INSERT INTO PendingBets (user_id, amount, bet_details, friend_id) VALUES (?, ?, ?, ?)", 
            [userId, amount, betDetails, friendId], (err) => {
              if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ message: 'Error creating bet' }));
              } else {
                res.writeHead(200);
                res.end(JSON.stringify({ message: 'Bet created successfully' }));
              }
            });
          }
        });
      });
    });
  }

});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
