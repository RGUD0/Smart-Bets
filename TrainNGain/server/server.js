const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const { setupAuthRoutes, verifyToken } = require('./authRoutes');

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
    // Create the balances table with all required fields including password
    db.run(`CREATE TABLE IF NOT EXISTS balances (
      id TEXT PRIMARY KEY,
      balance INTEGER,
      email TEXT UNIQUE,
      username TEXT,
      bio TEXT,
      password TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating balances table:', err.message);
      } else {
        console.log('Balances table created or already exists');
        
        // Check if we need to add test users
        db.get("SELECT COUNT(*) as count FROM balances", [], (err, row) => {
          if (err) {
            console.error('Error checking users:', err.message);
          } else if (row.count === 0) {
            // Only add test users if table is empty
            console.log('Adding test users');
            const bcrypt = require('bcryptjs');
            
            // Hash a default password for test users
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
                
                // Insert test users with hashed passwords
                db.run(`INSERT INTO balances (id, balance, email, username, bio, password) 
                        VALUES (?, ?, ?, ?, ?, ?)`, 
                        ['user1', 100, 'user1@gmail.com', 'John Doe', 'Hi there! I love building apps with React Native and exploring new technologies.', hash], 
                        (err) => {
                          if (err) console.error('Error inserting user1:', err.message);
                          else console.log('User1 data inserted');
                        });
                
                db.run(`INSERT INTO balances (id, balance, email, username, bio, password) 
                        VALUES (?, ?, ?, ?, ?, ?)`, 
                        ['user2', 200, 'user2@gmail.com', 'Jane Smith', 'Hello there! I love building apps with React Native and exploring new technologies.', hash], 
                        (err) => {
                          if (err) console.error('Error inserting user2:', err.message);
                          else console.log('User2 data inserted');
                        });
              });
            });
          }
        });
      }
    });
  });
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Protected route example - Get Balance Request
  if (req.url === '/api/balance' && req.method === 'GET') {
    // This is how you would apply the auth middleware
    const applyAuth = (req, res, next) => {
      verifyToken(req, res, () => {
        const userId = req.user.id; // Get user ID from token

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
      });
    };
    
    // Apply auth middleware
    applyAuth(req, res);
  } 
  else if (req.url === '/api/user/profile' && req.method === 'GET') {
    // Another protected route
    const applyAuth = (req, res, next) => {
      verifyToken(req, res, () => {
        const userId = req.user.id; // Get user ID from token
      
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
      });
    };
    
    // Apply auth middleware
    applyAuth(req, res);
  }
  else if (req.url === '/api/update-balance' && req.method === 'POST') {
    // Protected route
    const applyAuth = (req, res, next) => {
      verifyToken(req, res, () => {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { amount } = JSON.parse(body);
            const userId = req.user.id; // Get user ID from token
            
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
      });
    };
    
    // Apply auth middleware
    applyAuth(req, res);
  }
  
  else if (req.url === '/api/non-friends' && req.method === 'GET') {
    // Protected route
    const applyAuth = (req, res, next) => {
      verifyToken(req, res, () => {
        const userId = req.user.id; // Get user ID from token

        db.all(
          `SELECT
              u.id,
              u.username
           FROM
              balances AS u
           WHERE
              u.id != ?  -- Exclude the target user themselves
              AND u.id NOT IN (
                SELECT f.friend_id FROM Friends AS f WHERE f.user_id = ?
                UNION
                SELECT f.user_id FROM Friends AS f WHERE f.friend_id = ?
              );`,
          [userId, userId, userId], // Correct parameter binding
          (err, rows) => {
            if (err) {
              console.error('Database error:', err.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Database error' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ users: rows })); // Returning the list of users
            }
          }
        );
      });
    };
    
    // Apply auth middleware
    applyAuth(req, res);
  }
  

  else if (req.url === '/api/add-friend' && req.method === 'POST') {
    const applyAuth = (req, res, next) => {
      verifyToken(req, res, () => {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { friendId } = JSON.parse(body);
            const userId = req.user.id; // Get user ID from token
  
            if (friendId) {
              db.run(`INSERT INTO Friends (user_id, friend_id) VALUES (?, ?)`, [userId, friendId], function (err) {
                if (err) {
                  console.error('Database error:', err.message);
                  res.writeHead(500);
                  res.end(JSON.stringify({ message: 'Database error' }));
                } else {
                  res.writeHead(200);
                  res.end(JSON.stringify({ message: 'Friend added successfully' }));
                }
              });
            } else {
              res.writeHead(400);
              res.end(JSON.stringify({ message: 'Invalid friend ID' }));
            }
          } catch (error) {
            console.error('Invalid JSON:', error.message);
            res.writeHead(400);
            res.end(JSON.stringify({ message: 'Invalid JSON format' }));
          }
        });
      });
    };
  
    applyAuth(req, res);
  }
  
  
  
  
  
  else {
    // Let the auth routes handler take care of auth endpoints
    // It will only handle the auth routes and pass through others
    return;
  }
});

// Setup authentication routes
setupAuthRoutes(server, db);

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
