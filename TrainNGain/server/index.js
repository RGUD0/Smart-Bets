const http = require('http');

let userBalance = 100; // Initialize the balance with a default value

const server = http.createServer((req, res) => {
  // Set CORS headers
  //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Origin', '*'); // DO NOT KEEP IN PRODUCTION DAWG
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle API requests
  if (req.url === '/api/balance' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ balance: userBalance }));
  } else if (req.url === '/api/update-balance' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { amount } = JSON.parse(body);
        if (typeof amount === 'number') {
          userBalance += amount;
          res.writeHead(200);
          res.end(JSON.stringify({ balance: userBalance }));
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
