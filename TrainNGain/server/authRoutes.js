const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// This should be in your environment variables in production
const JWT_SECRET = 'your_secret_key_change_this_in_production';
const TOKEN_EXPIRY = '7d'; // Token expires in 7 days

// Setup authentication routes
function setupAuthRoutes(server, db) {
  // Store the original request listener
  const originalListener = server.listeners('request')[0];
  
  // Remove all existing listeners
  server.removeAllListeners('request');
  
  // Add a new listener that handles auth routes first, then passes to the original listener
  server.on('request', (req, res) => {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }
    
    // Handle registration
    if (req.url === '/api/auth/register' && req.method === 'POST') {
      console.log('Register route hit');
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { email, password, username } = JSON.parse(body);
          console.log('Registration request received for:', email);
          
          // Input validation
          if (!email || !password || !username) {
            res.writeHead(400);
            return res.end(JSON.stringify({ message: 'All fields are required' }));
          }
          
          // Check if user already exists
          db.get("SELECT id FROM balances WHERE email = ?", [email], async (err, row) => {
            if (err) {
              console.error('Database error:', err.message);
              res.writeHead(500);
              return res.end(JSON.stringify({ message: 'Database error' }));
            }
            
            if (row) {
              res.writeHead(409);
              return res.end(JSON.stringify({ message: 'User already exists' }));
            }
            
            try {
              // Hash password
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash(password, salt);
              
              // Generate a unique ID for the user
              const userId = 'user_' + Date.now();
              
              // Insert new user - Fix the column order to match your database schema
              // Original schema from server.js: id, balance, email, username, bio, password
              db.run(
                "INSERT INTO balances (id, balance, email, username, bio, password) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, 1000, email, username, '', hashedPassword],
                function(err) {
                  if (err) {
                    console.error('Database error detail:', err.message);
                    res.writeHead(500);
                    return res.end(JSON.stringify({ message: 'Failed to create user' }));
                  }
                  
                  // Generate JWT token
                  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
                  
                  console.log('User registered successfully:', username);
                  res.writeHead(201);
                  res.end(JSON.stringify({
                    message: 'User registered successfully',
                    token,
                    user: {
                      id: userId,
                      email,
                      username
                    }
                  }));
                }
              );
            } catch (error) {
              console.error('Error hashing password:', error);
              res.writeHead(500);
              res.end(JSON.stringify({ message: 'Server error' }));
            }
          });
        } catch (error) {
          console.error('Invalid JSON format:', error);
          res.writeHead(400);
          res.end(JSON.stringify({ message: 'Invalid JSON format' }));
        }
      });
      return; // Important to return here to not pass to originalListener
    }
    
    // Handle login
    else if (req.url === '/api/auth/login' && req.method === 'POST') {
      console.log('Login route hit');
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { email, password } = JSON.parse(body);
          console.log('Login attempt for:', email);
          
          // Input validation
          if (!email || !password) {
            res.writeHead(400);
            return res.end(JSON.stringify({ message: 'Email and password are required' }));
          }
          
          // Find user by email
          db.get("SELECT id, email, username, password FROM balances WHERE email = ?", [email], async (err, user) => {
            if (err) {
              console.error('Database error:', err.message);
              res.writeHead(500);
              return res.end(JSON.stringify({ message: 'Database error' }));
            }
            
            if (!user) {
              res.writeHead(401);
              return res.end(JSON.stringify({ message: 'Invalid credentials' }));
            }
            
            try {
              // Compare passwords
              const isMatch = await bcrypt.compare(password, user.password);
              
              if (!isMatch) {
                res.writeHead(401);
                return res.end(JSON.stringify({ message: 'Invalid credentials' }));
              }
              
              // Generate JWT token
              const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
              
              console.log('Login successful for:', email);
              res.writeHead(200);
              res.end(JSON.stringify({
                message: 'Login successful',
                token,
                user: {
                  id: user.id,
                  email: user.email,
                  username: user.username
                }
              }));
            } catch (error) {
              console.error('Error comparing passwords:', error);
              res.writeHead(500);
              res.end(JSON.stringify({ message: 'Server error' }));
            }
          });
        } catch (error) {
          console.error('Invalid JSON format:', error);
          res.writeHead(400);
          res.end(JSON.stringify({ message: 'Invalid JSON format' }));
        }
      });
      return; // Important to return here to not pass to originalListener
    }
    
    // For all other routes, use the original listener
    originalListener(req, res);
  });
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  // Get auth header
  const authHeader = req.headers['authorization'];
  
  // Check if token exists
  if (!authHeader) {
    res.writeHead(401);
    return res.end(JSON.stringify({ message: 'Access denied. No token provided.' }));
  }
  
  // Format should be "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.writeHead(401);
    return res.end(JSON.stringify({ message: 'Invalid token format' }));
  }
  
  const token = parts[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.writeHead(401);
    res.end(JSON.stringify({ message: 'Invalid token' }));
  }
}

module.exports = { setupAuthRoutes, verifyToken };