const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// Create and open an SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to open the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Initialize database after connection
    initializeDatabase(() => {
      // Add sample data after the table is created
      addSampleData();
    });
  }
});

// Function to initialize the database
function initializeDatabase(callback) {
  // SQL statement to create the wager table
  const createWagerTable = `
    CREATE TABLE IF NOT EXISTS Wagers (
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
      // Call the callback function to proceed with adding sample data
      callback();
    }
  }
);

}

// Function to add sample data to the wager table
function addSampleData() {
  // Sample data to insert into the wager table
  const sampleData = [
    {
      wager_id: 'wager001',
      creator_id: 'user1',
      receiver_id: 'user2',
      wager_name: "Win Hackathon",
      wager_amount: 100,
      date: '2023-10-01 12:00:00',
      expiration_time: '2025-02-08 12:00:00',
      save_time: '2023-10-01 12:00:00',
      status: 'pending',
    },
    {
      wager_id: 'wager002',
      creator_id: 'user_1740880015421',
      receiver_id: 'user_1740880092950',
      wager_name: "Do the Dishes",
      wager_amount: 200,
      date: '2023-10-02 14:30:00',
      expiration_time: '2023-10-09 14:30:00',
      save_time: '2023-10-02 14:30:00',
      status: 'accepted',
    },
    {
      wager_id: 'wager003',
      creator_id: 'user_1740880092950',
      receiver_id: 'user2',
      wager_name: "Get a 95 on my Computer Science Exam",
      wager_amount: 150,
      date: '2023-10-03 10:15:00',
      expiration_time: '2023-10-10 10:15:00',
      save_time: '2023-10-03 10:15:00',
      status: 'completed',
    },
  ];

  // SQL statement to insert data into the wager table
  const insertWager = `
    INSERT INTO Wagers (wager_id, creator_id, receiver_id, wager_amount, date, expiration_time, save_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `;

  // Insert each sample data entry into the table
  sampleData.forEach((data) => {
    db.run(
      insertWager,
      [
        data.wager_id,
        data.creator_id,
        data.receiver_id,
        data.wager_amount,
        data.date,
        data.expiration_time,
        data.save_time,
        data.status,
      ],
      (err) => {
        if (err) {
          console.error('Failed to insert data:', err.message);
        } else {
          console.log(`Inserted wager with ID: ${data.wager_id}`);
        }
      }
    );
  });
}