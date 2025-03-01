// Import the sqlite3 library
const sqlite3 = require('sqlite3').verbose();

// Open or create the SQLite database (the file name should be your database file)
const db = new sqlite3.Database('your-database-file.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Database connected.");
  }
});

// Create the 'balances' table if it doesn't already exist
db.serialize(() => {
  // Create the 'balances' table (if it doesn't already exist)
  db.run(`
    CREATE TABLE IF NOT EXISTS balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      balance REAL
    );
  `, function(err) {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Balances table created or already exists.");
    }
  });

  // Insert data into the 'balances' table
  const insertBalance = (userId, balance) => {
    const stmt = db.prepare("INSERT INTO balances (user_id, balance) VALUES (?, ?)");
    stmt.run(userId, balance, function(err) {
      if (err) {
        console.error("Error inserting balance:", err.message);
      } else {
        console.log(`Balance inserted for user_id ${userId} with ID ${this.lastID}`);
      }
    });
    stmt.finalize();
  };

  // Inserting multiple balances as an example
  insertBalance(1, 100.00);
  insertBalance(2, 200.00);
  insertBalance(3, 150.00);
  insertBalance(4, 50.00);
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error("Error closing the database:", err.message);
  } else {
    console.log("Database connection closed.");
  }
});
