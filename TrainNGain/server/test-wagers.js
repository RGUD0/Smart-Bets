const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001';
let user1Token = '';
let user2Token = '';
let createdWagerId = '';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return await response.json();
}

// Run all tests in sequence
async function runTests() {
  try {
    console.log('Starting wager API tests...');
    
    // Login as user1
    console.log('\n--- Logging in as user1 ---');
    const user1Login = await apiRequest('/api/auth/login', 'POST', null, {
      email: 'user1@gmail.com',
      password: 'password123'
    });
    user1Token = user1Login.token;
    console.log('User1 logged in:', user1Login.user);
    
    // Login as user2
    console.log('\n--- Logging in as user2 ---');
    const user2Login = await apiRequest('/api/auth/login', 'POST', null, {
      email: 'user2@gmail.com',
      password: 'password123'
    });
    user2Token = user2Login.token;
    console.log('User2 logged in:', user2Login.user);
    
    // Check initial balances
    console.log('\n--- Checking initial balances ---');
    const user1Balance = await apiRequest('/api/balance', 'GET', user1Token);
    console.log('User1 initial balance:', user1Balance);
    
    const user2Balance = await apiRequest('/api/balance', 'GET', user2Token);
    console.log('User2 initial balance:', user2Balance);
    
    // Create a wager
    console.log('\n--- Creating a wager ---');
    const createWager = await apiRequest('/api/wagers/create', 'POST', user1Token, {
      receiver_id: 'user2',
      wager_description: 'Test wager from script',
      wager_amount: 50,
      expiration_time: '2025-03-10 12:00:00'
    });
    console.log('Wager created:', createWager);
    createdWagerId = createWager.wager.wager_id;
    
    // Check user1 balance after wager creation
    console.log('\n--- Checking user1 balance after wager creation ---');
    const user1BalanceAfterCreate = await apiRequest('/api/balance', 'GET', user1Token);
    console.log('User1 balance after creating wager:', user1BalanceAfterCreate);
    
    // Get all wagers for user1
    console.log('\n--- Getting all wagers for user1 ---');
    const user1Wagers = await apiRequest('/api/wagers', 'GET', user1Token);
    console.log('User1 wagers:', user1Wagers);
    
    // Get all wagers for user2
    console.log('\n--- Getting all wagers for user2 ---');
    const user2Wagers = await apiRequest('/api/wagers', 'GET', user2Token);
    console.log('User2 wagers:', user2Wagers);
    
    // User2 accepts the wager
    console.log('\n--- User2 accepting the wager ---');
    const acceptWager = await apiRequest('/api/wagers/respond', 'PUT', user2Token, {
      wager_id: createdWagerId,
      action: 'accept'
    });
    console.log('Wager acceptance response:', acceptWager);
    
    // Check user2 balance after accepting wager
    console.log('\n--- Checking user2 balance after accepting wager ---');
    const user2BalanceAfterAccept = await apiRequest('/api/balance', 'GET', user2Token);
    console.log('User2 balance after accepting wager:', user2BalanceAfterAccept);
    
    // Get wagers after acceptance
    console.log('\n--- Getting wagers after acceptance ---');
    const wagersAfterAccept = await apiRequest('/api/wagers', 'GET', user1Token);
    console.log('Wagers after acceptance:', wagersAfterAccept);
    
    // User1 resolves the wager (user2 wins)
    console.log('\n--- Resolving the wager (user2 wins) ---');
    const resolveWager = await apiRequest('/api/wagers/resolve', 'PUT', user1Token, {
      wager_id: createdWagerId,
      winner_id: 'user2'
    });
    console.log('Wager resolution response:', resolveWager);
    
    // Check final balances
    console.log('\n--- Checking final balances ---');
    const user1FinalBalance = await apiRequest('/api/balance', 'GET', user1Token);
    console.log('User1 final balance:', user1FinalBalance);
    
    const user2FinalBalance = await apiRequest('/api/balance', 'GET', user2Token);
    console.log('User2 final balance:', user2FinalBalance);
    
    // Get final wager status
    console.log('\n--- Getting final wager status ---');
    const finalWagers = await apiRequest('/api/wagers', 'GET', user1Token);
    console.log('Final wagers:', finalWagers);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
