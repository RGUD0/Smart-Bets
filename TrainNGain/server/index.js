const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// Create and open an SQLite database (it will create a file `database.db` if it doesn't exist)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to open the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create the 'balances' table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS balances (
  id TEXT PRIMARY KEY,
  balance INTEGER
)`);

// Insert initial data (you can remove this after you populate the DB with real data)
const initData = () => {
  const stmt = db.prepare("INSERT OR IGNORE INTO balances (id, balance) VALUES (?, ?)");
  stmt.run('user1', 100);
  stmt.run('user2', 200);
  stmt.finalize();
};

initData();

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Content-Type', 'application/json');

  // Get Balance Request
  if (req.url === '/api/balance' && req.method === 'GET') {
    const userId = 'user1'; // Example: You can replace this with a dynamic value from request (e.g., query params)

    db.get("SELECT balance FROM balances WHERE id = ?", [userId], (err, row) => {
      if (err) {
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

  } else if (req.url === '/api/update-balance' && req.method === 'POST') {
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
