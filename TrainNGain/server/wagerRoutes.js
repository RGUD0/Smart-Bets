const { verifyToken } = require('./authRoutes');

// Setup wager routes
function setupWagerRoutes(server, db) {
  // Initialize wagers table if it doesn't exist
  initializeWagersTable(db);

  // Store the original request listener
  const originalListener = server.listeners('request')[0];
  
  // Remove all existing listeners
  server.removeAllListeners('request');
  
  // Add a new listener that handles wager routes, then passes to the original listener
  server.on('request', (req, res) => {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }
    
    // Create a new wager
    if (req.url === '/api/wagers/create' && req.method === 'POST') {
      const applyAuth = (req, res) => {
        verifyToken(req, res, () => {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { receiver_id, wager_description, wager_amount, expiration_time } = JSON.parse(body);
              const creator_id = req.user.id;
              
              // Input validation
              if (!receiver_id || !wager_description || !wager_amount || !expiration_time) {
                res.writeHead(400);
                return res.end(JSON.stringify({ message: 'All fields are required' }));
              }
              
              // Check if creator has enough balance
              db.get("SELECT balance FROM balances WHERE id = ?", [creator_id], (err, row) => {
                if (err) {
                  console.error('Database error:', err.message);
                  res.writeHead(500);
                  return res.end(JSON.stringify({ message: 'Database error' }));
                }
                
                if (!row) {
                  res.writeHead(404);
                  return res.end(JSON.stringify({ message: 'User not found' }));
                }
                
                if (row.balance < wager_amount) {
                  res.writeHead(400);
                  return res.end(JSON.stringify({ message: 'Insufficient balance' }));
                }
                
                // Generate a unique ID for the wager
                const wager_id = 'wager_' + Date.now();
                const save_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const status = 'pending';
                
                // Insert new wager
                db.run(
                  "INSERT INTO wagers (wager_id, creator_id, receiver_id, wager_description, wager_amount, expiration_time, save_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  [wager_id, creator_id, receiver_id, wager_description, wager_amount, expiration_time, save_time, status],
                  function(err) {
                    if (err) {
                      console.error('Database error:', err.message);
                      res.writeHead(500);
                      return res.end(JSON.stringify({ message: 'Failed to create wager' }));
                    }
                    
                    // Reserve the amount from creator's balance
                    db.run("UPDATE balances SET balance = balance - ? WHERE id = ?", [wager_amount, creator_id], function(err) {
                      if (err) {
                        console.error('Database error:', err.message);
                        res.writeHead(500);
                        return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                      }
                      
                      res.writeHead(201);
                      res.end(JSON.stringify({
                        message: 'Wager created successfully',
                        wager: {
                          wager_id,
                          creator_id,
                          receiver_id,
                          wager_description,
                          wager_amount,
                          expiration_time,
                          save_time,
                          status
                        }
                      }));
                    });
                  }
                );
              });
            } catch (error) {
              console.error('Invalid JSON format:', error);
              res.writeHead(400);
              res.end(JSON.stringify({ message: 'Invalid JSON format' }));
            }
          });
        });
      };
      
      applyAuth(req, res);
      return;
    }
    
    // Get wagers for a user (both sent and received)
    else if (req.url === '/api/wagers' && req.method === 'GET') {
      const applyAuth = (req, res) => {
        verifyToken(req, res, () => {
          const userId = req.user.id;
          
          db.all(
            "SELECT * FROM wagers WHERE creator_id = ? OR receiver_id = ? ORDER BY save_time DESC",
            [userId, userId],
            (err, rows) => {
              if (err) {
                console.error('Database error:', err.message);
                res.writeHead(500);
                return res.end(JSON.stringify({ message: 'Database error' }));
              }
              
              res.writeHead(200);
              res.end(JSON.stringify({ wagers: rows }));
            }
          );
        });
      };
      
      applyAuth(req, res);
      return;
    }
    
    // Get pending wagers for a user (both sent and received)
    else if (req.url === '/api/wagers/pending' && req.method === 'GET') {
      const applyAuth = (req, res) => {
        verifyToken(req, res, () => {
          const userId = req.user.id;
          
          db.all(
            `SELECT w.wager_id, 
                   w.creator_id, 
                   c.username as creator_username, 
                   w.receiver_id, 
                   r.username as receiver_username,
                   w.wager_description,
                   w.wager_amount,
                   w.expiration_time,
                   w.save_time,
                   w.status
             FROM wagers w
             JOIN balances c ON w.creator_id = c.id
             JOIN balances r ON w.receiver_id = r.id
             WHERE (w.creator_id = ? OR w.receiver_id = ?) 
             AND w.status = 'pending' 
             ORDER BY w.save_time DESC`,
            [userId, userId],
            (err, rows) => {
              if (err) {
                console.error('Database error:', err.message);
                res.writeHead(500);
                return res.end(JSON.stringify({ message: 'Database error' }));
              }
              
              res.writeHead(200);
              res.end(JSON.stringify({ wagers: rows }));
            }
          );
        });
      };
      
      applyAuth(req, res);
      return;
    }
    
    // Update wager status (accept/reject)
    else if (req.url === '/api/wagers/respond' && req.method === 'PUT') {
      const applyAuth = (req, res) => {
        verifyToken(req, res, () => {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { wager_id, action } = JSON.parse(body);
              const userId = req.user.id;
              
              // Input validation
              if (!wager_id || !action || (action !== 'accept' && action !== 'reject')) {
                res.writeHead(400);
                return res.end(JSON.stringify({ message: 'Invalid parameters' }));
              }
              
              // Check if wager exists and user is the receiver
              db.get(
                "SELECT * FROM wagers WHERE wager_id = ? AND receiver_id = ? AND status = 'pending'",
                [wager_id, userId],
                (err, wager) => {
                  if (err) {
                    console.error('Database error:', err.message);
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Database error' }));
                  }
                  
                  if (!wager) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ message: 'Wager not found or not pending' }));
                  }
                  
                  if (action === 'accept') {
                    // Check if receiver has enough balance
                    db.get("SELECT balance FROM balances WHERE id = ?", [userId], (err, row) => {
                      if (err) {
                        console.error('Database error:', err.message);
                        res.writeHead(500);
                        return res.end(JSON.stringify({ message: 'Database error' }));
                      }
                      
                      if (row.balance < wager.wager_amount) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ message: 'Insufficient balance' }));
                      }
                      
                      // Update wager status and reserve the amount from receiver's balance
                      db.run(
                        "UPDATE wagers SET status = 'active' WHERE wager_id = ?",
                        [wager_id],
                        function(err) {
                          if (err) {
                            console.error('Database error:', err.message);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                          }
                          
                          // Reserve the amount from receiver's balance
                          db.run(
                            "UPDATE balances SET balance = balance - ? WHERE id = ?",
                            [wager.wager_amount, userId],
                            function(err) {
                              if (err) {
                                console.error('Database error:', err.message);
                                res.writeHead(500);
                                return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                              }
                              
                              res.writeHead(200);
                              res.end(JSON.stringify({ message: 'Wager accepted' }));
                            }
                          );
                        }
                      );
                    });
                  } else if (action === 'reject') {
                    // Update wager status and return the amount to creator's balance
                    db.run(
                      "UPDATE wagers SET status = 'rejected' WHERE wager_id = ?",
                      [wager_id],
                      function(err) {
                        if (err) {
                          console.error('Database error:', err.message);
                          res.writeHead(500);
                          return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                        }
                        
                        // Return the amount to creator's balance
                        db.run(
                          "UPDATE balances SET balance = balance + ? WHERE id = ?",
                          [wager.wager_amount, wager.creator_id],
                          function(err) {
                            if (err) {
                              console.error('Database error:', err.message);
                              res.writeHead(500);
                              return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                            }
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({ message: 'Wager rejected' }));
                          }
                        );
                      }
                    );
                  }
                }
              );
            } catch (error) {
              console.error('Invalid JSON format:', error);
              res.writeHead(400);
              res.end(JSON.stringify({ message: 'Invalid JSON format' }));
            }
          });
        });
      };
      
      applyAuth(req, res);
      return;
    }
    
    // Resolve wager
    else if (req.url === '/api/wagers/resolve' && req.method === 'PUT') {
      const applyAuth = (req, res) => {
        verifyToken(req, res, () => {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { wager_id, winner_id } = JSON.parse(body);
              const userId = req.user.id;
              
              // Input validation
              if (!wager_id || !winner_id) {
                res.writeHead(400);
                return res.end(JSON.stringify({ message: 'Invalid parameters' }));
              }
              
              // Check if wager exists and user is the creator
              db.get(
                "SELECT * FROM wagers WHERE wager_id = ? AND creator_id = ? AND status = 'active'",
                [wager_id, userId],
                (err, wager) => {
                  if (err) {
                    console.error('Database error:', err.message);
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Database error' }));
                  }
                  
                  if (!wager) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ message: 'Wager not found or not active' }));
                  }
                  
                  // Check if winner_id is either creator or receiver
                  if (winner_id !== wager.creator_id && winner_id !== wager.receiver_id) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ message: 'Invalid winner ID' }));
                  }
                  
                  // Update wager status
                  db.run(
                    "UPDATE wagers SET status = 'completed', winner_id = ? WHERE wager_id = ?",
                    [winner_id, wager_id],
                    function(err) {
                      if (err) {
                        console.error('Database error:', err.message);
                        res.writeHead(500);
                        return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                      }
                      
                      // Calculate total amount (double the wager amount since both users contributed)
                      const totalAmount = wager.wager_amount * 2;
                      
                      // Award the amount to the winner
                      db.run(
                        "UPDATE balances SET balance = balance + ? WHERE id = ?",
                        [totalAmount, winner_id],
                        function(err) {
                          if (err) {
                            console.error('Database error:', err.message);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                          }
                          
                          res.writeHead(200);
                          res.end(JSON.stringify({ 
                            message: 'Wager resolved',
                            winner: winner_id,
                            amount: totalAmount
                          }));
                        }
                      );
                    }
                  );
                }
              );
            } catch (error) {
              console.error('Invalid JSON format:', error);
              res.writeHead(400);
              res.end(JSON.stringify({ message: 'Invalid JSON format' }));
            }
          });
        });
      };
      
      applyAuth(req, res);
      return;
    }
    
    // For all other routes, use the original listener
    originalListener(req, res);
  });
}

// Initialize the wagers table
function initializeWagersTable(db) {
  db.run(`CREATE TABLE IF NOT EXISTS wagers (
    wager_id TEXT PRIMARY KEY,
    creator_id TEXT,
    receiver_id TEXT,
    wager_description TEXT,
    wager_amount INTEGER,
    expiration_time TEXT,
    save_time TEXT,
    status TEXT,
    winner_id TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating wagers table:', err.message);
    } else {
      console.log('Wagers table created or already exists');
    }
  });
}

module.exports = { setupWagerRoutes };