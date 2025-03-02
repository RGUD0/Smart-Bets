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

// Function to initialize the database
function initializeDatabase() {
  // SQL statement to create the wager table
  const createWagerTable = `
    CREATE TABLE IF NOT EXISTS wager (
      wager_id TEXT PRIMARY KEY,
      creator_id TEXT,
      receiver_id TEXT,
      wager_amount INTEGER,
      date TIMESTAMP,
      expiration_time TIMESTAMP,
      save_time TIMESTAMP,
      status TEXT,
      FOREIGN KEY (creator_id) REFERENCES balances(id),
      FOREIGN KEY (receiver_id) REFERENCES balances(id)
    );
  `;

  // Execute the SQL statement to create the table
  db.run(createWagerTable, (err) => {
    if (err) {
      console.error('Failed to create the wager table:', err.message);
    } else {
      console.log('Wager table created or already exists.');
    }
  });
}