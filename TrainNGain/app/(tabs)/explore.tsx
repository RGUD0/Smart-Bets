import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons'; // You'll need to install this if not already using Expo

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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/non-friends', {
          headers: {
            Authorization: `Bearer ${token}`,
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
    <div style={styles.container}>
      {/* Header - Styled to match FriendsScreen */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Explore People</h1>
          <button style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#388E3C" />
          </button>
        </div>
      </div>

      {/* Search Container - Styled similar to FriendsScreen */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search for people..."
          style={styles.searchInput}
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Stats Banner */}
      <div style={styles.statsBanner}>
        <p style={styles.statsText}>
          {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} available to connect
        </p>
      </div>

      {/* User List Section */}
      <div style={styles.listContainer}>
        {isLoading && <p style={styles.statusMessage}>Loading users...</p>}
        {error && <p style={{...styles.statusMessage, color: '#FF4444'}}>{error}</p>}
        
        {!isLoading && !error && (
          <div style={styles.userListContainer}>
            {filteredUsers.map(user => (
              <div key={user.id} style={styles.friendItem}>
                <div style={styles.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                
                <div style={styles.friendInfo}>
                  <h2 style={styles.friendName}>{user.username}</h2>
                  <p style={styles.friendStatus}>
                    {user.bio || user.email}
                  </p>
                </div>
                
                <div style={styles.actionContainer}>
                  <span style={{
                    ...styles.balanceText,
                    color: user.balance >= 0 ? '#28a745' : '#FF4444'
                  }}>
                    ${Math.abs(user.balance).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => handleAddFriend(user.id)}
                    style={styles.addButton}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div style={styles.emptyState}>
                <p>No users match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles object to match FriendsScreen aesthetic
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '16px',
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '16px',
    paddingVertical: '12px',
    borderBottomWidth: '1px',
    borderBottomColor: '#C8E6C9',
    borderBottom: '1px solid #C8E6C9',
    marginBottom: '16px',
    borderRadius: '8px',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#388E3C',
    fontSize: '20px',
    margin: 0,
  },
  settingsButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  searchContainer: {
    display: 'flex',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingTop: '12px',
    paddingBottom: '12px',
    fontSize: '16px',
    borderWidth: '1px',
    borderColor: '#DDDDDD',
    border: '1px solid #DDDDDD',
    width: '100%',
  },
  statsBanner: {
    backgroundColor: '#E8F5E9',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  statsText: {
    color: '#388E3C',
    margin: 0,
    fontSize: '14px',
  },
  listContainer: {
    padding: '10px',
  },
  statusMessage: {
    textAlign: 'center',
    padding: '16px',
  },
  userListContainer: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  friendItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  avatar: {
    height: '50px',
    width: '50px',
    borderRadius: '25px',
    backgroundColor: '#C8E6C9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#388E3C',
    fontWeight: 'bold',
    fontSize: '22px',
    marginRight: '12px',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333333',
    margin: 0,
  },
  friendStatus: {
    fontSize: '14px',
    color: '#888888',
    margin: '4px 0 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
  },
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  balanceText: {
    fontWeight: '500',
    marginRight: '16px',
  },
  addButton: {
    backgroundColor: '#28A745',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#666666',
  },
};

export default UserList;