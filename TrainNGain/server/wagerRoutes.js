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
                if (!res.headersSent) {
                  res.writeHead(400);
                  return res.end(JSON.stringify({ message: 'All fields are required' }));
                }
                return;
              }
              
              // Check if creator has enough balance
              db.get("SELECT balance FROM balances WHERE id = ?", [creator_id], (err, row) => {
                if (err) {
                  console.error('Database error:', err.message);
                  if (!res.headersSent) {
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Database error' }));
                  }
                  return;
                }
                
                if (!row) {
                  if (!res.headersSent) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ message: 'User not found' }));
                  }
                  return;
                }
                
                if (row.balance < wager_amount) {
                  if (!res.headersSent) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ message: 'Insufficient balance' }));
                  }
                  return;
                }
                
                // Generate a unique ID for the wager
                const wager_id = 'wager_' + Date.now();
                const save_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const status = 'incoming';
                
                // Insert new wager
                db.run(
                  "INSERT INTO wagers (wager_id, creator_id, receiver_id, wager_description, wager_amount, expiration_time, save_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  [wager_id, creator_id, receiver_id, wager_description, wager_amount, expiration_time, save_time, status],
                  function(err) {
                    if (err) {
                      console.error('Database error:', err.message);
                      if (!res.headersSent) {
                        res.writeHead(500);
                        return res.end(JSON.stringify({ message: 'Failed to create wager' }));
                      }
                      return;
                    }
                    
                    // Send response only once
                    if (!res.headersSent) {
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
                    }
                    
                    // Reserve the amount from creator's balance is commented out
                    // db.run("UPDATE balances SET balance = balance - ? WHERE id = ?", [wager_amount, creator_id], function(err) {
                    //   if (err) {
                    //     console.error('Database error:', err.message);
                    //     // Don't send response here since we already sent it above
                    //   }
                    // });
                  }
                );
              });
            } catch (error) {
              console.error('Invalid JSON format:', error);
              if (!res.headersSent) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON format' }));
              }
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
            const currentTime = new Date().getTime();
            
            // First, update any expired wagers
            db.run(
              "UPDATE wagers SET status = 'expired' WHERE expiration_time < ? AND status != 'expired' AND status != 'completed'",
              [currentTime],
              (updateErr) => {
                if (updateErr) {
                  console.error('Database error updating expired wagers:', updateErr.message);
                  if (!res.headersSent) {
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Database error updating expired wagers' }));
                  }
                  return;
                }
                
                // Now fetch all wagers for the user (with potentially updated statuses)
                db.all(
                  "SELECT * FROM wagers WHERE creator_id = ? OR receiver_id = ? ORDER BY save_time DESC",
                  [userId, userId],
                  (err, rows) => {
                    if (err) {
                      console.error('Database error:', err.message);
                      if (!res.headersSent) {
                        res.writeHead(500);
                        return res.end(JSON.stringify({ message: 'Database error' }));
                      }
                      return;
                    }
                    
                    if (!res.headersSent) {
                      res.writeHead(200);
                      res.end(JSON.stringify({ wagers: rows }));
                    }
                  }
                );
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
            const currentTime = new Date(); // Current time as Date object
            console.log('currentTime:', currentTime.toString());

            
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
               AND  w.status IN ('pending','approved')
               ORDER BY w.save_time DESC`,
              [userId, userId],
              (err, rows) => {
                if (err) {
                  console.error('Database error:', err.message);
                  if (!res.headersSent) {
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Database error' }));
                  }
                  return;
                }
                
                // Check for expired wagers and update them in the database
                const updatePromises = [];
                const updatedRows = rows.map(row => {
                  // Create a copy of the row
                  const updatedRow = {...row};
                  
                  // Check if the wager is expired
                  // Convert the expiration_time string to a Date object
                  if (row.expiration_time) {
                    const expirationDate = new Date(row.expiration_time);
                    console.log('expirationDate:', expirationDate.toString());
                    console.log('expiration_time raw:', row.expiration_time);

                    
                    if (expirationDate < currentTime && row.status === 'pending') {
                      // Update the row in memory
                      updatedRow.status = 'approval';
                      
                      // Log for debugging
                      console.log(`Wager ${row.wager_id} expired: ${row.expiration_time} < ${currentTime}`);
                      
                      // Create a promise to update the database
                      const updatePromise = new Promise((resolve, reject) => {
                        db.run(
                          "UPDATE wagers SET status = 'expired' WHERE wager_id = ?",
                          [row.wager_id],
                          (updateErr) => {
                            if (updateErr) {
                              console.error('Failed to update wager status:', updateErr.message);
                              reject(updateErr);
                            } else {
                              console.log(`Successfully marked wager ${row.wager_id} as expired in DB`);
                              resolve();
                            }
                          }
                        );
                      });
                      
                      updatePromises.push(updatePromise);
                    }
                  }
                  
                  return updatedRow;
                });
                
                // Filter out wagers that are now expired
                const pendingWagers = updatedRows.filter(row => row.status === 'pending');
                
                // Wait for all updates to complete, then send the response
                Promise.all(updatePromises)
                  .then(() => {
                    if (!res.headersSent) {
                      res.writeHead(200);
                      res.end(JSON.stringify({ wagers: pendingWagers }));
                    }
                  })
                  .catch(updateErr => {
                    console.error('Error updating expired wagers:', updateErr);
                    // Still send the response with the pending wagers
                    if (!res.headersSent) {
                      res.writeHead(200);
                      res.end(JSON.stringify({ wagers: pendingWagers }));
                    }
                  });
              }
            );
          });
        };
        
        applyAuth(req, res);
        return;
      }
    
    // Get incoming wagers for a user (wagers where user is the receiver)
    else if (req.url === '/api/wagers/incoming' && req.method === 'GET') {
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
             WHERE w.receiver_id = ? 
             AND w.status = 'incoming' 
             ORDER BY w.save_time DESC`,
            [userId],
            (err, rows) => {
              if (err) {
                console.error('Database error:', err.message);
                if (!res.headersSent) {
                  res.writeHead(500);
                  return res.end(JSON.stringify({ message: 'Database error' }));
                }
                return;
              }
              
              if (!res.headersSent) {
                res.writeHead(200);
                res.end(JSON.stringify({ wagers: rows }));
              }
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
                if (!res.headersSent) {
                  res.writeHead(400);
                  return res.end(JSON.stringify({ message: 'Invalid parameters' }));
                }
                return;
              }
              
              // Check if wager exists and user is the receiver
              db.get(
                "SELECT * FROM wagers WHERE wager_id = ? AND receiver_id = ? AND status = 'incoming'",
                [wager_id, userId],
                (err, wager) => {
                  if (err) {
                    console.error('Database error:', err.message);
                    if (!res.headersSent) {
                      res.writeHead(500);
                      return res.end(JSON.stringify({ message: 'Database error' }));
                    }
                    return;
                  }
                  
                  if (!wager) {
                    if (!res.headersSent) {
                      res.writeHead(404);
                      return res.end(JSON.stringify({ message: 'Wager not found or not pending' }));
                    }
                    return;
                  }
                  
                  if (action === 'accept') {
                    // Check if receiver has enough balance
                    db.get("SELECT balance FROM balances WHERE id = ?", [userId], (err, row) => {
                      if (err) {
                        console.error('Database error:', err.message);
                        if (!res.headersSent) {
                          res.writeHead(500);
                          return res.end(JSON.stringify({ message: 'Database error' }));
                        }
                        return;
                      }
                      
                      if (row.balance < wager.wager_amount) {
                        if (!res.headersSent) {
                          res.writeHead(400);
                          return res.end(JSON.stringify({ message: 'Insufficient balance' }));
                        }
                        return;
                      }
                      
                      // Update wager status
                      db.run(
                        "UPDATE wagers SET status = 'pending' WHERE wager_id = ?",
                        [wager_id],
                        function(err) {
                          if (err) {
                            console.error('Database error:', err.message);
                            if (!res.headersSent) {
                              res.writeHead(500);
                              return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                            }
                            return;
                          }
                          
                          // Send response now instead of in commented code
                          if (!res.headersSent) {
                            res.writeHead(200);
                            res.end(JSON.stringify({ message: 'Wager accepted' }));
                          }
                          
                          // Reserve the amount from receiver's balance is commented out
                          // db.run(
                          //   "UPDATE balances SET balance = balance - ? WHERE id = ?",
                          //   [wager.wager_amount, userId],
                          //   function(err) {
                          //     if (err) {
                          //       console.error('Database error:', err.message);
                          //       // Don't send response here as we've already sent it above
                          //     }
                          //   }
                          // );
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
                          if (!res.headersSent) {
                            res.writeHead(500);
                            return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                          }
                          return;
                        }
                        
                        // Return the amount to creator's balance
                        db.run(
                          "UPDATE balances SET balance = balance + ? WHERE id = ?",
                          [wager.wager_amount, wager.creator_id],
                          function(err) {
                            if (err) {
                              console.error('Database error:', err.message);
                              if (!res.headersSent) {
                                res.writeHead(500);
                                return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                              }
                              return;
                            }
                            
                            if (!res.headersSent) {
                              res.writeHead(200);
                              res.end(JSON.stringify({ message: 'Wager rejected' }));
                            }
                          }
                        );
                      }
                    );
                  }
                }
              );
            } catch (error) {
              console.error('Invalid JSON format:', error);
              if (!res.headersSent) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON format' }));
              }
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
                if (!res.headersSent) {
                  res.writeHead(400);
                  return res.end(JSON.stringify({ message: 'Invalid parameters' }));
                }
                return;
              }
              
              // Check if wager exists and user is the creator
              db.get(
                "SELECT * FROM wagers WHERE wager_id = ? AND creator_id = ? AND status = 'active'",
                [wager_id, userId],
                (err, wager) => {
                  if (err) {
                    console.error('Database error:', err.message);
                    if (!res.headersSent) {
                      res.writeHead(500);
                      return res.end(JSON.stringify({ message: 'Database error' }));
                    }
                    return;
                  }
                  
                  if (!wager) {
                    if (!res.headersSent) {
                      res.writeHead(404);
                      return res.end(JSON.stringify({ message: 'Wager not found or not active' }));
                    }
                    return;
                  }
                  
                  // Check if winner_id is either creator or receiver
                  if (winner_id !== wager.creator_id && winner_id !== wager.receiver_id) {
                    if (!res.headersSent) {
                      res.writeHead(400);
                      return res.end(JSON.stringify({ message: 'Invalid winner ID' }));
                    }
                    return;
                  }
                  
                  // Update wager status without adding winner_id field
                  db.run(
                    "UPDATE wagers SET status = 'completed' WHERE wager_id = ?",
                    [wager_id],
                    function(err) {
                      if (err) {
                        console.error('Database error:', err.message);
                        if (!res.headersSent) {
                          res.writeHead(500);
                          return res.end(JSON.stringify({ message: 'Failed to update wager' }));
                        }
                        return;
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
                            if (!res.headersSent) {
                              res.writeHead(500);
                              return res.end(JSON.stringify({ message: 'Failed to update balance' }));
                            }
                            return;
                          }
                          
                          if (!res.headersSent) {
                            res.writeHead(200);
                            res.end(JSON.stringify({ 
                              message: 'Wager resolved',
                              winner: winner_id,
                              amount: totalAmount
                            }));
                          }
                        }
                      );
                    }
                  );
                }
              );
            } catch (error) {
              console.error('Invalid JSON format:', error);
              if (!res.headersSent) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON format' }));
              }
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
    status TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating wagers table:', err.message);
    } else {
      console.log('Wagers table created or already exists');
    }
  });
}

module.exports = { setupWagerRoutes };