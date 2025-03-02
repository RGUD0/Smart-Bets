import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  bio: string;
  balance: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const token = localStorage.getItem('token'); // Retrieve stored token
        const response = await fetch('http://localhost:5001/api/non-friends', {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to request
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } catch (err) {
        setError('Failed to fetch users: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => {
      const username = user.username?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const bio = user.bio?.toLowerCase() || '';
      const query = searchQuery?.toLowerCase() || '';
  
      return username.includes(query) || email.includes(query) || bio.includes(query);
    });
  
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddFriend = async (userId: string) => {
    const token = localStorage.getItem('token');
  
    try {
      const response = await fetch('http://localhost:5001/api/add-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId: userId })
      });
  
      const result = await response.json();
      if (response.ok) {
        alert('Friend added successfully!');
        // Optional: Remove user from list or refresh list
        setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Failed to add friend:', err);
      alert('Failed to add friend. Try again.');
    }
  };
  

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: '#0074de', color: 'white', padding: '16px', borderRadius: '0 0 8px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>People</h1>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, username, or email"
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#333333'
            }}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div style={{ padding: '16px' }}>
        {isLoading && <p style={{ textAlign: 'center', padding: '16px' }}>Loading users...</p>}
        {error && <p style={{ color: 'red', textAlign: 'center', padding: '16px' }}>{error}</p>}
        
        {!isLoading && !error && (
          <>
            <p style={{ color: '#666666', fontSize: '14px', marginBottom: '8px' }}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
            </p>

            {/* Scrollable Container */}
            <div style={{ 
              maxHeight: '400px',  // Set a max height to enable scrolling
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              padding: '8px'
            }}>
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  style={{ 
                    padding: '12px 0', 
                    borderBottom: '1px solid #eeeeee',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      height: '48px', 
                      width: '48px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e6f2ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#0074de',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      marginRight: '12px'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div style={{ flexGrow: 1 }}>
                      <h2 style={{ fontWeight: '500', margin: 0 }}>{user.username}</h2>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#666666', 
                        margin: '4px 0 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '300px'
                      }}>
                        {user.bio || user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontWeight: '500', 
                      color: user.balance >= 0 ? '#00c853' : '#f44336',
                      marginRight: '12px'
                    }}>
                      ${Math.abs(user.balance).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleAddFriend(user.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0074de',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background 0.3s'
                      }}
                    >
                      Add Friend
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666666' }}>
                <p>No users match your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserList;
