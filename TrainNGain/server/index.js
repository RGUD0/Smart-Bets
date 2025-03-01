const http = require('http');

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from the React app
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Content-Type', 'application/json');

  // Handle API requests
  if (req.url === '/api' && req.method === 'GET') {
    res.writeHead(200); // HTTP status code 200 (OK)
    res.end(JSON.stringify({ message: 'Hello from the backend!' }));
  } else {
    res.writeHead(404); // HTTP status code 404 (Not Found)
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

// Start the server
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});