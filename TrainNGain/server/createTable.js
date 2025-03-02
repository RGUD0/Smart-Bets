const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// Create and open an SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to open the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize database after connection
    initializeDatabase();
  }
});

// Initialize database schema and seed data
function initializeDatabase() {
  // Use serialize to ensure operations happen in sequence
  db.serialize(() => {
    // Create the balances table with all required fields
    db.run(`CREATE TABLE IF NOT EXISTS balances (
      id TEXT PRIMARY KEY,
      balance INTEGER,
      email TEXT,
      username TEXT,
      bio TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating balances table:', err.message);
      } else {
        console.log('Balances table created or already exists');
        
        // Insert initial data with all fields
        db.run(`INSERT OR REPLACE INTO balances (id, balance, email, username, bio) 
                VALUES (?, ?, ?, ?, ?)`, 
                ['user1', 100, 'user1@gmail.com', 'John Doe', 'Hi there! I love building apps with React Native and exploring new technologies.'], 
                (err) => {
                  if (err) console.error('Error inserting user1:', err.message);
                  else console.log('User1 data inserted or updated');
                });
        
        db.run(`INSERT OR REPLACE INTO balances (id, balance, email, username, bio) 
                VALUES (?, ?, ?, ?, ?)`, 
                ['user2', 200, 'user2@gmail.com', 'Jane Smith', 'Hello there! I love building apps with React Native and exploring new technologies.'], 
                (err) => {
                  if (err) console.error('Error inserting user2:', err.message);
                  else console.log('User2 data inserted or updated');
                });
      }
    });
  });
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Content-Type', 'application/json');

  // Get Balance Request
  if (req.url === '/api/balance' && req.method === 'GET') {
    const userId = 'user1'; // Example: You can replace this with a dynamic value

    db.get("SELECT balance FROM balances WHERE id = ?", [userId], (err, row) => {
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
  } 
  else if (req.url === '/api/user/profile' && req.method === 'GET') {
    const userId = 'user1'; // Example: You can replace this with a dynamic value
  
    db.get("SELECT id, username, email, bio, balance FROM balances WHERE id = ?", [userId], (err, row) => {
      if (err) {
        console.error('Database error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ message: 'Database error' }));
      } else if (row) {
        res.writeHead(200);
        res.end(JSON.stringify({ user: row }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'User not found' }));
      }
    });
  }
  else if (req.url === '/api/update-balance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { amount, userId } = JSON.parse(body);
        if (typeof amount === 'number') {
          db.run("UPDATE balances SET balance = balance + ? WHERE id = ?", [amount, userId], function (err) {
            if (err) {
              console.error('Database error:', err.message);
              res.writeHead(500);
              res.end(JSON.stringify({ message: 'Database error' }));
            } else if (this.changes > 0) {
              res.writeHead(200);
              res.end(JSON.stringify({ balance: amount }));
            } else {
              res.writeHead(404);
              res.end(JSON.stringify({ message: 'User not found' }));
            }
          });
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ message: 'Invalid amount' }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid JSON format' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});